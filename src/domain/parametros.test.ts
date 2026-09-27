import { describe, expect, it } from 'vitest'
import { alteracoesDeParametros, problemaDosParametros } from './parametros'

describe('RF-26 · Limites dos parâmetros', () => {
  it.each([
    [{ janelaConsumoDias: 90, sessaoInatividadeMinutos: 30 }, null],
    [{ janelaConsumoDias: 1, sessaoInatividadeMinutos: 5 }, null],
    [{ janelaConsumoDias: 365, sessaoInatividadeMinutos: 480 }, null],
    [
      { janelaConsumoDias: 0, sessaoInatividadeMinutos: 30 },
      'A janela precisa ficar entre 1 e 365 dias.',
    ],
    [
      { janelaConsumoDias: 366, sessaoInatividadeMinutos: 30 },
      'A janela precisa ficar entre 1 e 365 dias.',
    ],
    [
      { janelaConsumoDias: 7.5, sessaoInatividadeMinutos: 30 },
      'A janela precisa ficar entre 1 e 365 dias.',
    ],
    [
      { janelaConsumoDias: NaN, sessaoInatividadeMinutos: 30 },
      'A janela precisa ficar entre 1 e 365 dias.',
    ],
    [
      { janelaConsumoDias: 90, sessaoInatividadeMinutos: 4 },
      'A sessão precisa ficar entre 5 e 480 minutos.',
    ],
    [
      { janelaConsumoDias: 90, sessaoInatividadeMinutos: 481 },
      'A sessão precisa ficar entre 5 e 480 minutos.',
    ],
  ])('%o → %s', (entrada, esperado) => {
    expect(problemaDosParametros(entrada)).toBe(esperado)
  })
})

describe('RF-26 · Últimas alterações dos parâmetros', () => {
  const quando = new Date('2026-09-12T13:20:00Z')

  it('uma linha por parâmetro que mudou; os iguais ficam de fora', () => {
    expect(
      alteracoesDeParametros([
        {
          antes: { janelaConsumoDias: 60, sessaoInatividadeMinutos: 30, emailAvisos: '' },
          depois: {
            janelaConsumoDias: 90,
            sessaoInatividadeMinutos: 30,
            emailAvisos: 'estoque@dda.com.br',
          },
          login: 'roberto.nunes',
          quando,
        },
      ]),
    ).toEqual([
      {
        titulo: 'Janela do consumo médio',
        antes: '60',
        depois: '90',
        login: 'roberto.nunes',
        quando,
      },
      {
        titulo: 'E-mail para avisos',
        antes: '(vazio)',
        depois: 'estoque@dda.com.br',
        login: 'roberto.nunes',
        quando,
      },
    ])
  })

  it('respeita o limite e a ordem dos registros', () => {
    const r = (a: number, d: number) => ({
      antes: { sessaoInatividadeMinutos: a },
      depois: { sessaoInatividadeMinutos: d },
      login: 'admin',
      quando,
    })
    const lista = alteracoesDeParametros([r(60, 30), r(30, 60), r(45, 60)], 2)
    expect(lista.map((l) => `${l.antes}→${l.depois}`)).toEqual(['60→30', '30→60'])
  })

  it('salvar sem mudar nada não gera linha; registro sem antes conta como (vazio)', () => {
    expect(
      alteracoesDeParametros([
        { antes: { janelaConsumoDias: 90 }, depois: { janelaConsumoDias: 90 }, login: 'a', quando },
        { antes: null, depois: { emailAvisos: 'x@y.com' }, login: 'a', quando },
      ]),
    ).toEqual([
      { titulo: 'E-mail para avisos', antes: '(vazio)', depois: 'x@y.com', login: 'a', quando },
    ])
  })
})
