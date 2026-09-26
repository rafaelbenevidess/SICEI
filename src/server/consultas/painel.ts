import 'server-only'
import { prisma } from '../db'

/** RF-16: painel geral. */
export async function resumoDoPainel() {
  const agora = new Date()
  const inicioMes = new Date(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
    }).format(agora) + '-01T00:00:00-03:00',
  )
  const inicioMesAnterior = new Date(inicioMes)
  inicioMesAnterior.setUTCMonth(inicioMesAnterior.getUTCMonth() - 1)

  const [porStatus, alertas, consumoMes, consumoMesAnterior, top, ultimas] = await Promise.all([
    prisma.item.groupBy({ by: ['status'], where: { ativo: true }, _count: { _all: true } }),
    prisma.alerta.findMany({
      where: { fechadoEm: null, item: { ativo: true } },
      include: { item: { include: { posicao: true } } },
      orderBy: [{ nivel: 'desc' }, { abertoEm: 'asc' }],
      take: 10,
    }),
    consumoNoPeriodo(inicioMes, agora),
    consumoNoPeriodo(inicioMesAnterior, inicioMes),
    prisma.$queryRaw<{ id: string; codigo: string; descricao: string; total: bigint }[]>`
      SELECT i.id, i.codigo, i.descricao, SUM(m.quantidade)::bigint AS total
        FROM movimentacao m JOIN item i ON i.id = m.item_id
       WHERE m.tipo = 'CONSUMO_PRODUCAO' AND m.criado_em >= ${inicioMes}
         AND NOT EXISTS (SELECT 1 FROM movimentacao e WHERE e.estorna_id = m.id)
       GROUP BY i.id, i.codigo, i.descricao
       ORDER BY total DESC
       LIMIT 10`,
    prisma.movimentacao.findMany({
      include: {
        item: { select: { id: true, codigo: true } },
        usuario: { select: { login: true } },
      },
      orderBy: { criadoEm: 'desc' },
      take: 8,
    }),
  ])
  const contagem = Object.fromEntries(porStatus.map((s) => [s.status, s._count._all])) as Record<
    string,
    number
  >
  return {
    contagem: {
      OK: contagem.OK ?? 0,
      ATENCAO: contagem.ATENCAO ?? 0,
      CRITICO: contagem.CRITICO ?? 0,
      ZERADO: contagem.ZERADO ?? 0,
    },
    alertas,
    consumoMes,
    consumoMesAnterior,
    top: top.map((t) => ({ ...t, total: Number(t.total) })),
    ultimas,
  }
}

async function consumoNoPeriodo(de: Date, ate: Date): Promise<number> {
  const [r] = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT COALESCE(SUM(m.quantidade), 0)::bigint AS total FROM movimentacao m
     WHERE m.tipo = 'CONSUMO_PRODUCAO' AND m.criado_em >= ${de} AND m.criado_em < ${ate}
       AND NOT EXISTS (SELECT 1 FROM movimentacao e WHERE e.estorna_id = m.id)`
  return Number(r.total)
}
