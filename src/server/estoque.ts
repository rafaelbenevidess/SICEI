import 'server-only'
import { decidirAlerta, type NivelAlerta } from '@/domain/alertas'
import {
  consumoMedioDiario,
  leadTimeParaCalculo,
  pontoDeReposicao,
  statusDoItem,
} from '@/domain/estoque'
import type { StatusItem } from '@/domain/tipos'
import type { Tx } from './db'
import { lerParametros } from './parametros'

/** RN-16: soma do consumo da produção na janela, sem as saídas estornadas. */
export async function totalConsumidoNaJanela(
  tx: Tx,
  itemId: string,
  janelaDias: number,
): Promise<number> {
  const [linha] = await tx.$queryRaw<{ total: bigint }[]>`
    SELECT COALESCE(SUM(m.quantidade), 0)::bigint AS total
      FROM movimentacao m
     WHERE m.item_id = ${itemId}::uuid
       AND m.tipo = 'CONSUMO_PRODUCAO'
       AND m.criado_em >= now() - make_interval(days => ${janelaDias}::int)
       AND NOT EXISTS (SELECT 1 FROM movimentacao e WHERE e.estorna_id = m.id)`
  return Number(linha.total)
}

export interface ResultadoRecalculo {
  status: StatusItem
  pontoReposicao: number
  consumoDiario: number
  notificacoes: string[]
}

/**
 * Recalcula consumo médio, ponto de reposição e status do item (RN-15 a RN-17)
 * e abre, escala, atualiza ou fecha o alerta (RN-18). Roda dentro da transação
 * da movimentação, ou na rotina diária.
 */
export async function recalcularItem(tx: Tx, itemId: string): Promise<ResultadoRecalculo> {
  const item = await tx.item.findUniqueOrThrow({
    where: { id: itemId },
    include: { fornecedores: true },
  })
  const parametros = await lerParametros(tx)
  const total = await totalConsumidoNaJanela(tx, itemId, parametros.janelaConsumoDias)
  const consumoDiario = consumoMedioDiario({
    totalConsumido: total,
    janelaDias: parametros.janelaConsumoDias,
  })
  const leadTime = leadTimeParaCalculo(
    item.fornecedores.map((f) => ({
      preferencial: f.preferencial,
      ultimoPreco: f.ultimoPreco === null ? null : Number(f.ultimoPreco),
      leadTimeDias: f.leadTimeDias,
    })),
  )
  const ponto = pontoDeReposicao({ minimo: item.estoqueMinimo, consumoDiario, leadTime })
  const status = statusDoItem({
    saldo: item.saldo,
    minimo: item.estoqueMinimo,
    pontoReposicao: ponto,
  })

  if (ponto !== item.pontoReposicao || status !== item.status) {
    await tx.item.update({ where: { id: itemId }, data: { pontoReposicao: ponto, status } })
  }

  const aberto = await tx.alerta.findFirst({ where: { itemId, fechadoEm: null } })
  const notificacoes: string[] = []

  // RN-03: item inativo não gera alerta
  if (!item.ativo) {
    if (aberto)
      await tx.alerta.update({ where: { id: aberto.id }, data: { fechadoEm: new Date() } })
    return { status, pontoReposicao: ponto, consumoDiario, notificacoes }
  }

  const acao = decidirAlerta({
    nivelAberto: (aberto?.nivel as NivelAlerta | undefined) ?? null,
    novoStatus: status,
  })
  const agora = new Date()
  let alertaId = aberto?.id ?? null
  switch (acao.acao) {
    case 'ABRIR': {
      const novo = await tx.alerta.create({ data: { itemId, nivel: acao.nivel } })
      alertaId = novo.id
      break
    }
    case 'ESCALAR':
    case 'ATUALIZAR':
      await tx.alerta.update({
        where: { id: aberto!.id },
        data: { nivel: acao.nivel, atualizadoEm: agora },
      })
      break
    case 'FECHAR':
      await tx.alerta.update({
        where: { id: aberto!.id },
        data: { fechadoEm: agora, atualizadoEm: agora },
      })
      break
    case 'NENHUMA':
      break
  }

  // RN-19 / RF-14: aviso por e-mail vai para a outbox (enviado depois do commit)
  if (
    (acao.acao === 'ABRIR' || acao.acao === 'ESCALAR') &&
    acao.enviarEmail &&
    parametros.emailAvisos &&
    alertaId
  ) {
    const n = await tx.notificacao.create({
      data: { alertaId, nivel: acao.nivel, destinatario: parametros.emailAvisos },
    })
    notificacoes.push(n.id)
  }

  return { status, pontoReposicao: ponto, consumoDiario, notificacoes }
}
