/** Cadeia de exemplo usada no teste e na demonstração do Laboratório (aba 3). */
export const registrosDeExemplo: { seq: number; dados: Record<string, unknown> }[] = [
  {
    seq: 1,
    dados: { acao: 'COMPRA', item: 'CNMG120408-P25', quantidade: 30, usuario: 'joao.silva' },
  },
  {
    seq: 2,
    dados: {
      acao: 'CONSUMO_PRODUCAO',
      item: 'CNMG120408-P25',
      quantidade: 4,
      usuario: 'joao.silva',
      op: '2026-0457',
    },
  },
  {
    seq: 3,
    dados: {
      acao: 'ALTERAR_MINIMO',
      item: 'CNMG120408-P25',
      antes: 20,
      depois: 30,
      usuario: 'maria.souza',
    },
  },
  {
    seq: 4,
    dados: { acao: 'PERDA_QUEBRA', item: 'WNMG080408-M15', quantidade: 1, usuario: 'joao.silva' },
  },
  {
    seq: 5,
    dados: { acao: 'ESTORNO', item: 'CNMG120408-P25', quantidade: 4, usuario: 'maria.souza' },
  },
]
