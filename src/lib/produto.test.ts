import { describe, expect, it } from 'vitest'
import { anosDeDireitos, PRODUTO } from './produto'

describe('Produto · Dados do SICEI e da licença', () => {
  it('sigla e nome por extenso', () => {
    expect(PRODUTO.sigla).toBe('SICEI')
    expect(PRODUTO.nome).toBe('Sistema Inteligente de Controle de Estoques Industriais')
  })

  it.each([
    [2026, 2026, '2026'],
    [2028, 2026, '2026–2028'],
    [2025, 2026, '2026'],
  ])('ano atual %i com início em %i mostra "%s"', (atual, inicial, esperado) => {
    expect(anosDeDireitos(atual, inicial)).toBe(esperado)
  })
})
