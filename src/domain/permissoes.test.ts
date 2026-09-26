import { describe, expect, it } from 'vitest'
import {
  ErroDePermissao,
  exigirPermissao,
  MATRIZ,
  pode,
  permissaoDoTipo,
  PERMISSOES,
} from './permissoes'
import { casosPermissao } from './permissoes.casos'
import { TIPOS_MOVIMENTACAO } from './tipos'

describe('Doc 02 seção 5 · Matriz de permissões', () => {
  it.each(casosPermissao)('$descricao', ({ entrada, esperado }) => {
    expect(pode(entrada.perfil, entrada.permissao)).toBe(esperado)
  })
  it('toda permissão existente está coberta pelos casos', () => {
    const cobertas = new Set(casosPermissao.map((c) => c.entrada.permissao))
    expect(PERMISSOES.filter((p) => !cobertas.has(p))).toEqual(['alertas:ver'])
    expect([...MATRIZ.CONSULTA]).toContain('alertas:ver')
  })
})

describe('Permissão no servidor', () => {
  it('exigirPermissao lança ErroDePermissao para o Almoxarife estornar', () => {
    expect(() => exigirPermissao('ALMOXARIFE', 'movimentacao:estornar')).toThrow(ErroDePermissao)
  })
  it('exigirPermissao não lança para o Gestor estornar', () => {
    expect(() => exigirPermissao('GESTOR', 'movimentacao:estornar')).not.toThrow()
  })
})

describe('Doc 01 seção 4 · Quem pode lançar cada tipo', () => {
  it.each([
    ['COMPRA', 'movimentacao:entrada'],
    ['DEVOLUCAO_PRODUCAO', 'movimentacao:entrada'],
    ['CONSUMO_PRODUCAO', 'movimentacao:saida'],
    ['PERDA_QUEBRA', 'movimentacao:saida'],
    ['AJUSTE_POSITIVO', 'movimentacao:ajuste'],
    ['AJUSTE_NEGATIVO', 'movimentacao:ajuste'],
    ['ESTORNO', 'movimentacao:estornar'],
  ] as const)('%s exige %s', (tipo, permissao) => {
    expect(permissaoDoTipo(tipo)).toBe(permissao)
  })
  it('todos os tipos têm permissão definida', () => {
    for (const t of TIPOS_MOVIMENTACAO) expect(PERMISSOES).toContain(permissaoDoTipo(t))
  })
})
