/** Schemas dos cadastros (doc 01, seção 5.1; doc 02, RF-02 a RF-06, RF-12, RF-26 a RF-28). */
import { z } from 'zod'
import { cnpjValido, limparCnpj } from '../cnpj'
import { PERFIS } from '../tipos'
import {
  idObrigatorio,
  inteiroNaoNegativo,
  inteiroOpcional,
  inteiroPositivo,
  textoObrigatorio,
  textoOpcional,
} from './comum'

export const schemaFabricante = z.object({
  nome: textoObrigatorio('Informe o nome do fabricante.', 100),
})

export const schemaFornecedor = z.object({
  razaoSocial: textoObrigatorio('Informe a razão social.', 150),
  nomeFantasia: textoOpcional(150),
  cnpj: textoObrigatorio('Informe o CNPJ.', 18)
    .refine(cnpjValido, { error: 'CNPJ inválido.' })
    .transform(limparCnpj),
  telefone: textoOpcional(30),
  contato: textoOpcional(100),
})

export const schemaDestino = z.object({
  tipo: z.enum(['SETOR', 'MAQUINA', 'CENTRO_CUSTO'], { error: 'Escolha o tipo de destino.' }),
  codigo: textoObrigatorio('Informe o código.', 30),
  nome: textoObrigatorio('Informe o nome.', 100),
})

export const schemaColaborador = z.object({
  nome: textoObrigatorio('Informe o nome do colaborador.', 120),
  matricula: textoOpcional(30),
  setor: textoObrigatorio('Informe o setor.', 80),
})

export const schemaPosicao = z.object({
  armario: inteiroPositivo('Informe o armário (1 a 99).').refine((n) => n <= 99, {
    error: 'Informe o armário (1 a 99).',
  }),
  gaveta: inteiroPositivo('Informe a gaveta (1 a 99).').refine((n) => n <= 99, {
    error: 'Informe a gaveta (1 a 99).',
  }),
  compartimento: inteiroPositivo('Informe o compartimento (1 a 99).').refine((n) => n <= 99, {
    error: 'Informe o compartimento (1 a 99).',
  }),
})

export const APLICACOES = ['TORNEAMENTO', 'FRESAMENTO', 'FURACAO', 'ROSQUEAMENTO', 'OUTRA'] as const

export const schemaItem = z
  .object({
    codigo: textoObrigatorio('Informe o código interno.', 40),
    descricao: textoObrigatorio('Informe a descrição.', 200),
    iso: textoOpcional(40),
    classe: textoOpcional(40),
    cobertura: textoOpcional(60),
    aplicacao: z.enum(APLICACOES, { error: 'Escolha a aplicação.' }),
    fabricanteId: idObrigatorio('Escolha o fabricante.'),
    embalagem: inteiroPositivo('A embalagem precisa ter pelo menos 1 unidade.'),
    estoqueMinimo: inteiroNaoNegativo('Informe o estoque mínimo (0 ou mais).'),
    estoqueMaximo: inteiroOpcional('O estoque máximo precisa ser um inteiro.'),
  })
  .refine((i) => i.estoqueMaximo === undefined || i.estoqueMaximo > i.estoqueMinimo, {
    error: 'O estoque máximo precisa ser maior que o mínimo.',
    path: ['estoqueMaximo'],
  })

export const schemaVinculoFornecedor = z.object({
  itemId: idObrigatorio('Escolha o item.'),
  fornecedorId: idObrigatorio('Escolha o fornecedor.'),
  codigoNoFornecedor: textoOpcional(60),
  leadTimeDias: inteiroOpcional('O lead time precisa ser um número inteiro de dias.'),
  preferencial: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
})

/** Cadastro rápido na tela de entrada: fornecedor novo já vinculado ao item (RF-05, RF-07). */
export const schemaFornecedorRapido = z.object({
  itemId: idObrigatorio('Escolha o item.'),
  razaoSocial: textoObrigatorio('Informe a razão social.', 150),
  cnpj: textoObrigatorio('Informe o CNPJ.', 18)
    .refine(cnpjValido, { error: 'CNPJ inválido.' })
    .transform(limparCnpj),
  codigoNoFornecedor: textoOpcional(60),
  leadTimeDias: inteiroOpcional('O lead time precisa ser um número inteiro de dias.'),
})

export const schemaLimites = z
  .object({
    itemId: idObrigatorio('Escolha o item.'),
    estoqueMinimo: inteiroNaoNegativo('Informe o estoque mínimo (0 ou mais).'),
    estoqueMaximo: inteiroOpcional('O estoque máximo precisa ser um inteiro.'),
  })
  .refine((i) => i.estoqueMaximo === undefined || i.estoqueMaximo > i.estoqueMinimo, {
    error: 'O estoque máximo precisa ser maior que o mínimo.',
    path: ['estoqueMaximo'],
  })

export const schemaNovoUsuario = z.object({
  nome: textoObrigatorio('Informe o nome.', 60),
  sobrenome: textoObrigatorio('Informe o sobrenome.', 80),
  setor: textoObrigatorio('Informe o setor.', 80),
  perfil: z.enum(PERFIS, { error: 'Escolha o perfil.' }),
})

export const schemaLogin = z.object({
  login: textoObrigatorio('Informe o login.', 80),
  senha: z.string({ error: 'Informe a senha.' }).min(1, { error: 'Informe a senha.' }).max(128),
})

export const schemaTrocaSenha = z
  .object({
    senhaAtual: z
      .string({ error: 'Informe a senha atual.' })
      .min(1, { error: 'Informe a senha atual.' })
      .max(128),
    novaSenha: z
      .string({ error: 'Informe a nova senha.' })
      .min(1, { error: 'Informe a nova senha.' })
      .max(128),
    confirmacao: z.string({ error: 'Repita a nova senha.' }),
  })
  .refine((d) => d.novaSenha === d.confirmacao, {
    error: 'As senhas não conferem.',
    path: ['confirmacao'],
  })

export const schemaParametros = z.object({
  janelaConsumoDias: inteiroPositivo('A janela precisa ser um número inteiro de dias.').refine(
    (n) => n <= 365,
    {
      error: 'Use no máximo 365 dias.',
    },
  ),
  sessaoInatividadeMinutos: inteiroPositivo('Informe os minutos de inatividade.').refine(
    (n) => n >= 5 && n <= 480,
    {
      error: 'Use entre 5 e 480 minutos.',
    },
  ),
  emailAvisos: textoOpcional(200).refine((v) => v === undefined || z.email().safeParse(v).success, {
    error: 'E-mail inválido.',
  }),
})
