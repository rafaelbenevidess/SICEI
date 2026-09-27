import { describe, expect, it } from 'vitest'
import {
  checklistDaSenha,
  senhaProntaParaEnviar,
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

describe('RN-22 · Checklist da nova senha na tela', () => {
  const login = 'marina.costa'
  const estados = (nova: string, confirmacao: string) =>
    checklistDaSenha({ nova, confirmacao, login }).map((r) => r.ok)

  it('vazia: nada atendido, histórico fica para o servidor', () => {
    expect(estados('', '')).toEqual([false, false, null, false])
  })
  it('"fresa-torno-2026" repetida: tudo atendido e pronta para enviar', () => {
    const regras = checklistDaSenha({
      nova: 'fresa-torno-2026',
      confirmacao: 'fresa-torno-2026',
      login,
    })
    expect(regras.map((r) => r.ok)).toEqual([true, true, null, true])
    expect(senhaProntaParaEnviar(regras)).toBe(true)
  })
  it('9 caracteres: falha o tamanho mínimo', () => {
    expect(estados('curta-123', 'curta-123')[0]).toBe(false)
  })
  it('igual ao login (sem diferenciar maiúsculas): falha a regra do login', () => {
    expect(estados('Marina.Costa', 'Marina.Costa')[1]).toBe(false)
  })
  it('confirmação diferente: não está pronta para enviar', () => {
    const regras = checklistDaSenha({ nova: 'fresa-torno-2026', confirmacao: 'fresa', login })
    expect(regras[3].ok).toBe(false)
    expect(senhaProntaParaEnviar(regras)).toBe(false)
  })
  it('mais de 128 caracteres: falha o tamanho', () => {
    const longa = 'a'.repeat(129)
    expect(estados(longa, longa)[0]).toBe(false)
  })
})
