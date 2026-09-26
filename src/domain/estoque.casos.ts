import type { CasoDeTeste, Decisao, StatusItem } from './tipos'
import type { FornecedorParaCalculo } from './estoque'

export const casosConsumoMedio: CasoDeTeste<
  { totalConsumido: number; janelaDias: number },
  number
>[] = [
  {
    descricao: 'exemplo do doc 01: 270 unidades em 90 dias → 3 por dia',
    entrada: { totalConsumido: 270, janelaDias: 90 },
    esperado: 3,
  },
  {
    descricao: 'sem consumo na janela → 0',
    entrada: { totalConsumido: 0, janelaDias: 90 },
    esperado: 0,
  },
  {
    descricao: '45 unidades em 30 dias → 1,5 por dia',
    entrada: { totalConsumido: 45, janelaDias: 30 },
    esperado: 1.5,
  },
]

export const casosPontoReposicao: CasoDeTeste<
  { minimo: number; consumoDiario: number; leadTime: number | null },
  number
>[] = [
  {
    descricao: 'exemplo do doc 01: mínimo 20, consumo 3/dia, lead time 7 → 41',
    entrada: { minimo: 20, consumoDiario: 3, leadTime: 7 },
    esperado: 41,
  },
  {
    descricao: 'sem consumo registrado, vale o mínimo',
    entrada: { minimo: 20, consumoDiario: 0, leadTime: 7 },
    esperado: 20,
  },
  {
    descricao: 'sem lead time informado, vale o mínimo',
    entrada: { minimo: 20, consumoDiario: 3, leadTime: null },
    esperado: 20,
  },
  {
    descricao: 'resultado fracionado é arredondado para cima: 10 + 1,1 × 5 = 15,5 → 16',
    entrada: { minimo: 10, consumoDiario: 1.1, leadTime: 5 },
    esperado: 16,
  },
  {
    descricao: 'mínimo zero com consumo: 0 + 2 × 3 → 6',
    entrada: { minimo: 0, consumoDiario: 2, leadTime: 3 },
    esperado: 6,
  },
]

export const casosLeadTime: CasoDeTeste<FornecedorParaCalculo[], number | null>[] = [
  {
    descricao: 'usa o lead time do fornecedor preferencial, mesmo que outro seja mais barato',
    entrada: [
      { preferencial: false, ultimoPreco: 30, leadTimeDias: 2 },
      { preferencial: true, ultimoPreco: 40, leadTimeDias: 9 },
    ],
    esperado: 9,
  },
  {
    descricao: 'sem preferencial, usa o do fornecedor com menor último preço',
    entrada: [
      { preferencial: false, ultimoPreco: 41.2, leadTimeDias: 3 },
      { preferencial: false, ultimoPreco: 38.9, leadTimeDias: 5 },
    ],
    esperado: 5,
  },
  {
    descricao: 'sem fornecedores com lead time → nenhum',
    entrada: [{ preferencial: false, ultimoPreco: null, leadTimeDias: null }],
    esperado: null,
  },
]

export const casosStatus: CasoDeTeste<
  { saldo: number; minimo: number; pontoReposicao: number },
  StatusItem
>[] = [
  {
    descricao: 'saldo 0 → ZERADO',
    entrada: { saldo: 0, minimo: 20, pontoReposicao: 41 },
    esperado: 'ZERADO',
  },
  {
    descricao: 'saldo igual ao mínimo → CRITICO',
    entrada: { saldo: 20, minimo: 20, pontoReposicao: 41 },
    esperado: 'CRITICO',
  },
  {
    descricao: 'saldo abaixo do mínimo → CRITICO',
    entrada: { saldo: 5, minimo: 20, pontoReposicao: 41 },
    esperado: 'CRITICO',
  },
  {
    descricao: 'saldo igual ao ponto de reposição → ATENCAO',
    entrada: { saldo: 41, minimo: 20, pontoReposicao: 41 },
    esperado: 'ATENCAO',
  },
  {
    descricao: 'saldo entre mínimo e ponto de reposição → ATENCAO',
    entrada: { saldo: 35, minimo: 20, pontoReposicao: 41 },
    esperado: 'ATENCAO',
  },
  {
    descricao: 'saldo acima do ponto de reposição → OK',
    entrada: { saldo: 42, minimo: 20, pontoReposicao: 41 },
    esperado: 'OK',
  },
  {
    descricao: 'mínimo zero e saldo 1 → OK quando o ponto de reposição é 0',
    entrada: { saldo: 1, minimo: 0, pontoReposicao: 0 },
    esperado: 'OK',
  },
]

export type EntradaSugestao = {
  saldo: number
  minimo: number
  pontoReposicao: number
  maximo: number | null
  consumoDiario: number
  embalagem: number
}

export const casosSugestao: CasoDeTeste<EntradaSugestao, { quantidade: number; caixas: number }>[] =
  [
    {
      descricao:
        'exemplo do doc 01: saldo 35, ponto 41, sem máximo, 3/dia, caixa de 10 → 100 (10 caixas)',
      entrada: {
        saldo: 35,
        minimo: 20,
        pontoReposicao: 41,
        maximo: null,
        consumoDiario: 3,
        embalagem: 10,
      },
      esperado: { quantidade: 100, caixas: 10 },
    },
    {
      descricao: 'com máximo 120 e saldo 15: faltam 105 → 110 (11 caixas)',
      entrada: {
        saldo: 15,
        minimo: 20,
        pontoReposicao: 41,
        maximo: 120,
        consumoDiario: 3,
        embalagem: 10,
      },
      esperado: { quantidade: 110, caixas: 11 },
    },
    {
      descricao: 'item com status OK não tem sugestão',
      entrada: {
        saldo: 80,
        minimo: 20,
        pontoReposicao: 41,
        maximo: null,
        consumoDiario: 3,
        embalagem: 10,
      },
      esperado: { quantidade: 0, caixas: 0 },
    },
    {
      descricao: 'item zerado sem consumo e sem máximo: compra até o ponto de reposição',
      entrada: {
        saldo: 0,
        minimo: 10,
        pontoReposicao: 10,
        maximo: null,
        consumoDiario: 0,
        embalagem: 5,
      },
      esperado: { quantidade: 10, caixas: 2 },
    },
  ]

export const casosConversao: CasoDeTeste<
  { quantidade: number; unidade: 'UNIDADE' | 'CAIXA'; embalagem: number },
  Decisao<number>
>[] = [
  {
    descricao: 'exemplo do doc 01: 3 caixas de 10 → 30 unidades',
    entrada: { quantidade: 3, unidade: 'CAIXA', embalagem: 10 },
    esperado: { ok: true, valor: 30 },
  },
  {
    descricao: '7 unidades → 7 unidades',
    entrada: { quantidade: 7, unidade: 'UNIDADE', embalagem: 10 },
    esperado: { ok: true, valor: 7 },
  },
  {
    descricao: 'quantidade fracionada é recusada',
    entrada: { quantidade: 2.5, unidade: 'UNIDADE', embalagem: 10 },
    esperado: { ok: false, motivo: 'A quantidade precisa ser um número inteiro maior que zero.' },
  },
  {
    descricao: 'quantidade zero é recusada',
    entrada: { quantidade: 0, unidade: 'CAIXA', embalagem: 10 },
    esperado: { ok: false, motivo: 'A quantidade precisa ser um número inteiro maior que zero.' },
  },
]

export const casosLimites: CasoDeTeste<{ minimo: number; maximo: number | null }, Decisao<true>>[] =
  [
    {
      descricao: 'mínimo 20 sem máximo → aceito',
      entrada: { minimo: 20, maximo: null },
      esperado: { ok: true, valor: true },
    },
    {
      descricao: 'mínimo 20 e máximo 100 → aceito',
      entrada: { minimo: 20, maximo: 100 },
      esperado: { ok: true, valor: true },
    },
    {
      descricao: 'máximo igual ao mínimo → recusado',
      entrada: { minimo: 20, maximo: 20 },
      esperado: { ok: false, motivo: 'O estoque máximo precisa ser maior que o mínimo.' },
    },
    {
      descricao: 'mínimo negativo → recusado',
      entrada: { minimo: -1, maximo: null },
      esperado: {
        ok: false,
        motivo: 'O estoque mínimo precisa ser um inteiro maior ou igual a zero.',
      },
    },
  ]
