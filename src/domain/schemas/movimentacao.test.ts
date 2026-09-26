import { describe, expect, it } from 'vitest'
import { validar } from './comum'
import { schemaEstorno, schemaInventario, validarMovimentacao } from './movimentacao'
import { casosFormularioMovimentacao } from './movimentacao.casos'

describe('RN-10 / RN-11 · Campos obrigatórios por tipo de movimentação', () => {
  it.each(casosFormularioMovimentacao)('$descricao', ({ entrada, esperado }) => {
    const r = validarMovimentacao(entrada)
    expect(r.ok ? [] : Object.keys(r.erros)).toEqual(esperado)
  })
  it('converte "38,90" em 38.9 e caixas ficam marcadas para conversão', () => {
    const r = validarMovimentacao({
      tipo: 'COMPRA',
      itemId: 'i',
      quantidade: '3',
      unidade: 'CAIXA',
      fornecedorId: 'f',
      precoUnitario: '38,90',
      notaFiscal: ' 12345 ',
    })
    expect(r).toMatchObject({
      ok: true,
      dados: { quantidade: 3, unidade: 'CAIXA', precoUnitario: 38.9, notaFiscal: '12345' },
    })
  })
  it('unidade padrão é UNIDADE e observação vazia some', () => {
    const r = validarMovimentacao({
      tipo: 'PERDA_QUEBRA',
      itemId: 'i',
      quantidade: 1,
      motivo: 'Quebrou',
      observacao: '',
    })
    expect(r).toMatchObject({ ok: true, dados: { unidade: 'UNIDADE' } })
    expect(r.ok && r.dados.observacao).toBeUndefined()
  })
  it('tipo desconhecido é recusado', () => {
    const r = validarMovimentacao({ tipo: 'ROUBO', itemId: 'i', quantidade: 1 })
    expect(r.ok).toBe(false)
    expect(!r.ok && r.erros.tipo).toBe('Escolha o tipo de movimentação.')
  })
  it('mensagens em português', () => {
    const r = validarMovimentacao({ tipo: 'CONSUMO_PRODUCAO', itemId: 'i', quantidade: 1 })
    expect(!r.ok && r.erros).toEqual({
      destinoId: 'Escolha o destino.',
      ordemProducao: 'Informe a ordem de produção.',
      colaboradorId: 'Escolha o colaborador que retirou.',
    })
  })
})

describe('RN-12 · Formulário de estorno', () => {
  it('justificativa curta é recusada', () => {
    expect(validar(schemaEstorno, { movimentacaoId: 'm', justificativa: 'ok' }).ok).toBe(false)
  })
  it('justificativa adequada é aceita', () => {
    expect(
      validar(schemaEstorno, { movimentacaoId: 'm', justificativa: 'Lançado no item errado' }).ok,
    ).toBe(true)
  })
})

describe('RN-13 · Formulário de inventário', () => {
  it('contagem zero é aceita', () => {
    expect(
      validar(schemaInventario, { itemId: 'i', contado: '0', justificativa: 'Contagem mensal' }).ok,
    ).toBe(true)
  })
  it('sem justificativa é recusado', () => {
    const r = validar(schemaInventario, { itemId: 'i', contado: 3 })
    expect(!r.ok && r.erros.justificativa).toBe('Informe a justificativa.')
  })
})
