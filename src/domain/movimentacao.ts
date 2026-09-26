/**
 * Decisões sobre movimentações: entrada, saída, estorno e ajuste de inventário
 * (doc 01, RN-03, RN-06 a RN-08, RN-12 e RN-13). O service abre a transação,
 * trava a linha do item e chama estas funções para decidir.
 */
import { ehInteiroNaoNegativo, ehInteiroPositivo } from './numeros'
import { aceita, recusada, TIPOS_ENTRADA, type Decisao, type TipoMovimentacao } from './tipos'

export type TipoComum = Exclude<TipoMovimentacao, 'ESTORNO'>

/** +1 para entradas, −1 para saídas. O estorno usa o sinal inverso da original. */
export function sinalDoTipo(tipo: TipoComum): 1 | -1 {
  return (TIPOS_ENTRADA as readonly string[]).includes(tipo) ? 1 : -1
}

export function ehEntrada(tipo: TipoComum): boolean {
  return sinalDoTipo(tipo) === 1
}

export function mensagemSaldoInsuficiente(saldo: number): string {
  return `Saldo disponível: ${saldo}`
}

/** RN-03, RN-07 e RN-08: decide se a movimentação pode ser feita e qual o saldo resultante. */
export function avaliarMovimentacao(entrada: {
  tipo: TipoComum
  quantidade: number
  saldoAtual: number
  itemAtivo: boolean
}): Decisao<{ saldoAnterior: number; saldoPosterior: number }> {
  const { tipo, quantidade, saldoAtual, itemAtivo } = entrada
  if (!itemAtivo) return recusada('Item inativo não recebe movimentação.')
  if (!ehInteiroPositivo(quantidade))
    return recusada('A quantidade precisa ser um número inteiro maior que zero.')
  const saldoPosterior = saldoAtual + sinalDoTipo(tipo) * quantidade
  if (saldoPosterior < 0) return recusada(mensagemSaldoInsuficiente(saldoAtual))
  return aceita({ saldoAnterior: saldoAtual, saldoPosterior })
}

export interface MovimentacaoOriginal {
  tipo: TipoMovimentacao
  quantidade: number
  jaEstornada: boolean
}

/** RN-12: um estorno inverte a original, uma única vez, e nunca deixa o saldo negativo. */
export function avaliarEstorno(entrada: {
  original: MovimentacaoOriginal
  saldoAtual: number
  justificativa: string
  itemAtivo: boolean
}): Decisao<{ saldoAnterior: number; saldoPosterior: number }> {
  const { original, saldoAtual, justificativa, itemAtivo } = entrada
  if (!itemAtivo) return recusada('Item inativo não recebe movimentação.')
  if (original.tipo === 'ESTORNO') return recusada('Um estorno não pode ser estornado.')
  if (original.jaEstornada) return recusada('Esta movimentação já foi estornada.')
  if (justificativa.trim().length < 5) return recusada('Informe a justificativa do estorno.')
  const saldoPosterior = saldoAtual - sinalDoTipo(original.tipo) * original.quantidade
  if (saldoPosterior < 0) return recusada(mensagemSaldoInsuficiente(saldoAtual))
  return aceita({ saldoAnterior: saldoAtual, saldoPosterior })
}

/**
 * RN-13: compara a contagem física com o saldo. Devolve o ajuste a lançar,
 * ou null quando a contagem bate.
 */
export function ajusteDeInventario(entrada: {
  saldo: number
  contado: number
}): Decisao<{ tipo: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO'; quantidade: number } | null> {
  const { saldo, contado } = entrada
  if (!ehInteiroNaoNegativo(contado))
    return recusada('A quantidade contada precisa ser um inteiro maior ou igual a zero.')
  if (contado === saldo) return aceita(null)
  return aceita(
    contado > saldo
      ? { tipo: 'AJUSTE_POSITIVO', quantidade: contado - saldo }
      : { tipo: 'AJUSTE_NEGATIVO', quantidade: saldo - contado },
  )
}

/** RN-06 / RN-09b: saldo reconstruído a partir das movimentações. */
export function saldoPelasMovimentacoes(
  movimentacoes: { tipo: TipoMovimentacao; quantidade: number; estornaTipo?: TipoComum }[],
): number {
  return movimentacoes.reduce((saldo, m) => {
    if (m.tipo === 'ESTORNO') {
      if (!m.estornaTipo) throw new Error('Estorno sem o tipo da movimentação original.')
      return saldo - sinalDoTipo(m.estornaTipo) * m.quantidade
    }
    return saldo + sinalDoTipo(m.tipo) * m.quantidade
  }, 0)
}
