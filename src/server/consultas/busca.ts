import 'server-only'
import { buscarItens, buscarOpcoes, normalizarBusca } from '@/domain/busca'
import { prisma } from '../db'

/*
 * RF-11 nos filtros de texto: em vez de "contém" no banco, que exige o texto exato, os
 * candidatos passam pela regra tolerante do domínio e o filtro usa os ids encontrados.
 * "pst1" acha PST-001, "joao silva" acha joao.silva e "20260457" acha a OP 2026-0457.
 */

/** Ids dos itens (ativos ou não) que a busca tolerante acha. */
export async function idsDeItensParecidos(termo: string): Promise<string[]> {
  const itens = await prisma.item.findMany({
    select: {
      id: true,
      codigo: true,
      descricao: true,
      iso: true,
      classe: true,
      posicao: { select: { codigo: true } },
    },
  })
  return buscarItens(
    termo,
    itens.map((i) => ({ ...i, posicao: i.posicao?.codigo ?? null })),
  ).map((i) => i.id)
}

/** Ids dos colaboradores achados pelo nome ou pela matrícula. */
export async function idsDeColaboradoresParecidos(termo: string): Promise<string[]> {
  const colaboradores = await prisma.colaborador.findMany({
    select: { id: true, nome: true, matricula: true },
  })
  return buscarOpcoes(
    termo,
    colaboradores.map((c) => ({ valor: c.id, rotulo: c.nome, busca: [c.matricula ?? ''] })),
  ).map((o) => o.valor)
}

/** Ids dos usuários achados pelo login ou pelo nome ("joao silva", "João" acham joao.silva). */
export async function idsDeUsuariosParecidos(termo: string): Promise<string[]> {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, login: true, nome: true, sobrenome: true },
  })
  return buscarOpcoes(
    termo,
    usuarios.map((u) => ({
      valor: u.id,
      rotulo: u.login,
      busca: [`${u.nome} ${u.sobrenome}`],
    })),
  ).map((o) => o.valor)
}

/** Ordens de produção já usadas que contêm o texto, ignorando traços, espaços e maiúsculas. */
export async function opsParecidas(termo: string): Promise<string[]> {
  const t = normalizarBusca(termo)
  if (!t) return []
  const ops = await prisma.movimentacao.findMany({
    where: { ordemProducao: { not: null } },
    distinct: ['ordemProducao'],
    select: { ordemProducao: true },
  })
  return ops.map((o) => o.ordemProducao!).filter((op) => normalizarBusca(op).includes(t))
}
