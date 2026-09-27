import { NextResponse, type NextRequest } from 'next/server'

/** Rotas abertas sem login. O resto exige o cookie de sessão (a validação real é no servidor). */
const PUBLICAS = ['/login', '/testes', '/api/cron']

export function ehPublica(caminho: string): boolean {
  return caminho === '/' || PUBLICAS.some((p) => caminho === p || caminho.startsWith(`${p}/`))
}

/** Câmera só para o próprio SICEI (tela Ler QR, RN-26); microfone e localização bloqueados. */
export const POLITICA_DE_PERMISSOES = 'camera=(self), microphone=(), geolocation=()'

export function montarCsp(nonce: string, desenvolvimento: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${desenvolvimento ? " 'unsafe-eval'" : ''}`,
    // estilos inline ficam liberados: o Next e o React usam atributos style, que não aceitam nonce.
    // Scripts continuam restritos ao nonce, que é o que barra XSS.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(desenvolvimento ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}

/**
 * Proxy (antigo middleware): cabeçalhos de segurança com CSP por nonce (doc 03, seção 6)
 * e redirecionamento rápido de quem não tem cookie de sessão.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (!ehPublica(pathname) && !request.cookies.get('sicei_sessao')) {
    const url = new URL('/login', request.url)
    url.searchParams.set('volta', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = montarCsp(nonce, process.env.NODE_ENV === 'development')
  const cabecalhos = new Headers(request.headers)
  cabecalhos.set('x-nonce', nonce)
  cabecalhos.set('Content-Security-Policy', csp)

  const resposta = NextResponse.next({ request: { headers: cabecalhos } })
  resposta.headers.set('Content-Security-Policy', csp)
  resposta.headers.set('X-Content-Type-Options', 'nosniff')
  resposta.headers.set('X-Frame-Options', 'DENY')
  resposta.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  resposta.headers.set('Permissions-Policy', POLITICA_DE_PERMISSOES)
  if (process.env.NODE_ENV === 'production') {
    resposta.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  }
  return resposta
}

export const config = {
  matcher: [
    {
      // fora: arquivos estáticos do Next, ícones, imagens da marca e o relatório estático do Vitest
      source: '/((?!_next/static|_next/image|favicon.ico|icon.png|brand/|relatorio-testes).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
