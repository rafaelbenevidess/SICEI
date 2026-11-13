/**
 * Monta um link mantendo os filtros atuais e trocando só alguns (null ou '' remove o parâmetro).
 * Os filtros ficam na URL para os links poderem ser compartilhados.
 */
export function urlCom(
  caminho: string,
  atuais: object,
  mudancas: Record<string, string | null | undefined>,
): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(atuais as Record<string, unknown>)) {
    if (typeof v === 'string' && v !== '') p.set(k, v)
  }
  for (const [k, v] of Object.entries(mudancas)) {
    if (v === null || v === undefined || v === '') p.delete(k)
    else p.set(k, v)
  }
  const q = p.toString()
  return q ? `${caminho}?${q}` : caminho
}

/**
 * Troca sslmode=prefer|require|verify-ca por sslmode=verify-full quando não há uselibpqcompat,
 * evitando o aviso do pg-connection-string no stderr (que a Vercel classifica como erro de função).
 */
export function urlBanco(url: string | undefined): string | undefined {
  if (!url || /[?&]uselibpqcompat=true\b/i.test(url)) return url
  return url.replace(/([?&]sslmode=)(?:prefer|require|verify-ca)\b/i, '$1verify-full')
}
