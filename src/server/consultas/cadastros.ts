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

export const itemDaPosicao = (codigo: string) =>
  prisma.posicao.findUnique({ where: { codigo }, select: { itemId: true } })

/** Todas as posições ativas com item, para a folha de etiquetas (RF-22). */
export const posicoesOcupadas = () =>
  prisma.posicao.findMany({
    where: { itemId: { not: null }, ativo: true },
    include: { item: { select: { codigo: true, descricao: true, iso: true, classe: true } } },
    orderBy: { codigo: 'asc' },
    take: 500,
  })

/** RF-03: itens na aba de cadastros, inclusive os inativos (RN-02). */
export const listarItensDoCadastro = () =>
  prisma.item.findMany({
    orderBy: { codigo: 'asc' },
    select: {
      id: true,
      codigo: true,
      descricao: true,
      iso: true,
      classe: true,
      ativo: true,
      saldo: true,
      status: true,
      fabricante: { select: { nome: true } },
      posicao: { select: { codigo: true } },
      _count: { select: { fornecedores: true } },
    },
    take: 1000,
  })
