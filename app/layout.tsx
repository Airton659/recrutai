import type { Metadata } from 'next'
import './globals.css'
import LogoutButton from './LogoutButton'

export const metadata: Metadata = {
  title: 'Recruta AI',
  description: 'Análise inteligente de candidatos com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 min-h-screen">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-semibold text-slate-800 text-lg">Recruta AI</span>
            </a>
            <div className="flex items-center gap-3">
              <a
                href="/nova-vaga"
                className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                + Nova Vaga
              </a>
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
