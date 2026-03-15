import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { processCV, textQualityOk } from '@/lib/groq'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export const maxDuration = 300

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()

  if (name.endsWith('.pdf')) {
    const data = await pdfParse(buffer)
    return data.text
  }

  if (name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`Formato não suportado: ${file.name}. Use PDF ou DOCX.`)
}

async function uploadCV(file: File, vagaId: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'pdf'
    const path = `${vagaId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { error } = await supabase.storage
      .from('curriculos')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (error) return null

    const { data } = supabase.storage.from('curriculos').getPublicUrl(path)
    return data.publicUrl
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'COLOQUE_SUA_GROQ_API_KEY_AQUI') {
      return NextResponse.json(
        { error: 'GROQ_API_KEY não configurada. Adicione sua chave no arquivo .env.local' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const vagaId = formData.get('vaga_id') as string | null
    const nomeVaga = formData.get('nome_vaga') as string
    const descricaoVaga = formData.get('descricao_vaga') as string
    const tipoVaga = (formData.get('tipo_vaga') as string) || 'Dev'
    const cvFiles = formData.getAll('cvs') as File[]

    if (!cvFiles || cvFiles.length === 0) {
      return NextResponse.json({ error: 'Nenhum CV enviado' }, { status: 400 })
    }

    let vaga: { id: string; descricao: string }

    if (vagaId) {
      const { data, error } = await supabase.from('vagas').select('*').eq('id', vagaId).single()
      if (error || !data) return NextResponse.json({ error: 'Vaga não encontrada' }, { status: 404 })
      vaga = data
    } else {
      if (!nomeVaga || !descricaoVaga) {
        return NextResponse.json({ error: 'Nome e descrição da vaga são obrigatórios' }, { status: 400 })
      }
      const { data, error } = await supabase
        .from('vagas')
        .insert({ nome: nomeVaga, descricao: descricaoVaga, tipo_vaga: tipoVaga })
        .select()
        .single()
      if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 })
      vaga = data
    }

    const resultados = []
    const erros = []

    for (const file of cvFiles) {
      try {
        const text = await extractText(file)
        const quality = textQualityOk(text)

        console.log(`[${file.name}] chars=${text.length} quality=${quality.ok} reason=${quality.reason || 'ok'}`)
        console.log(`[${file.name}] preview: ${text.substring(0, 300).replace(/\n/g, ' ')}`)

        if (!quality.ok) {
          erros.push({ arquivo: file.name, erro: quality.reason || 'Texto extraído inválido' })
          continue
        }

        const cvUrl = await uploadCV(file, vaga.id)
        const vagaTipoVaga = (vaga as { id: string; descricao: string; tipo_vaga?: string }).tipo_vaga || tipoVaga
        const candidato = await processCV(text, vaga.id, vaga.descricao, file.name, cvUrl, vagaTipoVaga)
        resultados.push(candidato)
      } catch (err) {
        erros.push({ arquivo: file.name, erro: String(err) })
      }
    }

    const ranking = [...resultados].sort((a, b) => (b.nota || 0) - (a.nota || 0))

    return NextResponse.json({
      vaga_id: vaga.id,
      total: cvFiles.length,
      processados: resultados.length,
      erros,
      ranking,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
