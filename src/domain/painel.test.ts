import { describe, expect, it } from 'vitest'
import {
  diasDoMes,
  escalaDaComparacao,
  matrizDePontos,
  mediaDiaria,
  saudeDoEstoque,
  tempoAberto,
  tracosAcesos,
  variacaoDoMes,
} from './painel'
import {
  casosDiasDoMes,
  casosEscalaDaComparacao,
  casosMatrizDePontos,
  casosMediaDiaria,
  casosSaudeDoEstoque,
  casosTempoAberto,
  casosTracosAcesos,
  casosVariacaoDoMes,
} from './painel.casos'

describe('RF-16 · Saúde do estoque no painel', () => {
  it.each(casosSaudeDoEstoque)('$descricao', ({ entrada, esperado }) => {
    expect(saudeDoEstoque(entrada)).toEqual(esperado)
  })
})

describe('RF-16 · Traços acesos do medidor', () => {
  it.each(casosTracosAcesos)('$descricao', ({ entrada, esperado }) => {
    expect(tracosAcesos(entrada.percentual, entrada.tracos)).toBe(esperado)
  })
  it('percentual fora de 0 a 100 é limitado', () => {
    expect(tracosAcesos(140, 40)).toBe(40)
    expect(tracosAcesos(-5, 40)).toBe(0)
  })
})

describe('RF-16 · Consumo por dia em pontos', () => {
  it.each(casosMatrizDePontos)('$descricao', ({ entrada, esperado }) => {
    expect(matrizDePontos(entrada.totais, entrada.linhas)).toEqual(esperado)
  })
  it('nenhuma coluna passa do número de linhas', () => {
    for (const maior of [1, 7, 8, 9, 37, 133, 512, 4096, 99_999]) {
      const { pontos } = matrizDePontos([maior, Math.floor(maior / 3)], 8)
      expect(Math.max(...pontos)).toBeLessThanOrEqual(8)
    }
  })
  it('mês sem nenhum dia → lista vazia', () => {
    expect(matrizDePontos([], 8)).toEqual({ unidadesPorPonto: 1, pontos: [] })
  })
})

describe('RF-16 · Consumo do mês contra o mês anterior', () => {
  it.each(casosEscalaDaComparacao)('$descricao', ({ entrada, esperado }) => {
    expect(escalaDaComparacao(entrada.valor, entrada.referencia)).toEqual(esperado)
  })
  it.each(casosVariacaoDoMes)('$descricao', ({ entrada, esperado }) => {
    expect(variacaoDoMes(entrada.atual, entrada.anterior)).toBe(esperado)
  })
  it.each(casosMediaDiaria)('$descricao', ({ entrada, esperado }) => {
    expect(mediaDiaria(entrada.total, entrada.dias)).toBe(esperado)
  })
})

describe('RF-16 · Dias do mês no gráfico', () => {
  it.each(casosDiasDoMes)('$descricao', ({ entrada, esperado }) => {
    expect(diasDoMes(entrada)).toBe(esperado)
  })
})

describe('RF-13 · Tempo do alerta aberto', () => {
  it.each(casosTempoAberto)('$descricao', ({ entrada, esperado }) => {
    expect(tempoAberto(new Date(entrada.abertoEm), new Date(entrada.agora))).toBe(esperado)
  })
})
