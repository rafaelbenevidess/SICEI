/**
 * Matriz de permissões (doc 02, seção 5). Conferida no servidor em todo service;
 * a tela só usa para esconder o que o perfil não pode fazer.
 */
import type { Perfil, TipoMovimentacao } from './tipos'

export const PERMISSOES = [
  'usuarios:gerenciar',
  'parametros:gerenciar',
  'importacao:executar',
  'cadastros:ver',
  'cadastros:editar',
  'precos:ver',
  'limites:editar',
  'movimentacao:entrada',
  'movimentacao:saida',
  'movimentacao:ajuste',
  'movimentacao:estornar',
  'saldo:ver',
  'painel:ver',
  'alertas:ver',
  'alertas:ciente',
  'historico:ver',
  'relatorios:ver',
  'auditoria:ver',
  'etiquetas:imprimir',
] as const
export type Permissao = (typeof PERMISSOES)[number]

const CONSULTA: Permissao[] = ['cadastros:ver', 'saldo:ver', 'painel:ver', 'alertas:ver']

const ALMOXARIFE: Permissao[] = [
  ...CONSULTA,
  'precos:ver',
  'movimentacao:entrada',
  'movimentacao:saida',
  'historico:ver',
  'etiquetas:imprimir',
]

const GESTOR: Permissao[] = [
  ...ALMOXARIFE,
  'cadastros:editar',
  'limites:editar',
  'movimentacao:ajuste',
  'movimentacao:estornar',
  'alertas:ciente',
  'relatorios:ver',
  'auditoria:ver',
]

const ADMIN: Permissao[] = [
  ...GESTOR,
  'usuarios:gerenciar',
  'parametros:gerenciar',
  'importacao:executar',
]

export const MATRIZ: Record<Perfil, ReadonlySet<Permissao>> = {
  ADMIN: new Set(ADMIN),
  GESTOR: new Set(GESTOR),
  ALMOXARIFE: new Set(ALMOXARIFE),
  CONSULTA: new Set(CONSULTA),
}

export function pode(perfil: Perfil, permissao: Permissao): boolean {
  return MATRIZ[perfil].has(permissao)
}

export class ErroDePermissao extends Error {
  constructor(public readonly permissao: Permissao) {
    super('Você não tem permissão para esta ação.')
    this.name = 'ErroDePermissao'
  }
}

/** Lança ErroDePermissao se o perfil não puder executar a ação. */
export function exigirPermissao(perfil: Perfil, permissao: Permissao): void {
  if (!pode(perfil, permissao)) throw new ErroDePermissao(permissao)
}

/** Qual permissão cada tipo de movimentação exige (doc 01, seção 4). */
export function permissaoDoTipo(tipo: TipoMovimentacao): Permissao {
  switch (tipo) {
    case 'COMPRA':
    case 'DEVOLUCAO_PRODUCAO':
      return 'movimentacao:entrada'
    case 'CONSUMO_PRODUCAO':
    case 'PERDA_QUEBRA':
      return 'movimentacao:saida'
    case 'AJUSTE_POSITIVO':
    case 'AJUSTE_NEGATIVO':
      return 'movimentacao:ajuste'
    case 'ESTORNO':
      return 'movimentacao:estornar'
  }
}

export const NOME_DO_PERFIL: Record<Perfil, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  ALMOXARIFE: 'Almoxarife',
  CONSULTA: 'Consulta',
}
