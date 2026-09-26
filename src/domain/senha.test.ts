import { describe, expect, it } from 'vitest'
import {
  ALFABETO_SENHA_PROVISORIA,
  deveBloquear,
  excedeuLimiteDoIp,
  gerarSenhaProvisoria,
  inteiroAleatorio,
  problemasDaSenha,
} from './senha'
import { casosBloqueio, casosSenha } from './senha.casos'

describe('RN-22 · Política de senha', () => {
  it.each(casosSenha)('$descricao', ({ entrada, esperado }) => {
    expect(problemasDaSenha(entrada)).toEqual(esperado)
  })
  it('igual ao login ignorando maiúsculas', () => {
    expect(
      problemasDaSenha({ senha: 'JOAO.SILVA', login: 'joao.silva', repeteUmaDasUltimas: false }),
    ).toContain('A senha não pode ser igual ao login.')
  })
  it('senha acima de 128 caracteres é recusada', () => {
    expect(
      problemasDaSenha({ senha: 'a'.repeat(129), login: 'x', repeteUmaDasUltimas: false }),
    ).toEqual(['A senha pode ter no máximo 128 caracteres.'])
  })
})

describe('RN-22 · Bloqueio após falhas', () => {
  it.each(casosBloqueio)('$descricao', ({ entrada, esperado }) => {
    expect(deveBloquear(entrada)).toBe(esperado)
  })
  it('limite por IP: 19 tentativas passam, a 20ª é barrada', () => {
    expect(excedeuLimiteDoIp(19)).toBe(false)
    expect(excedeuLimiteDoIp(20)).toBe(true)
  })
})

describe('RN-21 · Senha provisória', () => {
  it('tem 12 caracteres, só do alfabeto sem ambíguos', () => {
    for (let i = 0; i < 200; i++) {
      const senha = gerarSenhaProvisoria()
      expect(senha).toHaveLength(12)
      expect([...senha].every((c) => ALFABETO_SENHA_PROVISORIA.includes(c))).toBe(true)
    }
  })
  it('nunca contém 0, O, o, 1, l ou I', () => {
    expect(ALFABETO_SENHA_PROVISORIA).not.toMatch(/[0Oo1lI]/)
  })
  it('sempre tem maiúscula, minúscula e dígito', () => {
    for (let i = 0; i < 200; i++) {
      const senha = gerarSenhaProvisoria()
      expect(senha).toMatch(/[A-Z]/)
      expect(senha).toMatch(/[a-z]/)
      expect(senha).toMatch(/[2-9]/)
    }
  })
  it('descarta sorteios sem dígito e sorteia de novo', () => {
    // primeiro sorteio: só "A" (índice 0); depois alterna maiúscula, minúscula e dígito
    const sequencia = [...Array(12).fill(0), 0, 24, 48, ...Array(9).fill(0)]
    let i = 0
    const senha = gerarSenhaProvisoria(() => sequencia[i++])
    expect(senha).toBe('Aa2AAAAAAAAA')
  })
  it('inteiroAleatorio fica dentro do limite', () => {
    for (let i = 0; i < 500; i++) {
      const n = inteiroAleatorio(7)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(7)
    }
  })
})
