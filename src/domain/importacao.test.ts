import { describe, expect, it } from 'vitest'
import { COLUNAS_IMPORTACAO, colunasFaltando, validarLinhasImportacao } from './importacao'

const valida = {
  codigo: 'PST-001',
  descricao: 'Pastilha CNMG 120408 P25',
  iso: 'CNMG 120408',
  classe: 'P25',
  cobertura: 'CVD',
  aplicacao: 'torneamento',
  fabricante: 'Sandvik',
  embalagem: '10',
  estoque_minimo: '20',
  estoque_maximo: '',
  fornecedor_cnpj: '11.222.333/0001-81',
  lead_time_dias: '5',
  posicao: 'A01-G03-C04',
  saldo_inicial: '35',
}

describe('RF-25 · Importação da planilha', () => {
  it('linha completa é aceita e convertida', () => {
    const [r] = validarLinhasImportacao([valida])
    expect(r).toMatchObject({
      linha: 2,
      ok: true,
      dados: {
        aplicacao: 'TORNEAMENTO',
        embalagem: 10,
        saldo_inicial: 35,
        fornecedor_cnpj: '11222333000181',
      },
    })
  })
  it('critério do RF-25: cada linha inválida mostra os seus erros', () => {
    const [ok, ruim] = validarLinhasImportacao([
      valida,
      {
        ...valida,
        codigo: 'PST-002',
        fornecedor_cnpj: '123',
        posicao: 'gaveta 3',
        saldo_inicial: '-1',
      },
    ])
    expect(ok.ok).toBe(true)
    expect(ruim).toEqual({
      linha: 3,
      ok: false,
      erros: [
        'fornecedor_cnpj: CNPJ do fornecedor inválido.',
        'posicao: Posição deve estar no formato A01-G03-C04.',
        'saldo_inicial: Saldo inicial precisa ser um inteiro (0 ou mais).',
      ],
    })
  })
  it('código repetido no arquivo é recusado', () => {
    const r = validarLinhasImportacao([valida, { ...valida, codigo: 'pst-001' }])
    expect(r[1]).toEqual({
      linha: 3,
      ok: false,
      erros: ['codigo: repetido (já aparece na linha 2).'],
    })
  })
  it('RN-25: a mesma posição em duas linhas do arquivo é recusada', () => {
    const r = validarLinhasImportacao([
      valida,
      { ...valida, codigo: 'PST-002', posicao: 'a01-g03-c04' },
    ])
    expect(r[1]).toEqual({
      linha: 3,
      ok: false,
      erros: ['posicao: repetida (já usada na linha 2); um item por compartimento (RN-25).'],
    })
  })
  it('aplicação "Furação" com acento é aceita', () => {
    const [r] = validarLinhasImportacao([{ ...valida, aplicacao: 'Furação' }])
    expect(r.ok && r.dados.aplicacao).toBe('FURACAO')
  })
  it('máximo menor que o mínimo é recusado', () => {
    const [r] = validarLinhasImportacao([{ ...valida, estoque_maximo: '10' }])
    expect(r.ok).toBe(false)
  })
  it('aplicação desconhecida é recusada', () => {
    const [r] = validarLinhasImportacao([{ ...valida, aplicacao: 'SOLDA' }])
    expect(!r.ok && r.erros[0]).toMatch(/^aplicacao:/)
  })
})

describe('RF-25 · Cabeçalho do CSV', () => {
  it('modelo completo não tem colunas faltando', () => {
    expect(colunasFaltando([...COLUNAS_IMPORTACAO])).toEqual([])
  })
  it('aponta as colunas que faltam, ignorando maiúsculas e espaços', () => {
    expect(
      colunasFaltando(
        COLUNAS_IMPORTACAO.filter((c) => c !== 'saldo_inicial').map((c) => ` ${c.toUpperCase()} `),
      ),
    ).toEqual(['saldo_inicial'])
  })
})
