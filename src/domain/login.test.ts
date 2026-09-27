import { describe, expect, it } from 'vitest'
import { gerarLogin, loginBase, normalizarParte, previaDoLogin } from './login'
import { casosLogin } from './login.casos'

describe('RN-21 · Geração de login', () => {
  it.each(casosLogin)('$descricao', ({ entrada, esperado }) => {
    expect(gerarLogin(entrada.nome, entrada.sobrenome, entrada.existentes)).toBe(esperado)
  })
  it('RN-21b: login de usuário inativo também conta como existente', () => {
    // a lista de existentes vem do banco com ativos e inativos
    expect(gerarLogin('Ana', 'Lima', ['ana.lima'])).toBe('ana.lima2')
  })
  it('comparação com os existentes ignora maiúsculas', () => {
    expect(gerarLogin('Ana', 'Lima', ['Ana.Lima'])).toBe('ana.lima2')
  })
  it('sobrenome só com partículas é um erro', () => {
    expect(() => loginBase('Ana', 'de')).toThrow('Informe o sobrenome do funcionário.')
  })
  it('nome vazio é um erro', () => {
    expect(() => loginBase('  ', 'Lima')).toThrow('Informe o nome do funcionário.')
  })
  it('normaliza removendo acentos e símbolos', () => {
    expect(normalizarParte('Érica-2')).toBe('erica')
  })
})

describe('RF-02 · Prévia do login na tela de novo usuário', () => {
  it('sem nome ou sobrenome ainda, não há prévia', () => {
    expect(previaDoLogin('Maria', '', [])).toBeNull()
    expect(previaDoLogin('  ', 'Souza', [])).toBeNull()
  })

  it('login livre: explica a regra', () => {
    expect(previaDoLogin('Maria Aparecida', 'de Souza', [])).toEqual({
      login: 'maria.souza',
      nota: 'Sem acentos, sem partículas, último sobrenome.',
    })
  })

  it('login já usado (mesmo por inativo): próximo número livre', () => {
    expect(previaDoLogin('Maria', 'Souza', ['maria.souza'])).toEqual({
      login: 'maria.souza2',
      nota: 'maria.souza já existe ou existiu: recebe o próximo número livre.',
    })
  })
})
