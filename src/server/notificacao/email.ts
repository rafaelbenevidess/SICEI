import 'server-only'
import nodemailer from 'nodemailer'
import { prisma } from '../db'

const LIMITE_TENTATIVAS = 5

function transporte() {
  const porta = Number(process.env.SMTP_PORT ?? 587)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    secure: porta === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
}

/**
 * Envia os avisos pendentes da outbox (RN-19, RF-14). Uma falha de envio nunca desfaz a
 * movimentação: fica registrada e a rotina diária tenta de novo.
 */
export async function enviarNotificacoesPendentes(): Promise<{ enviadas: number; falhas: number }> {
  if (!process.env.SMTP_HOST) return { enviadas: 0, falhas: 0 }
  const pendentes = await prisma.notificacao.findMany({
    where: { status: { in: ['PENDENTE', 'FALHOU'] }, tentativas: { lt: LIMITE_TENTATIVAS } },
    include: { alerta: { include: { item: { include: { posicao: true } } } } },
    take: 50,
  })
  let enviadas = 0
  let falhas = 0
  const t = transporte()
  const base = process.env.APP_URL ?? ''
  for (const n of pendentes) {
    // reserva atômica: se outra execução (outra movimentação ou a rotina diária) pegou
    // esta notificação primeiro, o contador de tentativas já mudou e esta pula
    const reservada = await prisma.notificacao.updateMany({
      where: { id: n.id, tentativas: n.tentativas, status: { in: ['PENDENTE', 'FALHOU'] } },
      data: { tentativas: { increment: 1 } },
    })
    if (reservada.count === 0) continue
    const item = n.alerta.item
    try {
      await t.sendMail({
        from: process.env.SMTP_FROM,
        to: n.destinatario,
        subject: `[SIMI] ${item.codigo} está ${n.nivel === 'ZERADO' ? 'ZERADO' : 'CRÍTICO'}`,
        text: [
          `Item: ${item.codigo} - ${item.descricao}`,
          `Situação: ${n.nivel}`,
          `Saldo atual: ${item.saldo} unidades`,
          `Estoque mínimo: ${item.estoqueMinimo}`,
          `Posição: ${item.posicao?.codigo ?? 'sem posição'}`,
          '',
          `Abrir no SIMI: ${base}/itens/${item.id}`,
        ].join('\n'),
      })
      await prisma.notificacao.update({
        where: { id: n.id },
        data: {
          status: 'ENVIADO',
          enviadoEm: new Date(),
          erro: null,
        },
      })
      enviadas++
    } catch (e) {
      await prisma.notificacao.update({
        where: { id: n.id },
        data: {
          status: 'FALHOU',
          erro: (e as Error).message.slice(0, 500),
        },
      })
      falhas++
    }
  }
  return { enviadas, falhas }
}
