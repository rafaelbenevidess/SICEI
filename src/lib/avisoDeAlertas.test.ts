import { describe, expect, it } from 'vitest'
import { avisoJaVisto, mostrarAvisoDeAlertas, tituloDoAvisoDeAlertas } from './avisoDeAlertas'

const base = { marcado: true, podeDarCiente: true, semCiente: 3, caminho: '/painel' }

describe('RF-13 · Pop-up de alertas sem ciente depois do login', () => {
  it('Gestor que acabou de entrar, com 3 alertas sem ciente → mostra', () => {
    expect(mostrarAvisoDeAlertas(base)).toBe(true)
  })
  it('já passou pela tela de alertas (cookie apagado) → não mostra', () => {
    expect(mostrarAvisoDeAlertas({ ...base, marcado: false })).toBe(false)
  })
  it('perfil que não dá ciente (Almoxarife, Consulta) → não mostra', () => {
    expect(mostrarAvisoDeAlertas({ ...base, podeDarCiente: false })).toBe(false)
  })
  it('nenhum alerta sem ciente → não mostra', () => {
    expect(mostrarAvisoDeAlertas({ ...base, semCiente: 0 })).toBe(false)
  })
  it('na própria tela de alertas → não mostra', () => {
    expect(mostrarAvisoDeAlertas({ ...base, caminho: '/alertas' })).toBe(false)
    expect(mostrarAvisoDeAlertas({ ...base, caminho: '/alertasx' })).toBe(true)
  })
  it('título no singular e no plural', () => {
    expect(tituloDoAvisoDeAlertas(1)).toBe('Existe 1 alerta sem ciente')
    expect(tituloDoAvisoDeAlertas(3)).toBe('Existem 3 alertas sem ciente')
  })
})

describe('RF-13 · Depois de ver os alertas, o aviso não volta até o próximo login', () => {
  it('ainda não foi à tela de alertas, está no painel → não visto', () => {
    expect(avisoJaVisto(false, '/painel')).toBe(false)
  })
  it('chegou à tela de alertas → visto', () => {
    expect(avisoJaVisto(false, '/alertas')).toBe(true)
  })
  it('já viu e foi para itens pelo menu → continua visto', () => {
    expect(avisoJaVisto(true, '/itens')).toBe(true)
  })
})
