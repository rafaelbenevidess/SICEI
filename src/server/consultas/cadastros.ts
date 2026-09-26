import 'server-only'
import { prisma } from '../db'

export const listarFabricantes = () =>
  prisma.fabricante.findMany({
    orderBy: { nome: 'asc' },
    include: { _count: { select: { itens: true } } },
  })
export const listarFornecedores = () =>
  prisma.fornecedor.findMany({
    orderBy: { razaoSocial: 'asc' },
    include: { _count: { select: { itens: true } } },
  })
export const listarDestinos = () =>
  prisma.destino.findMany({ orderBy: [{ tipo: 'asc' }, { nome: 'asc' }] })
export const listarColaboradores = () => prisma.colaborador.findMany({ orderBy: { nome: 'asc' } })
export const listarPosicoes = () =>
  prisma.posicao.findMany({
    orderBy: [{ armario: 'asc' }, { gaveta: 'asc' }, { compartimento: 'asc' }],
    include: { item: { select: { id: true, codigo: true, descricao: true } } },
  })
export const listarUsuarios = () =>
  prisma.usuario.findMany({ orderBy: [{ ativo: 'desc' }, { nome: 'asc' }] })

export const etiquetasDasPosicoes = (codigos: string[]) =>
  prisma.posicao.findMany({
    where: { codigo: { in: codigos }, itemId: { not: null } },
    include: { item: { select: { codigo: true, descricao: true } } },
    orderBy: { codigo: 'asc' },
  })

export const itemDaPosicao = (codigo: string) =>
  prisma.posicao.findUnique({ where: { codigo }, select: { itemId: true } })
