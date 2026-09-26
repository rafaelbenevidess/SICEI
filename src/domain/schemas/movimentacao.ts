/**
 * Campos obrigatórios de cada tipo de movimentação (doc 01, seção 4, RN-10, RN-11, RN-12, RN-13).
 */
import { z } from 'zod'
import {
  idObrigatorio,
  inteiroNaoNegativo,
  inteiroPositivo,
  numero,
  textoObrigatorio,
  textoOpcional,
  validar,
} from './comum'

const base = {
  itemId: idObrigatorio('Escolha o item.'),
  quantidade: inteiroPositivo('A quantidade precisa ser um número inteiro maior que zero.'),
  unidade: z.enum(['UNIDADE', 'CAIXA']).default('UNIDADE'),
  observacao: textoOpcional(500),
}

const preco = numero('Informe o preço unitário.')
  .refine((n) => n > 0 && n < 1_000_000, {
    error: 'O preço unitário precisa ser maior que zero.',
  })
  .refine((n) => Math.round(n * 100) === Number((n * 100).toFixed(6)), {
    error: 'Use no máximo 2 casas decimais no preço.',
  })

export const schemaCompra = z.object({
  tipo: z.literal('COMPRA'),
  ...base,
  fornecedorId: idObrigatorio('Escolha o fornecedor.'),
  precoUnitario: preco,
  notaFiscal: textoObrigatorio('Informe o número da nota fiscal.', 30),
})

export const schemaDevolucao = z.object({
  tipo: z.literal('DEVOLUCAO_PRODUCAO'),
  ...base,
  destinoId: idObrigatorio('Escolha o destino.'),
  colaboradorId: idObrigatorio('Escolha o colaborador que devolveu.'),
  motivo: textoObrigatorio('Informe o motivo.', 300),
})

export const schemaConsumo = z.object({
  tipo: z.literal('CONSUMO_PRODUCAO'),
  ...base,
  destinoId: idObrigatorio('Escolha o destino.'),
  ordemProducao: textoObrigatorio('Informe a ordem de produção.', 30),
  colaboradorId: idObrigatorio('Escolha o colaborador que retirou.'),
})

export const schemaPerda = z.object({
  tipo: z.literal('PERDA_QUEBRA'),
  ...base,
  motivo: textoObrigatorio('Informe o motivo.', 300),
})

export const schemaMovimentacao = z.discriminatedUnion(
  'tipo',
  [schemaCompra, schemaDevolucao, schemaConsumo, schemaPerda],
  { error: 'Escolha o tipo de movimentação.' },
)
export type DadosMovimentacao = z.output<typeof schemaMovimentacao>

export const schemaEstorno = z.object({
  movimentacaoId: idObrigatorio('Escolha a movimentação.'),
  justificativa: textoObrigatorio('Informe a justificativa do estorno.', 500).refine(
    (t) => t.length >= 5,
    {
      error: 'Informe a justificativa do estorno.',
    },
  ),
})

export const schemaInventario = z.object({
  itemId: idObrigatorio('Escolha o item.'),
  contado: inteiroNaoNegativo('A quantidade contada precisa ser um inteiro maior ou igual a zero.'),
  justificativa: textoObrigatorio('Informe a justificativa.', 500),
})

export function validarMovimentacao(dados: unknown) {
  return validar(schemaMovimentacao, dados)
}
