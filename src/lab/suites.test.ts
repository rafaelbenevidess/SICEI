import { describe, expect, it } from 'vitest'
import {
  conferirEsperado,
  executarCaso,
  iguais,
  SUITES,
  totalDeCasos,
  type SuiteLab,
} from './suites'

describe('RNF-13 · Laboratório: os casos do navegador são os mesmos do Vitest', () => {
  it.each(SUITES.map((s) => [`${s.id} · ${s.titulo}`, s] as [string, SuiteLab]))(
    '%s: todos os casos oficiais passam',
    async (_, suite) => {
      expect(suite.casos.length).toBeGreaterThan(0)
      const resultados = await Promise.all(suite.casos.map((c) => executarCaso(suite, c)))
      expect(resultados.filter((r) => !r.passou)).toEqual([])
    },
  )
  it('o laboratório tem mais de 100 casos oficiais', () => {
    expect(totalDeCasos()).toBeGreaterThan(100)
  })
})

describe('RNF-13 · Laboratório: formulários "Crie o seu teste"', () => {
  const comFormulario = SUITES.filter((s) => s.formulario)
  it.each(comFormulario.map((s) => [`${s.id} · ${s.titulo}`, s] as [string, SuiteLab]))(
    '%s: os valores padrão produzem um resultado e uma explicação',
    (_, suite) => {
      const f = suite.formulario!
      const valores = Object.fromEntries(f.campos.map((c) => [c.nome, c.padrao ?? '']))
      const r = f.executar(valores)
      expect(r.resultado).not.toBe('')
      expect(r.explicacao).not.toBe('')
    },
  )
  it('RN-15 pelo formulário: 20, 3, 7 → 41 com a conta explicada', () => {
    const f = SUITES.find((s) => s.titulo === 'Ponto de reposição')!.formulario!
    const r = f.executar({ minimo: '20', consumoDiario: '3', leadTime: '7' })
    expect(r).toEqual({
      resultado: '41',
      explicacao: '20 + 3 × 7 = 41 → arredondado para cima: 41',
    })
  })
  it('RN-15 pelo formulário: mínimo negativo mostra o erro', () => {
    const f = SUITES.find((s) => s.titulo === 'Ponto de reposição')!.formulario!
    expect(f.executar({ minimo: '-1', consumoDiario: '3', leadTime: '7' }).resultado).toBe('erro')
  })
  it('RN-08 pelo formulário: saldo 3, saída 5 → recusada', () => {
    const f = SUITES.find((s) => s.id === 'RN-08')!.formulario!
    expect(
      f.executar({ tipo: 'CONSUMO_PRODUCAO', quantidade: '5', saldoAtual: '3', itemAtivo: 'sim' }),
    ).toEqual({
      resultado: 'recusada',
      explicacao: 'Saldo disponível: 3',
    })
  })
  it('RN-22 pelo formulário: repetir uma das últimas senhas é recusado', () => {
    const f = SUITES.find((s) => s.titulo === 'Política de senha')!.formulario!
    expect(
      f.executar({ senha: 'SenhaAntiga2025', login: 'x', ultimas: 'a, SenhaAntiga2025' }).resultado,
    ).toBe('recusada')
  })
  it('RN-20 pelo formulário: exemplo do doc 01 → 100', () => {
    const f = SUITES.find((s) => s.id === 'RN-20')!.formulario!
    const r = f.executar({
      saldo: '35',
      minimo: '20',
      pontoReposicao: '41',
      maximo: '',
      consumoDiario: '3',
      embalagem: '10',
    })
    expect(r.resultado).toBe('100')
  })
})

describe('RNF-13 · Laboratório: comparação com o esperado do avaliador', () => {
  it.each([
    ['41', ' 41 ', true],
    ['1,1', '1.1', true],
    ['ATENCAO', 'atencao', true],
    ['maria.souza2', 'maria.souza', false],
    ['aceita', 'recusada', false],
    ['AJUSTE_POSITIVO de 3', 'ajuste_positivo  de 3', true],
    ['0', '', false],
  ])('resultado "%s" com esperado "%s" → %s', (resultado, esperado, ok) => {
    expect(conferirEsperado(resultado, esperado)).toBe(ok)
  })
  it('iguais compara objetos sem depender da ordem das chaves', () => {
    expect(iguais({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    expect(iguais([1, 2], [2, 1])).toBe(false)
  })
  it('um caso que lança erro conta como falha, com a mensagem', async () => {
    const suite = {
      ...SUITES[0],
      executar: () => {
        throw new Error('quebrou')
      },
    }
    const r = await executarCaso(suite, suite.casos[0])
    expect(r.passou).toBe(false)
    expect(r.obtido).toBe('erro: quebrou')
  })
})
