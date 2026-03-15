'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function NovaVaga() {
  const router = useRouter()
  const [nomeVaga, setNomeVaga] = useState('')
  const [descricaoVaga, setDescricaoVaga] = useState('')
  const [tipoVaga, setTipoVaga] = useState('Dev')
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

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeVaga || !descricaoVaga || files.length === 0) {
      setErro('Preencha todos os campos e adicione pelo menos um CV.')
      return
    }

    setErro('')
    setLoading(true)
    setProgress(`Enviando ${files.length} currículo${files.length > 1 ? 's' : ''} para análise...`)

    const formData = new FormData()
    formData.append('nome_vaga', nomeVaga)
    formData.append('descricao_vaga', descricaoVaga)
    formData.append('tipo_vaga', tipoVaga)
    files.forEach((f) => formData.append('cvs', f))

    try {
      setProgress('Analisando currículos com IA... (pode levar alguns minutos)')
      const res = await fetch('/api/processar', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setErro(data.error || 'Erro ao processar currículos')
        setLoading(false)
        return
      }

      if (data.processados === 0) {
        setErro(`Nenhum CV foi processado. ${data.erros?.[0]?.erro || 'Verifique se os arquivos são PDFs válidos com texto selecionável (não escaneados).'}`)
        setLoading(false)
        return
      }

      if (data.erros?.length > 0) {
        setProgress(`${data.processados} processado(s). Falha em: ${data.erros.map((e: {arquivo: string}) => e.arquivo).join(', ')}`)
      }

      router.push(`/vaga/${data.vaga_id}`)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <a href="/" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </a>
        <h1 className="text-2xl font-bold text-slate-800">Nova Vaga</h1>
        <p className="text-slate-500 mt-1">Preencha os dados e faça upload dos currículos para análise com IA</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nome da Vaga <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nomeVaga}
              onChange={(e) => setNomeVaga(e.target.value)}
              placeholder="Ex: Desenvolvedor Full-Stack"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tipo de Vaga <span className="text-red-500">*</span>
            </label>
            <select
              value={tipoVaga}
              onChange={(e) => setTipoVaga(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              disabled={loading}
            >
              <option value="Dev">Dev (Backend / Frontend / Fullstack)</option>
              <option value="Designer">Designer</option>
              <option value="Gestor de Tráfego">Gestor de Tráfego</option>
              <option value="SDR">SDR</option>
              <option value="Closer">Closer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descrição da Vaga <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descricaoVaga}
              onChange={(e) => setDescricaoVaga(e.target.value)}
              placeholder="Descreva o perfil ideal do candidato, competências exigidas, experiência necessária, localização, etc."
              rows={6}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-4">
            Currículos (PDF) <span className="text-red-500">*</span>
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 text-sm">Clique para selecionar currículos</p>
            <p className="text-slate-400 text-xs mt-1">PDF ou DOCX — múltiplos arquivos</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
          </div>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f) => (
                <li key={f.name} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-slate-600 truncate">{f.name}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(f.name)}
                    className="text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            {erro}
          </div>
        )}

        {loading && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-indigo-700 text-sm">{progress}</p>
            </div>
            <div className="mt-3 w-full bg-indigo-100 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analisando...' : `Analisar ${files.length > 0 ? files.length + ' currículo' + (files.length > 1 ? 's' : '') : 'currículos'}`}
        </button>
      </form>
    </div>
  )
}
