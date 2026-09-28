import { describe, expect, it } from 'vitest'
import {
  afastarRotulos,
  baldesDoPeriodo,
  compararNaEvolucao,
  completarSelecao,
  normalizarSelecao,
  chaveDoBalde,
  diasNoPeriodo,
  escalaDoEixo,
  maioresEOutros,
  mapaDeCalor,
  periodoAnterior,
  serieNoTempo,
  tamanhoDoBalde,
  variacao,
} from './analise'
import {
  casosChaveDoBalde,
  casosComparacao,
  casosRotulos,
  casosSelecao,
  casosEscala,
  casosMaioresEOutros,
  casosPeriodoAnterior,
  casosTamanhoDoBalde,
  casosVariacao,
  PARCELAS_DE_EXEMPLO,
} from './analise.casos'

describe('RF-17a · Agrupamento no tempo', () => {
  it.each(casosTamanhoDoBalde)('$descricao', ({ entrada, esperado }) => {
    expect(tamanhoDoBalde(entrada)).toBe(esperado)
  })
  it.each(casosChaveDoBalde)('$descricao', ({ entrada, esperado }) => {
    expect(chaveDoBalde(entrada.data, entrada.tamanho)).toBe(esperado)
  })
  it('28/08 a 27/09 tem 31 dias', () => {
    expect(diasNoPeriodo('2026-08-28', '2026-09-27')).toBe(31)
  })
  it('baldes por dia: um por dia, com rótulo dd/mm', () => {
    const b = baldesDoPeriodo('2026-09-25', '2026-09-27', 'dia')
    expect(b.map((x) => x.rotulo)).toEqual(['25/09', '26/09', '27/09'])
  })
  it('baldes por semana: a primeira começa na segunda anterior ao início', () => {
    const b = baldesDoPeriodo('2026-09-16', '2026-09-28', 'semana')
    expect(b.map((x) => x.chave)).toEqual(['2026-09-14', '2026-09-21', '2026-09-28'])
    expect(b[0].rotulo).toBe('14/09')
  })
  it('baldes por mês: rótulo mês/ano', () => {
    const b = baldesDoPeriodo('2026-08-20', '2026-10-02', 'mes')
    expect(b.map((x) => x.rotulo)).toEqual(['ago/26', 'set/26', 'out/26'])
  })
  it('série: soma cada dia no balde, dia sem consumo vira zero, fora do período é ignorado', () => {
    const b = baldesDoPeriodo('2026-09-14', '2026-09-27', 'semana')
    const s = serieNoTempo(
      [
        { dia: '2026-09-15', quantidade: 4 },
        { dia: '2026-09-20', quantidade: 6 },
        { dia: '2026-09-22', quantidade: 3 },
        { dia: '2026-10-05', quantidade: 99 },
      ],
      b,
      'semana',
    )
    expect(s).toEqual([10, 3])
  })
})

describe('RF-17a · Comparação com o período anterior', () => {
  it.each(casosPeriodoAnterior)('$descricao', ({ entrada, esperado }) => {
    expect(periodoAnterior(entrada.deIso, entrada.ateIso)).toEqual(esperado)
  })
  it.each(casosVariacao)('$descricao', ({ entrada, esperado }) => {
    expect(variacao(entrada.atual, entrada.anterior)).toBe(esperado)
  })
})

describe('RF-17a · Maiores e "Outros"', () => {
  it.each(casosMaioresEOutros)('$descricao', ({ entrada, esperado }) => {
    const r = maioresEOutros(PARCELAS_DE_EXEMPLO, entrada)
    expect({
      chaves: r.map((p) => p.chave),
      outros: r.find((p) => p.chave === 'Outros')?.total ?? 0,
    }).toEqual(esperado)
  })
})

describe('RF-17a · Mapa de calor e eixo', () => {
  it('segunda às 7h cai na linha 0, domingo na linha 6; hora inválida é ignorada', () => {
    const m = mapaDeCalor([
      { diaSemana: 1, hora: 7, quantidade: 3 },
      { diaSemana: 1, hora: 7, quantidade: 2 },
      { diaSemana: 0, hora: 22, quantidade: 1 },
      { diaSemana: 3, hora: 24, quantidade: 9 },
    ])
    expect(m[0][7]).toBe(5)
    expect(m[6][22]).toBe(1)
    expect(m.flat().reduce((a, b) => a + b, 0)).toBe(6)
  })
  it.each(casosEscala)('$descricao', ({ entrada, esperado }) => {
    expect(escalaDoEixo(entrada)).toEqual(esperado)
  })
})

describe('RF-17a · Análise personalizada', () => {
  it.each(casosSelecao)('$descricao', ({ entrada, esperado }) => {
    expect(normalizarSelecao(entrada)).toEqual(esperado)
  })
  it('sem o parâmetro, ou com ele repetido na URL, também funciona', () => {
    expect(normalizarSelecao(undefined)).toEqual([])
    expect(normalizarSelecao(['PST-001', 'PST-002,PST-001'])).toEqual(['PST-001', 'PST-002'])
  })
  it.each(casosComparacao)('$descricao', ({ entrada, esperado }) => {
    expect(compararNaEvolucao(entrada.escolhidos, entrada.emFoco)).toBe(esperado)
  })
  it('escolhido sem consumo no período entra no ranking com zero; os outros ficam iguais', () => {
    const r = completarSelecao(
      [{ chave: 'PST-001', nome: 'CNMG', total: 48 }],
      [
        { chave: 'PST-001', nome: 'CNMG' },
        { chave: 'PST-003', nome: 'DNMG' },
      ],
    )
    expect(r).toEqual([
      { chave: 'PST-001', nome: 'CNMG', total: 48 },
      { chave: 'PST-003', nome: 'DNMG', total: 0 },
    ])
  })
})

describe('RF-17a · Rótulos na ponta das linhas', () => {
  it.each(casosRotulos)('$descricao', ({ entrada, esperado }) => {
    expect(afastarRotulos(entrada.ys, entrada.limite)).toEqual(esperado)
  })
})
