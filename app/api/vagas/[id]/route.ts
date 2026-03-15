import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.rpc('delete_vaga', { p_vaga_id: params.id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Verify deletion
    const { data } = await supabase.from('vagas').select('id').eq('id', params.id).maybeSingle()
    if (data) return NextResponse.json({ error: 'Vaga não foi apagada' }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
