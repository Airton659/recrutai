import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('candidatos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  // Get cv_url before deleting to remove from storage
  const { data: candidato } = await supabase
    .from('candidatos')
    .select('cv_url')
    .eq('id', params.id)
    .single()

  // Use SECURITY DEFINER RPC to bypass RLS and guarantee the delete executes
  const { error } = await supabase.rpc('delete_candidato', { candidato_id: params.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Verify the row is actually gone
  const { data: check } = await supabase
    .from('candidatos').select('id').eq('id', params.id).maybeSingle()
  if (check) return NextResponse.json({ error: 'Falha ao apagar registro' }, { status: 500 })

  // Remove file from storage if exists
  if (candidato?.cv_url) {
    try {
      const url = new URL(candidato.cv_url)
      const path = url.pathname.split('/curriculos/')[1]
      if (path) await supabase.storage.from('curriculos').remove([decodeURIComponent(path)])
    } catch { /* ignore storage errors */ }
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('candidatos')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
