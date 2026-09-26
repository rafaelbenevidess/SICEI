import type { CasoDeTeste } from '../tipos'

/** Entrada: campos do formulário; esperado: campos com erro (vazio = formulário aceito). */
export const casosFormularioMovimentacao: CasoDeTeste<Record<string, unknown>, string[]>[] = [
  {
    descricao: 'critério do RF-07: compra completa (fornecedor, preço, NF) → aceita',
    entrada: {
      tipo: 'COMPRA',
      itemId: 'item-1',
      quantidade: '3',
      unidade: 'CAIXA',
      fornecedorId: 'forn-a',
      precoUnitario: '38,90',
      notaFiscal: '12345',
    },
    esperado: [],
  },
  {
    descricao: 'critério do RF-07: compra sem preço e sem nota fiscal → recusada',
    entrada: { tipo: 'COMPRA', itemId: 'item-1', quantidade: 3, fornecedorId: 'forn-a' },
    esperado: ['precoUnitario', 'notaFiscal'],
  },
  {
    descricao: 'critério do RF-08: consumo completo (destino, OP, colaborador) → aceito',
    entrada: {
      tipo: 'CONSUMO_PRODUCAO',
      itemId: 'item-1',
      quantidade: 4,
      destinoId: 'cnc-03',
      ordemProducao: '2026-0457',
      colaboradorId: 'carlos',
    },
    esperado: [],
  },
  {
    descricao: 'critério do RF-08: consumo sem destino, sem OP e sem colaborador → recusado',
    entrada: { tipo: 'CONSUMO_PRODUCAO', itemId: 'item-1', quantidade: 4 },
    esperado: ['destinoId', 'ordemProducao', 'colaboradorId'],
  },
  {
    descricao: 'critério do RF-08: perda sem motivo → recusada',
    entrada: { tipo: 'PERDA_QUEBRA', itemId: 'item-1', quantidade: 1, motivo: '   ' },
    esperado: ['motivo'],
  },
  {
    descricao: 'critério do RF-07: devolução sem colaborador → recusada',
    entrada: {
      tipo: 'DEVOLUCAO_PRODUCAO',
      itemId: 'item-1',
      quantidade: 2,
      destinoId: 'cnc-03',
      motivo: 'Sobrou da OP',
    },
    esperado: ['colaboradorId'],
  },
  {
    descricao: 'quantidade fracionada → recusada',
    entrada: { tipo: 'PERDA_QUEBRA', itemId: 'item-1', quantidade: '1,5', motivo: 'Quebrou' },
    esperado: ['quantidade'],
  },
  {
    descricao: 'preço com 3 casas decimais → recusado',
    entrada: {
      tipo: 'COMPRA',
      itemId: 'item-1',
      quantidade: 1,
      fornecedorId: 'f',
      precoUnitario: 10.555,
      notaFiscal: '1',
    },
    esperado: ['precoUnitario'],
  },
]
