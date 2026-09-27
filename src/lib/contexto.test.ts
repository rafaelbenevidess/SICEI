import { describe, expect, it } from 'vitest'
import { contextoDaMovimentacao } from './contexto'

describe('Contexto da movimentação numa linha', () => {
  const compra = {
    tipo: 'COMPRA',
    fornecedor: { razaoSocial: 'Ferramentas Sul Ltda', nomeFantasia: 'Ferramentas Sul' },
    notaFiscal: '12345',
    precoUnitario: '52.4',
  }

  it('compra: fornecedor, NF e preço para quem vê preços', () => {
    expect(contextoDaMovimentacao(compra, true)).toBe('Ferramentas Sul · NF 12345 · R$ 52,40')
  })

  it('compra sem permissão de ver preços (RN-05b): sem o preço', () => {
    expect(contextoDaMovimentacao(compra, false)).toBe('Ferramentas Sul · NF 12345')
  })

  it('consumo: destino, OP e quem retirou', () => {
    expect(
      contextoDaMovimentacao(
        {
          tipo: 'CONSUMO_PRODUCAO',
          destino: { nome: 'Torno CNC 03' },
          ordemProducao: '2026-0457',
          colaborador: { nome: 'Carlos Pereira' },
        },
        true,
      ),
    ).toBe('Torno CNC 03 · OP 2026-0457 · Carlos Pereira')
  })

  it('perda: só o motivo; sem nada, um travessão', () => {
    expect(
      contextoDaMovimentacao({ tipo: 'PERDA_QUEBRA', motivo: 'Quebra no manuseio' }, true),
    ).toBe('Quebra no manuseio')
    expect(contextoDaMovimentacao({ tipo: 'AJUSTE_POSITIVO' }, true)).toBe('—')
  })
})
