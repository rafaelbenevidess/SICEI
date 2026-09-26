import { describe, expect, it } from 'vitest'
import {
  consumoMedioDiario,
  leadTimeParaCalculo,
  pontoDeReposicao,
  quantidadeEmUnidades,
  statusDoItem,
  sugestaoDeCompra,
  validarLimites,
} from './estoque'
import {
  casosConsumoMedio,
  casosConversao,
  casosLeadTime,
  casosLimites,
  casosPontoReposicao,
  casosStatus,
  casosSugestao,
} from './estoque.casos'

describe('RN-16 · Consumo médio diário', () => {
  it.each(casosConsumoMedio)('$descricao', ({ entrada, esperado }) => {
    expect(consumoMedioDiario(entrada)).toBe(esperado)
  })
  it('janela de zero dias é um erro', () => {
    expect(() => consumoMedioDiario({ totalConsumido: 10, janelaDias: 0 })).toThrow()
  })
  it('total negativo é um erro', () => {
    expect(() => consumoMedioDiario({ totalConsumido: -1, janelaDias: 90 })).toThrow()
  })
})

describe('RN-15 · Ponto de reposição', () => {
  it.each(casosPontoReposicao)('$descricao', ({ entrada, esperado }) => {
    expect(pontoDeReposicao(entrada)).toBe(esperado)
  })
  it('mínimo negativo é um erro', () => {
    expect(() => pontoDeReposicao({ minimo: -5, consumoDiario: 1, leadTime: 1 })).toThrow()
  })
})

describe('RN-15 · Lead time usado no cálculo', () => {
  it.each(casosLeadTime)('$descricao', ({ entrada, esperado }) => {
    expect(leadTimeParaCalculo(entrada)).toBe(esperado)
  })
})

describe('RN-17 · Status do item', () => {
  it.each(casosStatus)('$descricao', ({ entrada, esperado }) => {
    expect(statusDoItem(entrada)).toBe(esperado)
  })
})

describe('RN-20 · Sugestão de compra', () => {
  it.each(casosSugestao)('$descricao', ({ entrada, esperado }) => {
    expect(sugestaoDeCompra(entrada)).toEqual(esperado)
  })
  it('consumo fracionado não gera erro de arredondamento: 0,1/dia × 30 = 3', () => {
    const r = sugestaoDeCompra({
      saldo: 0,
      minimo: 0,
      pontoReposicao: 0,
      maximo: null,
      consumoDiario: 0.1,
      embalagem: 1,
    })
    expect(r.quantidade).toBe(3)
  })
  it('máximo abaixo do saldo não sugere compra', () => {
    const r = sugestaoDeCompra({
      saldo: 10,
      minimo: 20,
      pontoReposicao: 41,
      maximo: 5,
      consumoDiario: 1,
      embalagem: 10,
    })
    expect(r).toEqual({ quantidade: 0, caixas: 0 })
  })
  it('embalagem zero é um erro', () => {
    expect(() =>
      sugestaoDeCompra({
        saldo: 0,
        minimo: 1,
        pontoReposicao: 1,
        maximo: null,
        consumoDiario: 0,
        embalagem: 0,
      }),
    ).toThrow()
  })
})

describe('RN-07 · Conversão de caixas em unidades', () => {
  it.each(casosConversao)('$descricao', ({ entrada, esperado }) => {
    expect(quantidadeEmUnidades(entrada)).toEqual(esperado)
  })
  it('caixa com embalagem inválida é recusada', () => {
    expect(quantidadeEmUnidades({ quantidade: 2, unidade: 'CAIXA', embalagem: 0 }).ok).toBe(false)
  })
})

describe('RN-14 · Estoque mínimo e máximo', () => {
  it.each(casosLimites)('$descricao', ({ entrada, esperado }) => {
    expect(validarLimites(entrada)).toEqual(esperado)
  })
  it('máximo fracionado é recusado', () => {
    expect(validarLimites({ minimo: 1, maximo: 2.5 }).ok).toBe(false)
  })
})
