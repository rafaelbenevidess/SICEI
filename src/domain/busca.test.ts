import { describe, expect, it } from 'vitest'
import { buscarItens, buscarOpcoes, mesmaSequencia, normalizarBusca, pontuarBusca } from './busca'
import { casosBusca, casosOpcoes, ITENS_DE_EXEMPLO, OPCOES_DE_EXEMPLO } from './busca.casos'

describe('RF-11 · Busca tolerante de itens', () => {
  it.each(casosBusca)('$descricao', ({ entrada, esperado }) => {
    expect(buscarItens(entrada, ITENS_DE_EXEMPLO).map((i) => i.codigo)).toEqual(esperado)
  })

  it('termo vazio devolve todos', () => {
    expect(buscarItens('  ', ITENS_DE_EXEMPLO)).toHaveLength(ITENS_DE_EXEMPLO.length)
  })

  it('código exato vale mais que posição, que vale mais que descrição', () => {
    const item = ITENS_DE_EXEMPLO[0]
    expect(pontuarBusca('pst001', item)).toBeGreaterThan(pontuarBusca('a01g01c01', item))
    expect(pontuarBusca('a01g01c01', item)).toBeGreaterThan(pontuarBusca('4325', item))
  })
})

describe('RF-11 · Normalização do que foi digitado', () => {
  it.each([
    ['Pst-001', 'PST001'],
    [' a01 g01 c02 ', 'A01G01C02'],
    ['Fresação', 'FRESACAO'],
  ])('%s → %s', (entrada, esperado) => {
    expect(normalizarBusca(entrada)).toBe(esperado)
  })

  it.each([
    ['PST1', 'PST-001', true],
    ['A1G1C2', 'A01-G01-C02', true],
    ['PST10', 'PST-001', false],
    ['PST', 'PST-001', false],
    ['', 'PST-001', false],
  ])('%s e %s são o mesmo código? %s', (a, b, esperado) => {
    expect(mesmaSequencia(a, b)).toBe(esperado)
  })
})

describe('RF-11 · Busca nas listas de escolha (fornecedor, colaborador, destino, posição)', () => {
  it.each(casosOpcoes)('$descricao', ({ entrada, esperado }) => {
    expect(buscarOpcoes(entrada, OPCOES_DE_EXEMPLO).map((o) => o.valor)).toEqual(esperado)
  })

  it('termo vazio devolve todas, na ordem original', () => {
    expect(buscarOpcoes('', OPCOES_DE_EXEMPLO).map((o) => o.valor)).toEqual(
      OPCOES_DE_EXEMPLO.map((o) => o.valor),
    )
  })

  it('o nome vale mais que o texto de apoio: "almox" acha pelo setor, "juli" pelo nome', () => {
    expect(buscarOpcoes('juli', OPCOES_DE_EXEMPLO)[0].valor).toBe('c2')
    expect(buscarOpcoes('almox', OPCOES_DE_EXEMPLO).map((o) => o.valor)).toEqual(['c2'])
  })

  it('duas palavras em textos diferentes: "carlos usinagem" → Carlos Pereira', () => {
    expect(buscarOpcoes('carlos usinagem', OPCOES_DE_EXEMPLO).map((o) => o.valor)).toEqual(['c1'])
  })
})
