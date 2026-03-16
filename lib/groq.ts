import Groq from 'groq-sdk'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from './supabase'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

function parseJSON(text: string): Record<string, unknown> {
  try { return JSON.parse(text) } catch { /* */ }
  const match = text.match(/\{[\s\S]*\}/)
  if (match) { try { return JSON.parse(match[0]) } catch { /* */ } }
  return {}
}

// Checks whether extracted text has enough real readable words to be useful.
// PDFs with encoding issues produce mostly symbols/garbage — this catches that.
export function textQualityOk(text: string): { ok: boolean; reason?: string } {
  const trimmed = text.trim()
  if (trimmed.length < 100) return { ok: false, reason: 'Texto extraído muito curto' }

  // Count real words: 3+ consecutive alphabetic characters (latin range)
  const realWords = trimmed.match(/[a-zA-ZÀ-ÿ]{3,}/g) || []
  if (realWords.length < 25) {
    return {
      ok: false,
      reason: `Texto extraído parece corrompido (${realWords.length} palavras reais encontradas). O PDF pode ser baseado em imagem ou ter codificação inválida.`,
    }
  }

  // Check ratio of printable vs total chars — too many symbols = garbage
  const printable = trimmed.match(/[a-zA-ZÀ-ÿ0-9\s.,;:()\-@]/g) || []
  const ratio = printable.length / trimmed.length
  if (ratio < 0.5) {
    return {
      ok: false,
      reason: 'PDF com muitos caracteres especiais/corrompidos. Tente exportar o PDF novamente.',
    }
  }

  return { ok: true }
}

export async function extractDados(text: string) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `Você é um algoritmo ATS. Extraia dados do currículo e responda SOMENTE com um objeto JSON válido, sem nenhum texto antes ou depois. Use null para campos não encontrados. NUNCA invente informações.`,
    messages: [
      {
        role: 'user',
        content: `Extraia do currículo abaixo e retorne APENAS o JSON:\n\n${text.substring(0, 8000)}\n\nFormato obrigatório:\n{\n  "nome": null,\n  "email": null,\n  "telefone": null,\n  "cidade": null,\n  "data_nascimento": null,\n  "formacao": null,\n  "historico": null,\n  "habilidades": ["habilidade1", "habilidade2"]\n}\n\nRegras para habilidades:\n- Array de strings, uma por item\n- Apenas o nome da habilidade, sem categorias ou prefixos\n- Extraia do CV: ferramentas, metodologias, plataformas, técnicas, idiomas\n- Máximo 20 itens`,
      },
    ],
  })
  const block = response.content[0]
  return parseJSON(block.type === 'text' ? block.text : '{}')
}

export async function summarizeCandidate(dados: Record<string, unknown>) {
  const partes = [
    dados.nome && `Nome: ${toStr(dados.nome)}`,
    dados.cidade && `Cidade: ${toStr(dados.cidade)}`,
    dados.formacao && `Formação: ${toStr(dados.formacao)}`,
    dados.historico && `Experiência: ${toStr(dados.historico)}`,
    dados.habilidades && `Habilidades: ${toStr(dados.habilidades)}`,
  ].filter(Boolean)

  if (partes.length < 2) return 'Informações insuficientes no currículo para gerar resumo.'

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Você escreve resumos profissionais em português brasileiro. Use APENAS as informações fornecidas. Máximo 80 palavras. Escreva diretamente o resumo, sem introdução, sem "o candidato é" no início — comece pelo nome ou pela experiência. NUNCA diga que não há informações suficientes.`,
      },
      {
        role: 'user',
        content: partes.join('\n'),
      },
    ],
    temperature: 0.2,
  })

  const result = response.choices[0].message.content?.trim() || ''

  if (
    result.toLowerCase().includes('não há informações') ||
    result.toLowerCase().includes('infelizmente') ||
    result.toLowerCase().includes('não foi possível') ||
    result.length < 20
  ) {
    return [
      toStr(dados.nome),
      dados.cidade && `de ${toStr(dados.cidade)}`,
      toStr(dados.formacao),
      dados.habilidades && `Habilidades: ${toStr(dados.habilidades)}`,
    ]
      .filter(Boolean)
      .join('. ')
  }

  return result
}

const EVAL_SYSTEM_PROMPT = `Você é um sistema especializado em avaliação de candidatos. Sua função é analisar o match entre um CV e uma Job Description com base no tipo de vaga informado.

═══════════════════════════════════════════
PESOS POR TIPO DE VAGA
═══════════════════════════════════════════

DEV (Backend / Frontend / Fullstack)
  Hard Skills: 80% | Soft Skills: 20%
  Hard: linguagens, frameworks, libs, ferramentas, cloud, CI/CD, banco de dados
  Soft: comunicação técnica, trabalho em equipe, autonomia, resolução de problemas

DESIGNER
  Hard Skills: 70% | Soft Skills: 30%
  Hard: ferramentas (Figma, Adobe, etc.), domínio de UI/UX, prototipação, design system, motion
  Soft: criatividade aplicada, receptividade a feedback, comunicação visual, colaboração

GESTOR DE TRÁFEGO
  Hard Skills: 70% | Soft Skills: 30%
  Hard: plataformas (Meta Ads, Google Ads, etc.), análise de métricas, gestão de budget, CRO, UTM/tracking
  Soft: pensamento analítico, organização, proatividade, comunicação com cliente

SDR
  Hard Skills: 40% | Soft Skills: 60%
  Hard: CRM (HubSpot, Salesforce, Pipedrive, etc.), cadências, ferramentas de prospecção (Apollo, LinkedIn Sales Navigator, etc.)
  Soft: comunicação, resiliência, escuta ativa, organização, orientação a metas

CLOSER
  Hard Skills: 40% | Soft Skills: 60%
  Hard: CRM, conhecimento de funil, metodologias de vendas (SPIN, BANT, Challenger, etc.)
  Soft: persuasão, inteligência emocional, gestão de objeções, foco em resultado, comunicação

═══════════════════════════════════════════
FASE 1 — EXTRAÇÃO (obrigatória antes de avaliar)
═══════════════════════════════════════════

Extraia e liste explicitamente:

A) REQUISITOS DA VAGA
   - Hard skills obrigatórias
   - Hard skills desejáveis
   - Soft skills mencionadas ou implícitas no perfil da vaga
   - Senioridade/experiência exigida

B) PERFIL DO CANDIDATO
   - Hard skills com experiência profissional comprovada no CV (cite empresa ou projeto)
   - Hard skills mencionadas como "básico", "estudando" ou "conhecimento" → NÃO contam como domínio. Liste separadamente.
   - Soft skills com evidência no CV (realizações, contexto, liderança, etc.)
   - Soft skills apenas declaradas sem evidência ("sou comunicativo") → peso reduzido, sinalize.
   - Tempo de experiência total e por área relevante

REGRA DE OURO: Se não está escrito no CV, não existe. Não infira, não invente, não complete com suposições.

═══════════════════════════════════════════
FASE 2 — COMPARAÇÃO ITEM A ITEM
═══════════════════════════════════════════

Para cada hard skill obrigatória:
  [✓] CONFIRMADO — experiência profissional comprovada no CV
  [~] PARCIAL — tecnologia correlata, versão diferente ou uso não-profissional
  [✗] AUSENTE — não encontrado no CV

Para cada soft skill relevante:
  [✓] EVIDENCIADA — há contexto, conquista ou situação que comprova
  [~] DECLARADA — candidato afirma possuir, mas sem evidência concreta
  [✗] AUSENTE — não mencionada nem inferível

═══════════════════════════════════════════
FASE 3 — PENALIDADES
═══════════════════════════════════════════

P1 — FERRAMENTA/LINGUAGEM CORE AUSENTE
   Se a vaga exige uma ferramenta ou linguagem central E o candidato não a possui com experiência comprovada → nota de hard skills limitada a 4.
   Exemplos: vaga Dev Python sem Python no histórico; vaga Gestor sem Meta Ads ou Google Ads.

P2 — SENIORIDADE
   Vaga sênior (5+ anos) e candidato com menos de 3 anos → desconta 2 pontos da nota final.
   Vaga pleno (3+ anos) e candidato com menos de 1 ano → desconta 2 pontos da nota final.

P3 — ÁREA DIVERGENTE
   Se a área principal do candidato é diferente da vaga (ex: candidato dev aplicando pra closer) → nota máxima geral = 4.

═══════════════════════════════════════════
FASE 4 — CÁLCULO DA NOTA
═══════════════════════════════════════════

1. Calcule a nota de hard skills (1-10) com base no percentual de itens obrigatórios [✓] ou [~]:
     90-100% em [✓]       → 9-10
     70-89%  em [✓]/[~]   → 7-8
     50-69%  em [✓]/[~]   → 5-6
     30-49%               → 3-4
     < 30%                → 1-2

2. Calcule a nota de soft skills (1-10):
     Maioria [✓] evidenciadas     → 8-10
     Mix de [✓] e [~]             → 5-7
     Maioria [~] sem evidência    → 3-4
     Maioria [✗]                  → 1-2

3. Aplique os pesos do tipo de vaga:
     nota_final = (nota_hard × peso_hard) + (nota_soft × peso_soft)

4. Aplique penalidades da Fase 3. O teto imposto por penalidades nunca pode ser ultrapassado.

5. Arredonde para inteiro. Mínimo 1, máximo 10.

Escala de referência:
  9-10 → Excepcional. Match sólido em hard e soft.
  7-8  → Forte. Domina o essencial, lacunas mínimas.
  5-6  → Regular. Base presente, mas gaps relevantes.
  3-4  → Fraco. Pouco alinhamento com o perfil exigido.
  1-2  → Irrelevante. Área ou perfil totalmente divergente.

═══════════════════════════════════════════
FASE 5 — OUTPUT
═══════════════════════════════════════════

Retorne EXCLUSIVAMENTE o JSON abaixo. Nenhum texto fora do JSON.

{
  "tipo_vaga": "<tipo informado>",
  "nota_hard": <inteiro 1-10>,
  "nota_soft": <inteiro 1-10>,
  "nota_final": <inteiro 1-10>,
  "penalidades_aplicadas": ["<P1/P2/P3 ativadas, ou 'nenhuma'>"],
  "analise": {
    "hard_skills": {
      "confirmadas": ["<skill — evidência no CV>"],
      "parciais": ["<skill — motivo do parcial>"],
      "ausentes": ["<skill>"]
    },
    "soft_skills": {
      "evidenciadas": ["<skill — contexto no CV>"],
      "apenas_declaradas": ["<skill>"],
      "ausentes": ["<skill>"]
    },
    "pontos_fortes": "<síntese do que o candidato tem de melhor para essa vaga>",
    "pontos_fracos": "<síntese das lacunas críticas>",
    "veredito": "<2-3 frases objetivas explicando a nota final, mencionando penalidades se houver>"
  }
}`

export async function evaluateCandidate(
  jobDescription: string,
  cvText: string,
  tipoVaga: string
) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: EVAL_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `## TIPO DE VAGA\n${tipoVaga}\n\n## JOB DESCRIPTION\n${jobDescription}\n\n## CV DO CANDIDATO\n${cvText.substring(0, 8000)}`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type === 'text') return parseJSON(block.text)
  return {}
}

// Converts any extracted field to a flat string regardless of what the model returned
function toStr(val: unknown): string | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'string') return val.trim() || null
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null) {
          const o = item as Record<string, unknown>
          const parts = [o.cargo, o.empresa, o.data_inicio && o.data_fim ? `${o.data_inicio} – ${o.data_fim}` : null]
          return parts.filter(Boolean).join(' | ')
        }
        return String(item)
      })
      .filter(Boolean)
      .join('\n')
  }
  if (typeof val === 'object') {
    // Extract all leaf values, ignoring internal keys
    return Object.values(val as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .map((v) => (typeof v === 'string' ? v : String(v)))
      .filter(Boolean)
      .join(', ')
  }
  return String(val)
}

export async function processCV(
  text: string,
  vagaId: string,
  jobDescription: string,
  filename: string,
  cvUrl: string | null = null,
  tipoVaga: string = 'Dev'
) {
  const dados = await extractDados(text)
  const resumo = await summarizeCandidate(dados)
  const avaliacao = await evaluateCandidate(jobDescription, text, tipoVaga)

  const notaFinal = avaliacao.nota_final ?? avaliacao.nota
  const nota =
    typeof notaFinal === 'number'
      ? Math.min(10, Math.max(1, Math.round(notaFinal)))
      : parseInt(String(notaFinal || '0').replace(/\D/g, '')) || 0

  const candidato = {
    vaga_id: vagaId,
    nome: toStr(dados.nome) || filename.replace(/\.(pdf|docx)$/i, ''),
    email: toStr(dados.email),
    telefone: toStr(dados.telefone),
    cidade: toStr(dados.cidade),
    data_nascimento: toStr(dados.data_nascimento),
    formacao: toStr(dados.formacao),
    historico: toStr(dados.historico),
    habilidades: toStr(dados.habilidades),
    resumo,
    nota,
    analise: JSON.stringify(avaliacao),
    status: 'Triagem',
    cv_url: cvUrl,
  }

  const { data, error } = await supabase
    .from('candidatos')
    .insert(candidato)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
