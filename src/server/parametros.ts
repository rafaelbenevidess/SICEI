import 'server-only'
import { JANELA_CONSUMO_PADRAO } from '@/domain/estoque'
import { prisma, type Tx } from './db'

/** Parâmetros do sistema (RF-26) e seus valores padrão. */
export const PADROES = {
  janela_consumo_dias: String(JANELA_CONSUMO_PADRAO),
  sessao_inatividade_minutos: '30',
  email_avisos: '',
} as const

export type ChaveParametro = keyof typeof PADROES

export interface Parametros {
  janelaConsumoDias: number
  sessaoInatividadeMinutos: number
  emailAvisos: string
}

export async function lerParametros(tx: Tx | typeof prisma = prisma): Promise<Parametros> {
  const linhas = await tx.parametro.findMany()
  const valor = (chave: ChaveParametro) =>
    linhas.find((l) => l.chave === chave)?.valor ?? PADROES[chave]
  return {
    janelaConsumoDias: Number(valor('janela_consumo_dias')),
    sessaoInatividadeMinutos: Number(valor('sessao_inatividade_minutos')),
    emailAvisos: valor('email_avisos'),
  }
}
