import 'server-only'
import { exigirPermissao } from '@/domain/permissoes'
import { validar } from '@/domain/schemas/comum'
import { schemaParametros } from '@/domain/schemas/cadastros'
import { registrarAuditoria } from '../audit/registrar'
import type { Ator } from '../contexto'
import { prisma } from '../db'
import { ErroDeNegocio } from '../erros'
import { recalcularItem } from '../estoque'
import { lerParametros } from '../parametros'

/** RF-26: mudar a janela de consumo recalcula todos os itens ativos. */
export async function atualizarParametros(ator: Ator, entrada: unknown): Promise<void> {
  exigirPermissao(ator.perfil, 'parametros:gerenciar')
  const v = validar(schemaParametros, entrada)
  if (!v.ok) throw new ErroDeNegocio('Confira os campos destacados.', v.erros)
  const antes = await lerParametros()
  const novos = {
    janela_consumo_dias: String(v.dados.janelaConsumoDias),
    sessao_inatividade_minutos: String(v.dados.sessaoInatividadeMinutos),
    email_avisos: v.dados.emailAvisos ?? '',
  }
  await prisma.$transaction(async (tx) => {
    for (const [chave, valor] of Object.entries(novos)) {
      await tx.parametro.upsert({ where: { chave }, create: { chave, valor }, update: { valor } })
    }
    await registrarAuditoria(tx, {
      acao: 'PARAMETROS_ALTERADOS',
      entidade: 'parametro',
      antes,
      depois: { ...v.dados, emailAvisos: v.dados.emailAvisos ?? '' },
      usuarioId: ator.usuarioId,
      ip: ator.ip,
      userAgent: ator.userAgent,
    })
  })
  if (antes.janelaConsumoDias !== v.dados.janelaConsumoDias) await recalcularTodos()
}

/** Recalcula todos os itens ativos, um por transação (usado pela rotina diária e pelos parâmetros). */
export async function recalcularTodos(): Promise<{ itens: number; notificacoes: string[] }> {
  const itens = await prisma.item.findMany({ where: { ativo: true }, select: { id: true } })
  const notificacoes: string[] = []
  for (const { id } of itens) {
    const r = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM item WHERE id = ${id}::uuid FOR UPDATE`
      return recalcularItem(tx, id)
    })
    notificacoes.push(...r.notificacoes)
  }
  return { itens: itens.length, notificacoes }
}
