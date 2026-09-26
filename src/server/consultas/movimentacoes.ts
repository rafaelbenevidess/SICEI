import 'server-only'
import { TIPOS_MOVIMENTACAO } from '@/domain/tipos'
import type { Prisma } from '@/generated/prisma/client'
import { fimDoDia, inicioDoDia } from '@/lib/formatar'
import { prisma } from '../db'
import { ehUuid } from '../erros'

export interface FiltroMovimentacoes {
  de?: string
  ate?: string
  item?: string
  tipo?: string
  usuario?: string
  destino?: string
  colaborador?: string
  op?: string
}

export const POR_PAGINA = 50

export function filtroParaWhere(f: FiltroMovimentacoes): Prisma.MovimentacaoWhereInput {
  const where: Prisma.MovimentacaoWhereInput = {}
  const de = f.de ? inicioDoDia(f.de) : null
  const ate = f.ate ? fimDoDia(f.ate) : null
  if (de || ate) where.criadoEm = { ...(de ? { gte: de } : {}), ...(ate ? { lte: ate } : {}) }
  if (f.item?.trim()) where.item = { codigo: { contains: f.item.trim(), mode: 'insensitive' } }
  if (f.tipo && (TIPOS_MOVIMENTACAO as readonly string[]).includes(f.tipo))
    where.tipo = f.tipo as Prisma.MovimentacaoWhereInput['tipo']
  if (f.usuario?.trim()) where.usuario = { login: { contains: f.usuario.trim().toLowerCase() } }
  if (f.destino && ehUuid(f.destino)) where.destinoId = f.destino
  if (f.colaborador && ehUuid(f.colaborador)) where.colaboradorId = f.colaborador
  if (f.op?.trim()) where.ordemProducao = { contains: f.op.trim(), mode: 'insensitive' }
  return where
}

/** RF-15: histórico com filtros e paginação no servidor. */
export async function listarMovimentacoes(f: FiltroMovimentacoes, pagina = 1) {
  const where = filtroParaWhere(f)
  const [total, linhas] = await Promise.all([
    prisma.movimentacao.count({ where }),
    prisma.movimentacao.findMany({
      where,
      include: {
        item: { select: { id: true, codigo: true, descricao: true } },
        usuario: { select: { login: true } },
        destino: { select: { nome: true } },
        colaborador: { select: { nome: true } },
        fornecedor: { select: { razaoSocial: true, nomeFantasia: true } },
        estornadaPor: { select: { id: true } },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (Math.max(1, pagina) - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ])
  return { total, linhas, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) }
}

export async function detalheMovimentacao(id: string) {
  if (!ehUuid(id)) return null
  return prisma.movimentacao.findUnique({
    where: { id },
    include: {
      item: true,
      usuario: { select: { login: true, nome: true, sobrenome: true } },
      destino: true,
      colaborador: true,
      fornecedor: true,
      estorna: { select: { id: true, tipo: true, criadoEm: true } },
      estornadaPor: {
        select: { id: true, criadoEm: true, motivo: true, usuario: { select: { login: true } } },
      },
    },
  })
}

export async function opcoesDeFiltro() {
  const [destinos, colaboradores] = await Promise.all([
    prisma.destino.findMany({ orderBy: { nome: 'asc' } }),
    prisma.colaborador.findMany({ orderBy: { nome: 'asc' } }),
  ])
  return {
    destinos: destinos.map((d) => ({ valor: d.id, rotulo: d.nome })),
    colaboradores: colaboradores.map((c) => ({ valor: c.id, rotulo: c.nome })),
  }
}
