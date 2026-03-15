import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import VagaClient from './VagaClient'

export const dynamic = 'force-dynamic'

export default async function VagaPage({ params }: { params: { id: string } }) {
  const [{ data: vaga }, { data: candidatos }] = await Promise.all([
    supabase.from('vagas').select('*').eq('id', params.id).single(),
    supabase.from('candidatos').select('*').eq('vaga_id', params.id).order('nota', { ascending: false }),
  ])

  if (!vaga) notFound()

  const lista = candidatos || []
  const mediaNotas =
    lista.length > 0
      ? (lista.reduce((s, c) => s + (c.nota || 0), 0) / lista.length).toFixed(1)
      : '—'

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <a href="/" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Todas as vagas
        </a>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{vaga.nome}</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Criada em {new Date(vaga.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>

          {lista.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-slate-700">{lista.length}</div>
                <div className="text-xs text-slate-400">candidatos</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-700">{mediaNotas}</div>
                <div className="text-xs text-slate-400">média</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{lista[0]?.nota ?? '—'}</div>
                <div className="text-xs text-slate-400">top nota</div>
              </div>
            </div>
          )}
        </div>

        <details className="mt-4 bg-white rounded-xl border border-slate-200">
          <summary className="px-4 py-3 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800">
            Ver descrição da vaga
          </summary>
          <p className="px-4 pb-4 text-sm text-slate-600 whitespace-pre-wrap">{vaga.descricao}</p>
        </details>
      </div>

      <VagaClient vaga={vaga} initialCandidatos={lista} />
    </div>
  )
}
