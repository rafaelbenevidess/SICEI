/**
 * Níveis de estoque, status e sugestão de compra (doc 01, RN-07 e RN-14 a RN-20).
 * Funções puras: não acessam banco nem framework.
 */
import { arredondarParaCima, ehInteiroNaoNegativo, ehInteiroPositivo } from './numeros'
import { aceita, recusada, type Decisao, type StatusItem } from './tipos'

/** Janela padrão do consumo médio, em dias (RN-16). */
export const JANELA_CONSUMO_PADRAO = 90

/** Dias de consumo somados ao ponto de reposição quando o item não tem máximo (RN-20). */
export const DIAS_COBERTURA_SEM_MAXIMO = 30

/** RN-16: soma das saídas de consumo na janela ÷ número de dias da janela. */
export function consumoMedioDiario(entrada: {
  totalConsumido: number
  janelaDias: number
}): number {
  const { totalConsumido, janelaDias } = entrada
  if (!ehInteiroPositivo(janelaDias))
    throw new Error('A janela precisa ser um número inteiro de dias maior que zero.')
  if (totalConsumido < 0) throw new Error('O total consumido não pode ser negativo.')
  return totalConsumido / janelaDias
}

/**
 * RN-15: ponto de reposição = mínimo + consumo médio diário × lead time, arredondado para cima.
 * Sem consumo registrado ou sem lead time, vale o mínimo.
 */
export function pontoDeReposicao(entrada: {
  minimo: number
  consumoDiario: number
  leadTime: number | null
}): number {
  const { minimo, consumoDiario, leadTime } = entrada
  if (!ehInteiroNaoNegativo(minimo))
    throw new Error('O estoque mínimo precisa ser um inteiro maior ou igual a zero.')
  if (leadTime === null || consumoDiario <= 0) return minimo
  return arredondarParaCima(minimo + consumoDiario * leadTime)
}

export interface FornecedorParaCalculo {
  preferencial: boolean
  ultimoPreco: number | null
  leadTimeDias: number | null
}

/**
 * RN-15: o lead time usado é o do fornecedor preferencial; sem preferencial,
 * o do fornecedor com o menor último preço. Sem nenhum, devolve null.
 */
export function leadTimeParaCalculo(fornecedores: FornecedorParaCalculo[]): number | null {
  const preferencial = fornecedores.find((f) => f.preferencial && f.leadTimeDias !== null)
  if (preferencial) return preferencial.leadTimeDias
  const comPreco = fornecedores
    .filter((f) => f.ultimoPreco !== null && f.leadTimeDias !== null)
    .sort((a, b) => (a.ultimoPreco as number) - (b.ultimoPreco as number))
  return comPreco[0]?.leadTimeDias ?? null
}

/** RN-17: status do item. Vale a primeira condição que se aplicar. */
export function statusDoItem(entrada: {
  saldo: number
  minimo: number
  pontoReposicao: number
}): StatusItem {
  const { saldo, minimo, pontoReposicao } = entrada
  if (saldo <= 0) return 'ZERADO'
  if (saldo <= minimo) return 'CRITICO'
  if (saldo <= pontoReposicao) return 'ATENCAO'
  return 'OK'
}

/** Gravidade de cada status, do melhor para o pior. */
export const GRAVIDADE: Record<StatusItem, number> = { OK: 0, ATENCAO: 1, CRITICO: 2, ZERADO: 3 }

/**
 * RN-20: quantidade sugerida para compra, em unidades, arredondada para cima em caixas.
 * Itens com status OK não têm sugestão.
 */
export function sugestaoDeCompra(entrada: {
  saldo: number
  minimo: number
  pontoReposicao: number
  maximo: number | null
  consumoDiario: number
  embalagem: number
}): { quantidade: number; caixas: number } {
  const { saldo, minimo, pontoReposicao, maximo, consumoDiario, embalagem } = entrada
  if (!ehInteiroPositivo(embalagem))
    throw new Error('A embalagem precisa ter pelo menos 1 unidade.')
  if (statusDoItem({ saldo, minimo, pontoReposicao }) === 'OK') return { quantidade: 0, caixas: 0 }

  const alvo = alvoDeEstoque({ maximo, pontoReposicao, consumoDiario })
  const falta = alvo - saldo
  if (falta <= 0) return { quantidade: 0, caixas: 0 }
  const caixas = arredondarParaCima(falta / embalagem)
  return { quantidade: caixas * embalagem, caixas }
}

/** RN-20: nível que a compra deve alcançar: o máximo, ou o ponto de reposição + 30 dias de consumo. */
export function alvoDeEstoque(entrada: {
  maximo: number | null
  pontoReposicao: number
  consumoDiario: number
}): number {
  const { maximo, pontoReposicao, consumoDiario } = entrada
  return maximo ?? pontoReposicao + arredondarParaCima(consumoDiario * DIAS_COBERTURA_SEM_MAXIMO)
}

/**
 * Posições da barra de nível do estoque, em % da largura (0 a 100). A escala é
 * max(alvo, saldo) × 1,08, para o saldo nunca encostar no fim da barra.
 */
export function escalaDoNivel(entrada: {
  saldo: number
  minimo: number
  pontoReposicao: number
  alvo: number
}): { saldo: number; minimo: number; reposicao: number; alvo: number } {
  const { saldo, minimo, pontoReposicao, alvo } = entrada
  const escala = Math.max(alvo, saldo, 1) * 1.08
  const pct = (v: number) => Math.round(Math.min(100, Math.max(0, (v / escala) * 100)) * 10) / 10
  return { saldo: pct(saldo), minimo: pct(minimo), reposicao: pct(pontoReposicao), alvo: pct(alvo) }
}

/** Dias que o saldo dura no consumo médio atual; null sem consumo registrado. */
export function coberturaEmDias(saldo: number, consumoDiario: number): number | null {
  if (!(consumoDiario > 0)) return null
  return Math.floor(saldo / consumoDiario)
}

/** RN-07: converte uma quantidade informada em caixas ou unidades para unidades. */
export function quantidadeEmUnidades(entrada: {
  quantidade: number
  unidade: 'UNIDADE' | 'CAIXA'
  embalagem: number
}): Decisao<number> {
  const { quantidade, unidade, embalagem } = entrada
  if (!ehInteiroPositivo(quantidade))
    return recusada('A quantidade precisa ser um número inteiro maior que zero.')
  if (unidade === 'UNIDADE') return aceita(quantidade)
  if (!ehInteiroPositivo(embalagem))
    return recusada('A embalagem do item precisa ter pelo menos 1 unidade.')
  return aceita(quantidade * embalagem)
}

/** RN-14: mínimo obrigatório (≥ 0) e máximo opcional, maior que o mínimo. */
export function validarLimites(entrada: { minimo: number; maximo: number | null }): Decisao<true> {
  const { minimo, maximo } = entrada
  if (!ehInteiroNaoNegativo(minimo))
    return recusada('O estoque mínimo precisa ser um inteiro maior ou igual a zero.')
  if (maximo !== null) {
    if (!ehInteiroPositivo(maximo))
      return recusada('O estoque máximo precisa ser um inteiro maior que zero.')
    if (maximo <= minimo) return recusada('O estoque máximo precisa ser maior que o mínimo.')
  }
  return aceita(true)
}
