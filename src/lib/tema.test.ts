import { describe, expect, it } from 'vitest'
import { outroTema, temaDoCookie } from './tema'

describe('Tema da interface', () => {
  it.each([
    ['escuro', 'escuro'],
    ['claro', 'claro'],
    [undefined, 'claro'],
    ['azul', 'claro'],
  ])('cookie %j → %s', (valor, esperado) => {
    expect(temaDoCookie(valor)).toBe(esperado)
  })

  it('alterna entre claro e escuro', () => {
    expect(outroTema('claro')).toBe('escuro')
    expect(outroTema('escuro')).toBe('claro')
  })
})
