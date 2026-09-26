import { beforeAll, describe, expect, it } from 'vitest'
import type { Ator } from '@/server/contexto'
import { prisma } from '@/server/db'
import { ErroDeNegocio } from '@/server/erros'
import {
  estornarMovimentacao,
  registrarInventario,
  registrarMovimentacao,
} from '@/server/services/movimentacoes'
import { ErroDePermissao } from '@/domain/permissoes'
import { cenario, criarAtor } from './apoio'

let admin: Ator
let almoxarife: Ator
let consulta: Ator

beforeAll(async () => {
  admin = await criarAtor('ADMIN')
  almoxarife = await criarAtor('ALMOXARIFE')
  consulta = await criarAtor('CONSULTA')
})

async function compra(
  ator: Ator,
  c: Awaited<ReturnType<typeof cenario>>,
  quantidade: number,
  preco = 38.9,
) {
  return registrarMovimentacao(ator, {
    tipo: 'COMPRA',
    itemId: c.item.id,
    quantidade,
    fornecedorId: c.fornecedor.id,
    precoUnitario: preco,
    notaFiscal: 'NF-1',
  })
}

function consumo(ator: Ator, c: Awaited<ReturnType<typeof cenario>>, quantidade: number) {
  return registrarMovimentacao(ator, {
    tipo: 'CONSUMO_PRODUCAO',
    itemId: c.item.id,
    quantidade,
    destinoId: c.destino.id,
    ordemProducao: 'OP-2026-0457',
    colaboradorId: c.colaborador.id,
  })
}

describe('RF-07 / RF-08 · Entrada e saída no banco real', () => {
  it('compra em caixas vira unidades, grava o preço e atualiza o saldo', async () => {
    const c = await cenario(admin)
    await registrarMovimentacao(almoxarife, {
      tipo: 'COMPRA',
      itemId: c.item.id,
      quantidade: 3,
      unidade: 'CAIXA',
      fornecedorId: c.fornecedor.id,
      precoUnitario: '38,90',
      notaFiscal: '12345',
    })
    const item = await prisma.item.findUniqueOrThrow({ where: { id: c.item.id } })
    expect(item.saldo).toBe(30)
    const vinculo = await prisma.itemFornecedor.findFirstOrThrow({ where: { itemId: c.item.id } })
    expect(Number(vinculo.ultimoPreco)).toBe(38.9)
    const mov = await prisma.movimentacao.findFirstOrThrow({ where: { itemId: c.item.id } })
    expect(mov).toMatchObject({
      saldoAnterior: 0,
      saldoPosterior: 30,
      usuarioId: almoxarife.usuarioId,
      ip: '127.0.0.1',
    })
  })

  it('critério do RF-08: saldo 3, saída de 5 é recusada com "Saldo disponível: 3"', async () => {
    const c = await cenario(admin)
    await compra(admin, c, 3)
    await expect(consumo(almoxarife, c, 5)).rejects.toThrow('Saldo disponível: 3')
    expect((await prisma.item.findUniqueOrThrow({ where: { id: c.item.id } })).saldo).toBe(3)
  })

  it('RN-08: duas saídas de 4 ao mesmo tempo com saldo 5 → uma passa, a outra é recusada, saldo final 1', async () => {
    const c = await cenario(admin)
    await compra(admin, c, 5)
    const resultados = await Promise.allSettled([
      consumo(almoxarife, c, 4),
      consumo(almoxarife, c, 4),
    ])
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const recusada = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult
    expect(recusada.reason.message).toBe('Saldo disponível: 1')
    expect((await prisma.item.findUniqueOrThrow({ where: { id: c.item.id } })).saldo).toBe(1)
  })

  it('RN-08: 10 saídas simultâneas de 1 com saldo 7 → exatamente 7 passam', async () => {
    const c = await cenario(admin)
    await compra(admin, c, 7)
    const r = await Promise.allSettled(Array.from({ length: 10 }, () => consumo(almoxarife, c, 1)))
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(7)
    expect((await prisma.item.findUniqueOrThrow({ where: { id: c.item.id } })).saldo).toBe(0)
  })

  it('RN-10: compra de fornecedor não vinculado ao item é recusada', async () => {
    const c = await cenario(admin)
    const outro = await cenario(admin)
    await expect(
      registrarMovimentacao(almoxarife, {
        tipo: 'COMPRA',
        itemId: c.item.id,
        quantidade: 1,
        fornecedorId: outro.fornecedor.id,
        precoUnitario: 10,
        notaFiscal: '1',
      }),
    ).rejects.toThrow('Este fornecedor não está vinculado ao item.')
  })

  it('RN-11: colaborador inativo não pode retirar', async () => {
    const c = await cenario(admin)
    await compra(admin, c, 10)
    await prisma.colaborador.update({ where: { id: c.colaborador.id }, data: { ativo: false } })
    await expect(consumo(almoxarife, c, 1)).rejects.toThrow('Colaborador está inativo.')
  })

  it('RN-03: item inativo não recebe movimentação', async () => {
    const c = await cenario(admin)
    await prisma.item.update({ where: { id: c.item.id }, data: { ativo: false } })
    await expect(compra(admin, c, 1)).rejects.toThrow('Item inativo não recebe movimentação.')
  })

  it('perfil Consulta não registra saída (permissão no servidor)', async () => {
    const c = await cenario(admin)
    await expect(consumo(consulta, c, 1)).rejects.toBeInstanceOf(ErroDePermissao)
  })

  it('campos obrigatórios ausentes voltam por campo', async () => {
    const c = await cenario(admin)
    const e = await registrarMovimentacao(almoxarife, {
      tipo: 'CONSUMO_PRODUCAO',
      itemId: c.item.id,
      quantidade: 1,
    }).catch((x) => x)
    expect(e).toBeInstanceOf(ErroDeNegocio)
    expect(Object.keys((e as ErroDeNegocio).erros)).toEqual([
      'destinoId',
      'ordemProducao',
      'colaboradorId',
    ])
  })

  it('id de item inválido responde "Item não encontrado."', async () => {
    await expect(
      registrarMovimentacao(almoxarife, {
        tipo: 'PERDA_QUEBRA',
        itemId: 'nao-e-uuid',
        quantidade: 1,
        motivo: 'Quebrou',
      }),
    ).rejects.toThrow('Item não encontrado.')
  })
})

describe('RF-09 / RN-12 · Estorno no banco real', () => {
  it('critério do RF-09: estorno de saída devolve o saldo e marca a original', async () => {
    const c = await cenario(admin)
    await compra(admin, c, 12)
    const { movimentacao } = await consumo(almoxarife, c, 4)
    const gestor = await criarAtor('GESTOR')
    await estornarMovimentacao(gestor, {
      movimentacaoId: movimentacao.id,
      justificativa: 'Lançado no item errado',
    })
    expect((await prisma.item.findUniqueOrThrow({ where: { id: c.item.id } })).saldo).toBe(12)
    const original = await prisma.movimentacao.findUniqueOrThrow({
      where: { id: movimentacao.id },
      include: { estornadaPor: true },
    })
    expect(original.estornadaPor?.tipo).toBe('ESTORNO')
  })

  it('dois estornos simultâneos da mesma movimentação: só um passa', async () => {
    const c = await cenario(admin)
    await compra(admin, c, 12)
    const { movimentacao } = await consumo(almoxarife, c, 4)
    const r = await Promise.allSettled([
      estornarMovimentacao(admin, {
        movimentacaoId: movimentacao.id,
        justificativa: 'Erro de lançamento',
      }),
      estornarMovimentacao(admin, {
        movimentacaoId: movimentacao.id,
        justificativa: 'Erro de lançamento',
      }),
    ])
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(1)
    expect((r.find((x) => x.status === 'rejected') as PromiseRejectedResult).reason.message).toBe(
      'Esta movimentação já foi estornada.',
    )
    expect((await prisma.item.findUniqueOrThrow({ where: { id: c.item.id } })).saldo).toBe(12)
  })

  it('critério do RF-09: estorno de entrada já consumida é recusado', async () => {
    const c = await cenario(admin)
    const { movimentacao } = await compra(admin, c, 30)
    await consumo(almoxarife, c, 20)
    await expect(
      estornarMovimentacao(admin, {
        movimentacaoId: movimentacao.id,
        justificativa: 'NF em duplicidade',
      }),
    ).rejects.toThrow('Saldo disponível: 10')
  })

  it('RN-05a: estornar a última compra devolve o último preço da compra anterior', async () => {
    const c = await cenario(admin)
    await compra(admin, c, 10, 37.4)
    const { movimentacao } = await compra(admin, c, 10, 38.9)
    await estornarMovimentacao(admin, {
      movimentacaoId: movimentacao.id,
      justificativa: 'Preço lançado errado',
    })
    const v = await prisma.itemFornecedor.findFirstOrThrow({ where: { itemId: c.item.id } })
    expect(Number(v.ultimoPreco)).toBe(37.4)
  })

  it('critério do RF-09: Almoxarife não estorna', async () => {
    const c = await cenario(admin)
    const { movimentacao } = await compra(admin, c, 5)
    await expect(
      estornarMovimentacao(almoxarife, {
        movimentacaoId: movimentacao.id,
        justificativa: 'Tentativa indevida',
      }),
    ).rejects.toBeInstanceOf(ErroDePermissao)
  })
})

describe('RF-10 / RN-13 · Inventário', () => {
  it('contagem maior gera AJUSTE_POSITIVO da diferença', async () => {
    const c = await cenario(admin)
    await compra(admin, c, 25)
    const r = await registrarInventario(admin, {
      itemId: c.item.id,
      contado: 28,
      justificativa: 'Contagem mensal',
    })
    expect(r.ajuste).toMatchObject({ tipo: 'AJUSTE_POSITIVO', quantidade: 3, saldoPosterior: 28 })
  })
  it('contagem igual não lança movimentação, mas registra a conferência no log', async () => {
    const c = await cenario(admin)
    await compra(admin, c, 25)
    const r = await registrarInventario(admin, {
      itemId: c.item.id,
      contado: 25,
      justificativa: 'Contagem mensal',
    })
    expect(r.ajuste).toBeNull()
    expect(
      await prisma.auditLog.count({
        where: { acao: 'INVENTARIO_CONFERIDO', entidadeId: c.item.id },
      }),
    ).toBe(1)
  })
})

describe('RN-17 / RN-18 · Status e alertas no banco real', () => {
  const abertos = (itemId: string) => prisma.alerta.findMany({ where: { itemId, fechadoEm: null } })

  it('item novo, com saldo 0, nasce ZERADO e com alerta aberto', async () => {
    const c = await cenario(admin)
    expect((await prisma.item.findUniqueOrThrow({ where: { id: c.item.id } })).status).toBe(
      'ZERADO',
    )
    expect(await abertos(c.item.id)).toMatchObject([{ nivel: 'ZERADO' }])
  })

  it('abre, escala e fecha um único alerta por item', async () => {
    const c = await cenario(admin, { minimo: 5 })
    await compra(admin, c, 10) // saldo 10, mínimo 5, sem consumo → ponto = 5 → OK
    expect((await prisma.item.findUniqueOrThrow({ where: { id: c.item.id } })).status).toBe('OK')
    expect(await abertos(c.item.id)).toHaveLength(0)

    await consumo(almoxarife, c, 5) // saldo 5 → CRITICO (≤ mínimo)
    let alertas = await abertos(c.item.id)
    expect(alertas).toHaveLength(1)
    expect(alertas[0].nivel).toBe('CRITICO')
    const id = alertas[0].id

    await consumo(almoxarife, c, 5) // saldo 0 → ZERADO: o mesmo alerta sobe
    alertas = await abertos(c.item.id)
    expect(alertas).toMatchObject([{ id, nivel: 'ZERADO' }])

    await compra(admin, c, 100) // volta a OK: o alerta fecha sozinho
    expect(await abertos(c.item.id)).toHaveLength(0)
    expect((await prisma.alerta.findUniqueOrThrow({ where: { id } })).fechadoEm).not.toBeNull()
  })

  it('o banco impede dois alertas abertos para o mesmo item', async () => {
    const c = await cenario(admin) // já nasce com um alerta ZERADO aberto
    await expect(
      prisma.alerta.create({ data: { itemId: c.item.id, nivel: 'CRITICO' } }),
    ).rejects.toThrow(/alerta_um_aberto_por_item/)
  })

  it('RN-19: com e-mail configurado, entrar em CRITICO gera notificação na outbox', async () => {
    await prisma.parametro.upsert({
      where: { chave: 'email_avisos' },
      create: { chave: 'email_avisos', valor: 'estoque@dda.com.br' },
      update: { valor: 'estoque@dda.com.br' },
    })
    const c = await cenario(admin, { minimo: 5 })
    await compra(admin, c, 6)
    const r = await consumo(almoxarife, c, 2)
    expect(r.notificacoes).toHaveLength(1)
    const n = await prisma.notificacao.findUniqueOrThrow({ where: { id: r.notificacoes[0] } })
    expect(n).toMatchObject({
      status: 'PENDENTE',
      nivel: 'CRITICO',
      destinatario: 'estoque@dda.com.br',
    })
    await prisma.parametro.update({ where: { chave: 'email_avisos' }, data: { valor: '' } })
  })
})
