import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('vagas')
    .select(`
      *,
      candidatos(count)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { nome, descricao } = body

  if (!nome || !descricao) {
    return NextResponse.json({ error: 'Nome e descrição são obrigatórios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('vagas')
    .insert({ nome, descricao })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
