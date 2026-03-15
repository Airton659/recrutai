import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret')

function getUsers(): Record<string, string> {
  const users: Record<string, string> = {}
  const raw = process.env.AUTH_USERS || ''
  for (const entry of raw.split(',')) {
    const [user, pass] = entry.trim().split(':')
    if (user && pass) users[user.toLowerCase()] = pass
  }
  return users
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const users = getUsers()
  const stored = users[username?.toLowerCase()]

  if (!stored || stored !== password) {
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  }

  const token = await new SignJWT({ username: username.toLowerCase() })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)

  const res = NextResponse.json({ ok: true })
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
