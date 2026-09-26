/** Tipos compartilhados pela camada de domínio (doc 01, seção 4). */

export const PERFIS = ['ADMIN', 'GESTOR', 'ALMOXARIFE', 'CONSULTA'] as const
export type Perfil = (typeof PERFIS)[number]

export const TIPOS_MOVIMENTACAO = [
  'COMPRA',
  'DEVOLUCAO_PRODUCAO',
  'AJUSTE_POSITIVO',
  'CONSUMO_PRODUCAO',
  'PERDA_QUEBRA',
  'AJUSTE_NEGATIVO',
  'ESTORNO',
] as const
export type TipoMovimentacao = (typeof TIPOS_MOVIMENTACAO)[number]

export const TIPOS_ENTRADA = ['COMPRA', 'DEVOLUCAO_PRODUCAO', 'AJUSTE_POSITIVO'] as const
export const TIPOS_SAIDA = ['CONSUMO_PRODUCAO', 'PERDA_QUEBRA', 'AJUSTE_NEGATIVO'] as const

export const STATUS_ITEM = ['OK', 'ATENCAO', 'CRITICO', 'ZERADO'] as const
export type StatusItem = (typeof STATUS_ITEM)[number]

/** Resultado de uma decisão de negócio: aceita com um valor, ou recusada com o motivo. */
export type Decisao<T> = { ok: true; valor: T } | { ok: false; motivo: string }

export function aceita<T>(valor: T): Decisao<T> {
  return { ok: true, valor }
}

export function recusada<T = never>(motivo: string): Decisao<T> {
  return { ok: false, motivo }
}

/** Caso de teste escrito como dado: usado pelo Vitest e pelo Laboratório (doc 03, seção 9.3). */
export interface CasoDeTeste<E, S> {
  descricao: string
  entrada: E
  esperado: S
}
