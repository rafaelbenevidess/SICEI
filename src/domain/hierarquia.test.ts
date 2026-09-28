import { describe, expect, it } from 'vitest'
import { podeAgirSobreUsuario, podeCriarComPerfil } from './hierarquia'
import { casosCriarComPerfil, casosHierarquia } from './hierarquia.casos'

describe('RN-21c · Administrador principal e hierarquia entre Administradores', () => {
  it.each(casosHierarquia)('$descricao', ({ entrada, esperado }) => {
    expect(
      podeAgirSobreUsuario(entrada.ator, entrada.alvo, entrada.acao, entrada.novoPerfil),
    ).toEqual(esperado)
  })
})

describe('RN-21c · Quem pode criar um Administrador', () => {
  it.each(casosCriarComPerfil)('$descricao', ({ entrada, esperado }) => {
    expect(podeCriarComPerfil(entrada.ator, entrada.perfil)).toEqual(esperado)
  })
})
