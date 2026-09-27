import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { COOKIE_TEMA, temaDoCookie } from '@/lib/tema'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'SICEI', template: '%s · SICEI' },
  description:
    'Sistema Inteligente de Controle de Estoques Industriais: controle de estoque de pastilhas industriais',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // renderização dinâmica em todas as páginas: o CSP usa um nonce novo a cada requisição (doc 03, seção 6)
  await connection()
  // o tema vem do cookie e já sai no HTML, então a página não pisca ao abrir
  const tema = temaDoCookie((await cookies()).get(COOKIE_TEMA)?.value)
  return (
    <html lang="pt-BR" data-theme={tema} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh bg-bg font-sans text-ink">{children}</body>
    </html>
  )
}
