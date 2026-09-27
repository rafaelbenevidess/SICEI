import type { Metadata, Viewport } from 'next'
import { connection } from 'next/server'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'SICEI', template: '%s · SICEI' },
  description:
    'Sistema Inteligente de Controle de Estoques Industriais: controle de estoque de pastilhas industriais da DDA Metalúrgica',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // renderização dinâmica em todas as páginas: o CSP usa um nonce novo a cada requisição (doc 03, seção 6)
  await connection()
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
