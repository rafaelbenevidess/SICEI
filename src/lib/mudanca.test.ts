import { describe, expect, it } from 'vitest'
import { hashCurto, resumoDaMudanca } from './mudanca'

describe('RF-21 · Resumo do antes → depois no log de auditoria', () => {
  it('movimentação: mostra o saldo antes (39) e depois (35)', () => {
    expect(
      resumoDaMudanca(null, {
        id: 'x',
        tipo: 'CONSUMO_PRODUCAO',
        quantidade: 4,
        saldoAnterior: 39,
        saldoPosterior: 35,
      }),
    ).toEqual({ antes: 'saldo: 39', depois: 'saldo: 35' })
  })

  it('alteração: mostra só os campos que mudaram (posicao ∅ → A01-G01-C01)', () => {
    expect(resumoDaMudanca({ posicao: null }, { posicao: 'A01-G01-C01' })).toEqual({
      antes: 'posicao: ∅',
      depois: 'posicao: A01-G01-C01',
    })
  })

  it('alteração com campos iguais e diferentes: ignora os iguais', () => {
    expect(
      resumoDaMudanca(
        { codigo: 'PT-0024', estoqueMinimo: 10, ativo: true },
        { codigo: 'PT-0024', estoqueMinimo: 12, ativo: true },
      ),
    ).toEqual({ antes: 'estoqueMinimo: 10', depois: 'estoqueMinimo: 12' })
  })

  it('criação: lista os campos mais informativos primeiro e esconde ids', () => {
    expect(
      resumoDaMudanca(null, {
        nome: 'Ana',
        login: 'ana.santos',
        setor: 'PCP',
        perfil: 'CONSULTA',
        id: 'abc',
      }),
    ).toEqual({ antes: null, depois: 'login: ana.santos · perfil: CONSULTA · nome: Ana · +1' })
  })

  it('criação sem campos relevantes: nada a mostrar', () => {
    expect(resumoDaMudanca(null, { id: 'abc', criadoEm: '2026-09-27' })).toEqual({
      antes: null,
      depois: null,
    })
  })

  it('sem antes nem depois (ex.: LOGIN): os dois lados vazios', () => {
    expect(resumoDaMudanca(null, null)).toEqual({ antes: null, depois: null })
  })

  it('valores que não são objeto viram texto; objetos longos são encurtados', () => {
    expect(resumoDaMudanca('A', 42)).toEqual({ antes: 'A', depois: '42' })
    const r = resumoDaMudanca(null, { lista: { a: 'x'.repeat(40) } })
    expect(r.depois).toMatch(/^lista: \{"a":"x+…$/)
  })

  it('texto muito longo é cortado em 90 caracteres', () => {
    const r = resumoDaMudanca(null, { nome: 'n'.repeat(200) })
    expect(r.depois).toHaveLength(90)
    expect(r.depois?.endsWith('…')).toBe(true)
  })

  it('objetos iguais: mostra os campos de cada lado', () => {
    expect(resumoDaMudanca({ nivel: 'ATENCAO' }, { nivel: 'ATENCAO' })).toEqual({
      antes: 'nivel: ATENCAO',
      depois: 'nivel: ATENCAO',
    })
  })
})

describe('RF-21 · Hash encurtado', () => {
  it('64 caracteres viram 4…4', () => {
    expect(hashCurto('9f3a' + '0'.repeat(56) + 'c21e')).toBe('9f3a…c21e')
  })
  it('hash curto fica como está', () => {
    expect(hashCurto('abc')).toBe('abc')
  })
})
