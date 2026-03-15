'use client'

import { useState } from 'react'

interface Vaga {
  id: string
  nome: string
  descricao: string
  created_at: string
  tipo_vaga: string
  candidatos: { count: number }[]
}

export default function HomeClient({ initialVagas }: { initialVagas: Vaga[] }) {
  const [vagas, setVagas] = useState(initialVagas)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function deleteVaga(id: string) {
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/vagas/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setDeleteError(data.error || 'Erro ao apagar. Tente novamente.')
        setDeleting(false)
        return
      }
      setVagas((prev) => prev.filter((v) => v.id !== id))
      setConfirmDelete(null)
    } catch {
      setDeleteError('Erro de conexão. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  const vagaToDelete = vagas.find((v) => v.id === confirmDelete)

  return (
    <>
      {vagas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">Nenhuma vaga ainda</h3>
          <p className="text-slate-400 text-sm mb-6">Crie sua primeira vaga e faça upload dos currículos para análise</p>
          <a
            href="/nova-vaga"
            className="inline-block bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Criar primeira vaga
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {vagas.map((vaga) => {
            const count = vaga.candidatos?.[0]?.count ?? 0
            return (
              <div key={vaga.id} className="relative group">
                <a
                  href={`/vaga/${vaga.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-10">
                      <h2 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                        {vaga.nome}
                      </h2>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{vaga.descricao}</p>
                    </div>
                    <div className="ml-6 flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-700">{count}</div>
                        <div className="text-xs text-slate-400">candidato{count !== 1 ? 's' : ''}</div>
                      </div>
                      <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                      {new Date(vaga.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {vaga.tipo_vaga && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">
                        {vaga.tipo_vaga}
                      </span>
                    )}
                    {count > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                        Triagem
                      </span>
                    )}
                  </div>
                </a>

                {/* Delete button */}
                <button
                  onClick={() => { setConfirmDelete(vaga.id); setDeleteError('') }}
                  className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                  title="Apagar vaga"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Apagar vaga?</h3>
            <p className="text-slate-500 text-sm mb-1">
              <span className="font-medium text-slate-700">{vagaToDelete?.nome}</span>
            </p>
            <p className="text-red-600 text-sm mb-5">
              Todos os candidatos e currículos desta vaga serão apagados permanentemente.
            </p>
            {deleteError && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mb-4">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteVaga(confirmDelete)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {deleting ? 'Apagando...' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
