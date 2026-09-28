import { describe, expect, it } from 'vitest'
import { validar } from './comum'
import {
  escolhidosDaDimensao,
  filtrosAtivos,
  parametrosDaAnalise,
  schemaFiltrosDaAnalise,
} from './analise'
import { casosFiltrosDaAnalise, resumirFiltros } from './analise.casos'

const ler = (p: Record<string, unknown>) => {
  const r = validar(schemaFiltrosDaAnalise, p)
  if (!r.ok) throw new Error('os filtros da análise nunca recusam')
  return r.dados
}

describe('RF-17a · Filtros da análise', () => {
  it.each(casosFiltrosDaAnalise)('$descricao', ({ entrada, esperado }) => {
    expect(resumirFiltros(ler(entrada))).toEqual(esperado)
  })

  it('os escolhidos da dimensão comparada vêm do filtro dela', () => {
    const f = ler({ por: 'destino', itens: 'PST-001', destinos: 'CNC-01,CNC-03' })
    expect(escolhidosDaDimensao(f)).toEqual(['CNC-01', 'CNC-03'])
    expect(filtrosAtivos(f)).toBe(2)
  })

  it('parâmetro repetido na URL vale como lista', () => {
    expect(ler({ itens: ['PST-001', 'PST-002'] }).itens).toEqual(['PST-001', 'PST-002'])
  })

  it('código com mais de 120 caracteres é descartado', () => {
    expect(ler({ itens: `PST-001,${'x'.repeat(121)}` }).itens).toEqual(['PST-001'])
  })

  it('a URL dos atalhos e do CSV leva só o que foge do padrão', () => {
    const f = ler({ itens: 'PST-001,PST-004', medida: 'perdas' })
    expect(parametrosDaAnalise({ ...f, de: '2026-09-01', ate: '2026-09-27' })).toEqual({
      de: '2026-09-01',
      ate: '2026-09-27',
      medida: 'perdas',
      itens: 'PST-001,PST-004',
    })
  })
})
