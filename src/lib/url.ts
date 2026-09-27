/**
 * Monta um link mantendo os filtros atuais e trocando só alguns (null ou '' remove o parâmetro).
 * Os filtros ficam na URL para os links poderem ser compartilhados.
 */
export function urlCom(
  caminho: string,
  atuais: Record<string, string | string[] | undefined>,
  mudancas: Record<string, string | null | undefined>,
): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(atuais)) {
    if (typeof v === 'string' && v !== '') p.set(k, v)
  }
  for (const [k, v] of Object.entries(mudancas)) {
    if (v === null || v === undefined || v === '') p.delete(k)
    else p.set(k, v)
  }
  const q = p.toString()
  return q ? `${caminho}?${q}` : caminho
}
