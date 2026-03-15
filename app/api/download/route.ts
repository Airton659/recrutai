import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  const filename = request.nextUrl.searchParams.get('filename')

  if (!url || !filename) {
    return new NextResponse('Missing params', { status: 400 })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) return new NextResponse('File not found', { status: 404 })

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'

    // Sanitize filename
    const safe = filename.replace(/[^\w\s\-_.()]/g, '').trim()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safe}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch {
    return new NextResponse('Download failed', { status: 500 })
  }
}
