import { supabase } from '@/lib/supabase'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: vagas } = await supabase
    .from('vagas')
    .select('*, candidatos(count)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Vagas</h1>
        <p className="text-slate-500 mt-1">Gerencie suas vagas e analise candidatos com IA</p>
      </div>
      <HomeClient initialVagas={(vagas as Parameters<typeof HomeClient>[0]['initialVagas']) ?? []} />
    </div>
  )
}
