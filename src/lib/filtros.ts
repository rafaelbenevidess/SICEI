/** Campos de filtro aceitos pelo histórico de movimentações (RF-15). */
export const CAMPOS_FILTRO_MOVIMENTACOES = [
  'de',
  'ate',
  'item',
  'tipo',
  'usuario',
  'destino',
  'colaborador',
  'op',
  'busca',
] as const

export type FiltroDaUrl = Partial<Record<(typeof CAMPOS_FILTRO_MOVIMENTACOES)[number], string>>

/**
 * Lê da URL só os filtros conhecidos, sem vazios e com no máximo 100 caracteres. O resultado
 * vai para a consulta e para o log da exportação (RN-23), que é imutável: nada além disso entra.
 */
export function filtrosDaUrl(params: URLSearchParams): FiltroDaUrl {
  const filtros: FiltroDaUrl = {}
  for (const campo of CAMPOS_FILTRO_MOVIMENTACOES) {
    const valor = params.get(campo)?.trim()
    if (valor) filtros[campo] = valor.slice(0, 100)
  }
  return filtros
}
