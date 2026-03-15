'use client'

import { useState, useRef } from 'react'

interface Candidato {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  cidade: string | null
  formacao: string | null
  historico: string | null
  habilidades: string | null
  resumo: string | null
  nota: number
  analise: string | null
  status: string
  cv_url: string | null
}

interface Vaga {
  id: string
  nome: string
  descricao: string
  tipo_vaga: string
}

interface RichAnalise {
  tipo_vaga?: string
  nota_hard?: number
  nota_soft?: number
  nota_final?: number
  penalidades_aplicadas?: string[]
  analise?: {
    hard_skills?: { confirmadas?: string[]; parciais?: string[]; ausentes?: string[] }
    soft_skills?: { evidenciadas?: string[]; apenas_declaradas?: string[]; ausentes?: string[] }
    pontos_fortes?: string
    pontos_fracos?: string
    veredito?: string
  }
}

function parseAnalise(raw: string | null): RichAnalise | null {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function AnaliseView({ raw }: { raw: string | null }) {
  const rich = parseAnalise(raw)

  if (!rich?.analise) {
    return raw ? <p className="text-xs text-slate-600 leading-relaxed">{raw}</p> : null
  }

  const { analise, nota_hard, nota_soft, penalidades_aplicadas } = rich
  const penalidades = (penalidades_aplicadas || []).filter((p) => p !== 'nenhuma')

  return (
    <div className="space-y-3 text-xs">
      {/* Notas */}
      <div className="flex gap-3">
        {nota_hard != null && (
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">Hard</p>
            <p className="text-blue-700 font-bold text-base">{nota_hard}</p>
          </div>
        )}
        {nota_soft != null && (
          <div className="bg-purple-50 rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wide">Soft</p>
            <p className="text-purple-700 font-bold text-base">{nota_soft}</p>
          </div>
        )}
        {penalidades.length > 0 && (
          <div className="bg-red-50 rounded-lg px-3 py-2 flex-1">
            <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide mb-1">Penalidades</p>
            {penalidades.map((p, i) => <p key={i} className="text-red-600">{p}</p>)}
          </div>
        )}
      </div>

      {/* Veredito */}
      {analise.veredito && (
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Veredito</p>
          <p className="text-slate-700 leading-relaxed">{analise.veredito}</p>
        </div>
      )}

      {/* Pontos */}
      <div className="grid grid-cols-2 gap-2">
        {analise.pontos_fortes && (
          <div className="bg-green-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wide mb-1">Pontos Fortes</p>
            <p className="text-slate-600 leading-relaxed">{analise.pontos_fortes}</p>
          </div>
        )}
        {analise.pontos_fracos && (
          <div className="bg-orange-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-orange-600 font-semibold uppercase tracking-wide mb-1">Pontos Fracos</p>
            <p className="text-slate-600 leading-relaxed">{analise.pontos_fracos}</p>
          </div>
        )}
      </div>

      {/* Hard Skills */}
      {analise.hard_skills && (
        <div className="bg-slate-50 rounded-lg px-3 py-2 space-y-2">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Hard Skills</p>
          {(analise.hard_skills.confirmadas?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] text-green-600 font-medium mb-1">✓ Confirmadas</p>
              <ul className="space-y-0.5">{analise.hard_skills.confirmadas!.map((s, i) => <li key={i} className="text-slate-600">• {s}</li>)}</ul>
            </div>
          )}
          {(analise.hard_skills.parciais?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] text-yellow-600 font-medium mb-1">~ Parciais</p>
              <ul className="space-y-0.5">{analise.hard_skills.parciais!.map((s, i) => <li key={i} className="text-slate-600">• {s}</li>)}</ul>
            </div>
          )}
          {(analise.hard_skills.ausentes?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] text-red-500 font-medium mb-1">✗ Ausentes</p>
              <ul className="space-y-0.5">{analise.hard_skills.ausentes!.map((s, i) => <li key={i} className="text-slate-600">• {s}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const COLUNAS = [
  { id: 'Triagem',    label: 'Triagem',    color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400'  },
  { id: 'Contato',   label: 'Contato',    color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { id: 'Entrevista',label: 'Entrevista', color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500'   },
  { id: 'Follow Up', label: 'Follow Up',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  { id: 'Aprovado',  label: 'Aprovado',   color: 'bg-green-100 text-green-700',   dot: 'bg-green-500'  },
]

function colStyle(status: string) {
  return COLUNAS.find((c) => c.id === status) ?? COLUNAS[0]
}

function ScoreBadge({ nota, size = 'md' }: { nota: number; size?: 'sm' | 'md' }) {
  const color =
    nota >= 8 ? 'bg-green-100 text-green-800' :
    nota >= 6 ? 'bg-yellow-100 text-yellow-800' :
    nota >= 4 ? 'bg-orange-100 text-orange-800' :
    'bg-red-100 text-red-800'
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <span className={`inline-flex items-center justify-center rounded-lg font-bold shrink-0 ${color} ${dim}`}>
      {nota}
    </span>
  )
}

function DownloadBtn({ cvUrl, vagaNome, candidatoNome }: { cvUrl: string; vagaNome: string; candidatoNome: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    const ext = cvUrl.split('.').pop()?.split('?')[0] || 'pdf'
    const filename = `${vagaNome} - ${candidatoNome}.${ext}`
    const href = `/api/download?url=${encodeURIComponent(cvUrl)}&filename=${encodeURIComponent(filename)}`
    const a = document.createElement('a')
    a.href = href
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50 shrink-0"
    >
      {loading ? (
        <span className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      Baixar CV
    </button>
  )
}

// ─── KANBAN CARD ────────────────────────────────────────────────────────────

function KanbanCard({
  c, vagaNome, onMove, onDelete, dragging, onDragStart, onDragEnd,
}: {
  c: Candidato; vagaNome: string
  onMove: (id: string, status: string) => void
  onDelete: (id: string) => void  // opens confirm modal
  dragging: boolean; onDragStart: () => void; onDragEnd: () => void
}) {
  const skills = c.habilidades
    ? c.habilidades.split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 5)
    : []

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-xl border border-slate-200 p-3.5 cursor-grab active:cursor-grabbing select-none transition-all ${
        dragging ? 'opacity-40 scale-95' : 'hover:shadow-sm hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <ScoreBadge nota={c.nota} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm leading-tight">{c.nome}</p>
          {c.cidade && <p className="text-xs text-slate-400 mt-0.5">{c.cidade}</p>}
        </div>
      </div>

      {c.resumo && (
        <p className="text-xs text-slate-500 mt-2.5 leading-relaxed line-clamp-3">{c.resumo}</p>
      )}

      {skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {skills.map((s) => (
            <span key={s} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{s}</span>
          ))}
        </div>
      )}

      {c.analise && (
        <details className="mt-2.5" onClick={(e) => e.stopPropagation()}>
          <summary className="text-[10px] font-medium text-indigo-500 cursor-pointer">Ver análise</summary>
          <div className="mt-1.5"><AnaliseView raw={c.analise} /></div>
        </details>
      )}

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {COLUNAS.filter((col) => col.id !== c.status).map((col) => (
            <button
              key={col.id}
              onClick={(e) => { e.stopPropagation(); onMove(c.id, col.id) }}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
            >
              → {col.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {c.cv_url && <DownloadBtn cvUrl={c.cv_url} vagaNome={vagaNome} candidatoNome={c.nome} />}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}
            className="text-[10px] px-2 py-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Apagar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── LIST VIEW ───────────────────────────────────────────────────────────────

function ListView({
  candidatos, vagaNome, onMove, onDelete,
}: {
  candidatos: Candidato[]; vagaNome: string
  onMove: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const sorted = [...candidatos].sort((a, b) => (b.nota || 0) - (a.nota || 0))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-8">#</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Candidato</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Habilidades</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-16">Nota</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Etapa</th>
            <th className="px-4 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sorted.map((c, i) => {
            const col = colStyle(c.status)
            const skills = c.habilidades
              ? c.habilidades.split(/[,;]/).map((s) => s.trim()).filter(Boolean).slice(0, 4)
              : []

            return (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3 text-slate-400 font-medium text-xs">{i + 1}</td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-indigo-600">{c.nome.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{c.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {c.cidade && <span className="text-xs text-slate-400">{c.cidade}</span>}
                        {c.email && <span className="text-xs text-slate-400 hidden lg:inline truncate max-w-[180px]">{c.email}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Expandable details */}
                  {(c.resumo || c.analise) && (
                    <details className="mt-2 ml-11">
                      <summary className="text-xs text-indigo-500 cursor-pointer font-medium">Ver resumo</summary>
                      <div className="mt-2 space-y-2">
                        {c.resumo && <p className="text-xs text-slate-500 leading-relaxed">{c.resumo}</p>}
                        {c.analise && (
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-[10px] font-semibold text-slate-400 mb-2">ANÁLISE IA</p>
                            <AnaliseView raw={c.analise} />
                          </div>
                        )}
                        {(c.formacao || c.historico) && (
                          <div className="grid grid-cols-2 gap-2">
                            {c.formacao && (
                              <div className="bg-slate-50 rounded-lg p-2">
                                <p className="text-[10px] font-semibold text-slate-400 mb-1">FORMAÇÃO</p>
                                <p className="text-xs text-slate-600">{c.formacao}</p>
                              </div>
                            )}
                            {c.historico && (
                              <div className="bg-slate-50 rounded-lg p-2">
                                <p className="text-[10px] font-semibold text-slate-400 mb-1">HISTÓRICO</p>
                                <p className="text-xs text-slate-600">{c.historico}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </td>

                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {skills.map((s) => (
                      <span key={s} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </td>

                <td className="px-4 py-3 text-center">
                  <ScoreBadge nota={c.nota} size="sm" />
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                    <select
                      value={c.status}
                      onChange={(e) => onMove(c.id, e.target.value)}
                      className="text-xs text-slate-600 bg-transparent border-0 outline-none cursor-pointer pr-1 font-medium"
                    >
                      {COLUNAS.map((col) => (
                        <option key={col.id} value={col.id}>{col.label}</option>
                      ))}
                    </select>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {c.cv_url && <DownloadBtn cvUrl={c.cv_url} vagaNome={vagaNome} candidatoNome={c.nome} />}
                    <button
                      onClick={() => onDelete(c.id)}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Apagar
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── ADD CVs MODAL ───────────────────────────────────────────────────────────

function AddCVsModal({ vagaId, onClose, onSuccess }: { vagaId: string; onClose: () => void; onSuccess: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [erro, setErro] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).filter(
      (f) => f.type === 'application/pdf' || f.name.endsWith('.docx')
    )
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      return [...prev, ...selected.filter((f) => !existing.has(f.name))]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (files.length === 0) { setErro('Selecione pelo menos um CV.'); return }
    setErro('')
    setLoading(true)
    setProgress(`Analisando ${files.length} currículo${files.length > 1 ? 's' : ''} com IA...`)

    const formData = new FormData()
    formData.append('vaga_id', vagaId)
    files.forEach((f) => formData.append('cvs', f))

    try {
      const res = await fetch('/api/processar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao processar'); setLoading(false); return }

      if (data.erros?.length > 0 && data.processados === 0) {
        setErro(`Nenhum CV processado. ${data.erros[0].erro}`)
        setLoading(false)
        return
      }
      if (data.erros?.length > 0) {
        // Some worked, some failed — show warning but still proceed
        setProgress(`${data.processados} processado(s). Falhas: ${data.erros.map((e: {arquivo: string}) => e.arquivo).join(', ')}`)
        await new Promise(r => setTimeout(r, 2500))
      }
      onSuccess()
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">Adicionar Currículos</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-500">Clique para selecionar currículos</p>
            <p className="text-xs text-slate-400 mt-0.5">PDF ou DOCX</p>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx" multiple onChange={handleFileChange} className="hidden" disabled={loading} />
          </div>

          {files.length > 0 && (
            <ul className="space-y-1.5 max-h-36 overflow-y-auto">
              {files.map((f) => (
                <li key={f.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-600 truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles((p) => p.filter((x) => x.name !== f.name))} disabled={loading} className="text-slate-400 hover:text-red-500 ml-2 shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

          {loading && (
            <div className="flex items-center gap-2 text-indigo-600 text-sm">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
              {progress}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || files.length === 0}
            className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analisando...' : `Analisar ${files.length || ''} currículo${files.length !== 1 ? 's' : ''}`}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function VagaClient({ vaga, initialCandidatos }: { vaga: Vaga; initialCandidatos: Candidato[] }) {
  const [candidatos, setCandidatos] = useState(initialCandidatos)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showAddCVs, setShowAddCVs] = useState(false)
  const [view, setView] = useState<'kanban' | 'lista'>('kanban')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  async function deleteCandidate(id: string) {
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/candidatos/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.error || 'Erro ao apagar. Tente novamente.')
        setDeleting(false)
        return
      }
      // Only remove from state after confirmed by server
      setCandidatos((prev) => prev.filter((c) => c.id !== id))
      setConfirmDelete(null)
    } catch {
      setDeleteError('Erro de conexão. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  async function moveCandidate(id: string, newStatus: string) {
    setCandidatos((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)))
    await fetch(`/api/candidatos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  function handleDrop(e: React.DragEvent, colId: string) {
    e.preventDefault()
    if (draggingId) moveCandidate(draggingId, colId)
    setDraggingId(null)
    setDragOverCol(null)
  }

  const totalPorColuna = Object.fromEntries(
    COLUNAS.map((col) => [col.id, candidatos.filter((c) => c.status === col.id).length])
  )

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <span className="text-sm text-slate-500">
          {candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('lista')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                view === 'lista' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Lista
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                view === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Kanban
            </button>
          </div>

          <button
            onClick={() => setShowAddCVs(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar CVs
          </button>
        </div>
      </div>

      {/* Content */}
      {candidatos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 text-sm">Nenhum candidato ainda. Adicione currículos para começar.</p>
        </div>
      ) : view === 'lista' ? (
        <ListView candidatos={candidatos} vagaNome={vaga.nome} onMove={moveCandidate} onDelete={(id) => { setDeleteError(''); setConfirmDelete(id) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-start overflow-x-auto pb-4">
          {COLUNAS.map((col) => {
            const cards = candidatos.filter((c) => c.status === col.id)
            const isOver = dragOverCol === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-2xl border-2 transition-colors min-h-[120px] ${
                  isOver ? 'border-indigo-400 bg-indigo-50' : 'border-transparent bg-slate-100'
                }`}
              >
                <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.color}`}>
                    {totalPorColuna[col.id]}
                  </span>
                </div>

                <div className="px-3 pb-3 space-y-2.5">
                  {cards
                    .sort((a, b) => (b.nota || 0) - (a.nota || 0))
                    .map((c) => (
                      <KanbanCard
                        key={c.id}
                        c={c}
                        vagaNome={vaga.nome}
                        onMove={moveCandidate}
                        onDelete={(id) => { setDeleteError(''); setConfirmDelete(id) }}
                        dragging={draggingId === c.id}
                        onDragStart={() => setDraggingId(c.id)}
                        onDragEnd={() => { setDraggingId(null); setDragOverCol(null) }}
                      />
                    ))}

                  {cards.length === 0 && (
                    <div className={`rounded-xl border-2 border-dashed py-6 text-center transition-colors ${
                      isOver ? 'border-indigo-300' : 'border-slate-200'
                    }`}>
                      <p className="text-xs text-slate-400">Solte aqui</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmDelete && (() => {
        const c = candidatos.find((x) => x.id === confirmDelete)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setConfirmDelete(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">Apagar candidato?</h3>
              <p className="text-sm text-slate-500 mb-4">
                <span className="font-medium text-slate-700">{c?.nome}</span> será removido permanentemente, incluindo o currículo armazenado.
              </p>
              {deleteError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmDelete(null); setDeleteError('') }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteCandidate(confirmDelete)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {deleting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {deleting ? 'Apagando...' : 'Apagar'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {showAddCVs && (
        <AddCVsModal
          vagaId={vaga.id}
          onClose={() => setShowAddCVs(false)}
          onSuccess={() => {
            setShowAddCVs(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
