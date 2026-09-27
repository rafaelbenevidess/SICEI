/**
 * Importação inicial da planilha atual (RF-25): valida cada linha do CSV antes de gravar.
 */
import { z } from 'zod'
import { cnpjValido, limparCnpj } from './cnpj'
import { chaveDeSequencia } from './busca'
import { interpretarCodigoDePosicao, lerCodigoDaPosicao } from './posicao'
import { APLICACOES } from './schemas/cadastros'
import {
  errosPorCampo,
  inteiroNaoNegativo,
  inteiroOpcional,
  inteiroPositivo,
  textoObrigatorio,
  textoOpcional,
} from './schemas/comum'

export const COLUNAS_IMPORTACAO = [
  'codigo',
  'descricao',
  'iso',
  'classe',
  'cobertura',
  'aplicacao',
  'fabricante',
  'embalagem',
  'estoque_minimo',
  'estoque_maximo',
  'fornecedor_cnpj',
  'lead_time_dias',
  'posicao',
  'saldo_inicial',
] as const

export const schemaLinhaImportacao = z
  .object({
    codigo: textoObrigatorio('Informe o código.', 40),
    descricao: textoObrigatorio('Informe a descrição.', 200),
    iso: textoOpcional(40),
    classe: textoOpcional(40),
    cobertura: textoOpcional(60),
    aplicacao: z.preprocess(
      (v) => (typeof v === 'string' ? v.trim().toUpperCase().replace('FURAÇÃO', 'FURACAO') : v),
      z.enum(APLICACOES, { error: `Aplicação deve ser uma de: ${APLICACOES.join(', ')}.` }),
    ),
    fabricante: textoObrigatorio('Informe o fabricante.', 100),
    embalagem: inteiroPositivo('Embalagem precisa ser um inteiro maior que zero.'),
    estoque_minimo: inteiroNaoNegativo('Estoque mínimo precisa ser um inteiro (0 ou mais).'),
    estoque_maximo: inteiroOpcional('Estoque máximo precisa ser um inteiro.'),
    fornecedor_cnpj: textoObrigatorio('Informe o CNPJ do fornecedor.', 18)
      .refine(cnpjValido, { error: 'CNPJ do fornecedor inválido.' })
      .transform(limparCnpj),
    lead_time_dias: inteiroOpcional('Lead time precisa ser um número inteiro de dias.'),
    // RN-25: "a1g3c4" e "A1-G3-C4" entram como A01-G03-C04
    posicao: textoOpcional(20)
      .transform((p) => (p === undefined ? p : (interpretarCodigoDePosicao(p) ?? p)))
      .refine((p) => p === undefined || lerCodigoDaPosicao(p) !== null, {
        error: 'Posição deve estar no formato A01-G03-C04.',
      }),
    saldo_inicial: inteiroNaoNegativo('Saldo inicial precisa ser um inteiro (0 ou mais).'),
  })
  .refine((l) => l.estoque_maximo === undefined || l.estoque_maximo > l.estoque_minimo, {
    error: 'O estoque máximo precisa ser maior que o mínimo.',
    path: ['estoque_maximo'],
  })

export type LinhaImportacao = z.output<typeof schemaLinhaImportacao>

export type ResultadoLinha =
  | { linha: number; ok: true; dados: LinhaImportacao }
  | { linha: number; ok: false; erros: string[] }

/** Valida as linhas (a numeração considera o cabeçalho como linha 1). Também acusa código repetido no arquivo. */
export function validarLinhasImportacao(linhas: Record<string, unknown>[]): ResultadoLinha[] {
  const vistos = new Map<string, number>()
  const posicoes = new Map<string, number>()
  return linhas.map((bruta, i) => {
    const linha = i + 2
    const r = schemaLinhaImportacao.safeParse(bruta)
    if (!r.success) {
      return {
        linha,
        ok: false,
        erros: Object.entries(errosPorCampo(r.error)).map(([c, m]) => `${c}: ${m}`),
      }
    }
    // RN-01: "PST1" e "PST-001" são o mesmo código, então contam como repetidos
    const codigo = chaveDeSequencia(r.data.codigo) || r.data.codigo.toUpperCase()
    const anterior = vistos.get(codigo)
    if (anterior)
      return { linha, ok: false, erros: [`codigo: repetido (já aparece na linha ${anterior}).`] }
    const posicao = r.data.posicao?.toUpperCase()
    const donaDaPosicao = posicao ? posicoes.get(posicao) : undefined
    if (donaDaPosicao) {
      return {
        linha,
        ok: false,
        erros: [
          `posicao: repetida (já usada na linha ${donaDaPosicao}); um item por compartimento (RN-25).`,
        ],
      }
    }
    vistos.set(codigo, linha)
    if (posicao) posicoes.set(posicao, linha)
    return { linha, ok: true, dados: r.data }
  })
}

/** Confere se o cabeçalho tem todas as colunas do modelo. */
export function colunasFaltando(cabecalho: string[]): string[] {
  const presentes = new Set(cabecalho.map((c) => c.trim().toLowerCase()))
  return COLUNAS_IMPORTACAO.filter((c) => !presentes.has(c))
}

/** Colunas que a prévia mostra de cada linha, válida ou não (RF-25). */
export interface ResumoDaLinha {
  codigo: string
  isoClasse: string
  fornecedor: string
  posicao: string
  minimo: string
  saldo: string
}

export type LinhaDaPrevia = ResultadoLinha & { resumo: ResumoDaLinha }

function celula(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v === undefined || v === null ? '' : String(v)
}

/** Resumo de uma linha crua do CSV; o nome do fornecedor, quando encontrado, troca o CNPJ. */
export function resumoDaLinha(bruta: Record<string, unknown>, fornecedor?: string): ResumoDaLinha {
  const iso = celula(bruta.iso)
  const classe = celula(bruta.classe)
  return {
    codigo: celula(bruta.codigo),
    isoClasse: [iso, classe].filter(Boolean).join(' · '),
    fornecedor: fornecedor ?? celula(bruta.fornecedor_cnpj),
    posicao:
      interpretarCodigoDePosicao(celula(bruta.posicao)) ?? celula(bruta.posicao).toUpperCase(),
    minimo: celula(bruta.estoque_minimo),
    saldo: celula(bruta.saldo_inicial),
  }
}
