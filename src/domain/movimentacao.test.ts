import { describe, expect, it } from 'vitest'
import {
  ajusteDeInventario,
  avaliarEstorno,
  avaliarMovimentacao,
  ehEntrada,
  saldoPelasMovimentacoes,
  sinalDoTipo,
} from './movimentacao'
import { casosEstorno, casosInventario, casosMovimentacao } from './movimentacao.casos'

describe('RN-08 · Entrada e saída sem saldo negativo', () => {
  it.each(casosMovimentacao)('$descricao', ({ entrada, esperado }) => {
    expect(avaliarMovimentacao(entrada)).toEqual(esperado)
  })
})

describe('RN-12 · Estorno', () => {
  it.each(casosEstorno)('$descricao', ({ entrada, esperado }) => {
    expect(avaliarEstorno(entrada)).toEqual(esperado)
  })
  it('estorno de ajuste negativo devolve a quantidade', () => {
    const r = avaliarEstorno({
      original: { tipo: 'AJUSTE_NEGATIVO', quantidade: 2, jaEstornada: false },
      saldoAtual: 0,
      justificativa: 'Contagem refeita',
    })
    expect(r).toEqual({ ok: true, valor: { saldoAnterior: 0, saldoPosterior: 2 } })
  })
})

describe('RN-13 · Ajuste de inventário', () => {
  it.each(casosInventario)('$descricao', ({ entrada, esperado }) => {
    expect(ajusteDeInventario(entrada)).toEqual(esperado)
  })
})

describe('Tipos de movimentação (doc 01, seção 4)', () => {
  it.each([
    ['COMPRA', 1],
    ['DEVOLUCAO_PRODUCAO', 1],
    ['AJUSTE_POSITIVO', 1],
    ['CONSUMO_PRODUCAO', -1],
    ['PERDA_QUEBRA', -1],
    ['AJUSTE_NEGATIVO', -1],
  ] as const)('%s tem efeito %i no saldo', (tipo, sinal) => {
    expect(sinalDoTipo(tipo)).toBe(sinal)
    expect(ehEntrada(tipo)).toBe(sinal === 1)
  })
})

describe('RN-06 / RN-09b · Saldo reconstruído pelas movimentações', () => {
  it('compra 30, consumo 4, estorno do consumo, perda 2 → 28', () => {
    expect(
      saldoPelasMovimentacoes([
        { tipo: 'COMPRA', quantidade: 30 },
        { tipo: 'CONSUMO_PRODUCAO', quantidade: 4 },
        { tipo: 'ESTORNO', quantidade: 4, estornaTipo: 'CONSUMO_PRODUCAO' },
        { tipo: 'PERDA_QUEBRA', quantidade: 2 },
      ]),
    ).toBe(28)
  })
  it('sem movimentações o saldo é 0', () => {
    expect(saldoPelasMovimentacoes([])).toBe(0)
  })
  it('estorno sem o tipo original é um erro', () => {
    expect(() => saldoPelasMovimentacoes([{ tipo: 'ESTORNO', quantidade: 1 }])).toThrow()
  })
})
