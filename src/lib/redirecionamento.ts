/**
 * Só aceita caminhos internos no parâmetro "volta" do login, para ninguém usar o SIMI
 * como trampolim para outro site (open redirect, doc 03 seção 5.6).
 */
export function destinoSeguro(volta: string | null | undefined, padrao = '/painel'): string {
  if (!volta) return padrao
  if (!volta.startsWith('/') || volta.startsWith('//') || volta.startsWith('/\\')) return padrao
  if (/[\r\n]/.test(volta) || volta.toLowerCase().includes('javascript:')) return padrao
  if (volta.startsWith('/login')) return padrao
  return volta
}
