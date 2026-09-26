import type { CasoDeTeste, Decisao } from './tipos'
import type { MovimentacaoOriginal, TipoComum } from './movimentacao'

type Saldos = { saldoAnterior: number; saldoPosterior: number }

export const casosMovimentacao: CasoDeTeste<
  { tipo: TipoComum; quantidade: number; saldoAtual: number; itemAtivo: boolean },
  Decisao<Saldos>
>[] = [
  {
    descricao: 'critério do RF-08: saldo 12, consumo de 4 → saldo 8',
    entrada: { tipo: 'CONSUMO_PRODUCAO', quantidade: 4, saldoAtual: 12, itemAtivo: true },
    esperado: { ok: true, valor: { saldoAnterior: 12, saldoPosterior: 8 } },
  },
  {
    descricao: 'critério do RF-08: saldo 3, saída de 5 → recusada com "Saldo disponível: 3"',
    entrada: { tipo: 'CONSUMO_PRODUCAO', quantidade: 5, saldoAtual: 3, itemAtivo: true },
    esperado: { ok: false, motivo: 'Saldo disponível: 3' },
  },
  {
    descricao: 'saída que zera o saldo é aceita: saldo 4, perda de 4 → 0',
    entrada: { tipo: 'PERDA_QUEBRA', quantidade: 4, saldoAtual: 4, itemAtivo: true },
    esperado: { ok: true, valor: { saldoAnterior: 4, saldoPosterior: 0 } },
  },
  {
    descricao: 'compra de 30 com saldo 5 → 35',
    entrada: { tipo: 'COMPRA', quantidade: 30, saldoAtual: 5, itemAtivo: true },
    esperado: { ok: true, valor: { saldoAnterior: 5, saldoPosterior: 35 } },
  },
  {
    descricao: 'item inativo não recebe movimentação (RN-03)',
    entrada: { tipo: 'COMPRA', quantidade: 10, saldoAtual: 0, itemAtivo: false },
    esperado: { ok: false, motivo: 'Item inativo não recebe movimentação.' },
  },
  {
    descricao: 'quantidade fracionada é recusada (RN-07)',
    entrada: { tipo: 'CONSUMO_PRODUCAO', quantidade: 1.5, saldoAtual: 10, itemAtivo: true },
    esperado: { ok: false, motivo: 'A quantidade precisa ser um número inteiro maior que zero.' },
  },
  {
    descricao: 'quantidade negativa é recusada (RN-07)',
    entrada: { tipo: 'COMPRA', quantidade: -3, saldoAtual: 10, itemAtivo: true },
    esperado: { ok: false, motivo: 'A quantidade precisa ser um número inteiro maior que zero.' },
  },
]

export const casosEstorno: CasoDeTeste<
  { original: MovimentacaoOriginal; saldoAtual: number; justificativa: string; itemAtivo: boolean },
  Decisao<Saldos>
>[] = [
  {
    descricao: 'critério do RF-09: estorno de saída de 4 devolve 4 ao saldo',
    entrada: {
      original: { tipo: 'CONSUMO_PRODUCAO', quantidade: 4, jaEstornada: false },
      saldoAtual: 8,
      justificativa: 'Lançado no item errado',
      itemAtivo: true,
    },
    esperado: { ok: true, valor: { saldoAnterior: 8, saldoPosterior: 12 } },
  },
  {
    descricao: 'movimentação já estornada não pode ser estornada de novo',
    entrada: {
      original: { tipo: 'CONSUMO_PRODUCAO', quantidade: 4, jaEstornada: true },
      saldoAtual: 8,
      justificativa: 'Lançado no item errado',
      itemAtivo: true,
    },
    esperado: { ok: false, motivo: 'Esta movimentação já foi estornada.' },
  },
  {
    descricao: 'estorno não pode ser estornado',
    entrada: {
      original: { tipo: 'ESTORNO', quantidade: 4, jaEstornada: false },
      saldoAtual: 8,
      justificativa: 'Tentativa de desfazer',
      itemAtivo: true,
    },
    esperado: { ok: false, motivo: 'Um estorno não pode ser estornado.' },
  },
  {
    descricao: 'critério do RF-09: entrada de 30 com saldo 10 → recusado, o saldo ficaria negativo',
    entrada: {
      original: { tipo: 'COMPRA', quantidade: 30, jaEstornada: false },
      saldoAtual: 10,
      justificativa: 'NF lançada em duplicidade',
      itemAtivo: true,
    },
    esperado: { ok: false, motivo: 'Saldo disponível: 10' },
  },
  {
    descricao: 'estorno sem justificativa é recusado',
    entrada: {
      original: { tipo: 'COMPRA', quantidade: 5, jaEstornada: false },
      saldoAtual: 10,
      justificativa: '  ',
      itemAtivo: true,
    },
    esperado: { ok: false, motivo: 'Informe a justificativa do estorno.' },
  },
]

casosEstorno.push({
  descricao: 'RN-03: item inativo não recebe estorno',
  entrada: {
    original: { tipo: 'CONSUMO_PRODUCAO', quantidade: 4, jaEstornada: false },
    saldoAtual: 0,
    justificativa: 'Lançado no item errado',
    itemAtivo: false,
  },
  esperado: { ok: false, motivo: 'Item inativo não recebe movimentação.' },
})

export const casosInventario: CasoDeTeste<
  { saldo: number; contado: number },
  Decisao<{ tipo: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO'; quantidade: number } | null>
>[] = [
  {
    descricao: 'contagem igual ao saldo não gera ajuste',
    entrada: { saldo: 25, contado: 25 },
    esperado: { ok: true, valor: null },
  },
  {
    descricao: 'contou 28 com saldo 25 → AJUSTE_POSITIVO de 3',
    entrada: { saldo: 25, contado: 28 },
    esperado: { ok: true, valor: { tipo: 'AJUSTE_POSITIVO', quantidade: 3 } },
  },
  {
    descricao: 'contou 20 com saldo 25 → AJUSTE_NEGATIVO de 5',
    entrada: { saldo: 25, contado: 20 },
    esperado: { ok: true, valor: { tipo: 'AJUSTE_NEGATIVO', quantidade: 5 } },
  },
  {
    descricao: 'contagem negativa é recusada',
    entrada: { saldo: 25, contado: -1 },
    esperado: {
      ok: false,
      motivo: 'A quantidade contada precisa ser um inteiro maior ou igual a zero.',
    },
  },
]
