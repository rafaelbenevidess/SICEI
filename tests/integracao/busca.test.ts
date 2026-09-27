import { beforeAll, describe, expect, it } from 'vitest'
import type { Ator } from '@/server/contexto'
import { listarAuditoria } from '@/server/consultas/auditoria'
import { sugerirItens } from '@/server/consultas/estoque'
import { listarMovimentacoes } from '@/server/consultas/movimentacoes'
import { registrarMovimentacao } from '@/server/services/movimentacoes'
import { cenario, criarAtor } from './apoio'

let admin: Ator
let c: Awaited<ReturnType<typeof cenario>>
let op: string

beforeAll(async () => {
  admin = await criarAtor('ADMIN')
  c = await cenario(admin)
  await registrarMovimentacao(admin, {
    tipo: 'COMPRA',
    itemId: c.item.id,
    quantidade: 5,
    fornecedorId: c.fornecedor.id,
    precoUnitario: 10,
    notaFiscal: 'NF-1',
  })
  op = `OP-${Date.now().toString().slice(-8)}-77`
  await registrarMovimentacao(admin, {
    tipo: 'CONSUMO_PRODUCAO',
    itemId: c.item.id,
    quantidade: 1,
    destinoId: c.destino.id,
    ordemProducao: op,
    colaboradorId: c.colaborador.id,
  })
})

/** O código do item de teste escrito do jeito que a pessoa digitaria: minúsculo e sem traços. */
const semTracos = (texto: string) => texto.toLowerCase().replace(/[-.]/g, ' ')

describe('RF-11 / RF-15 · Filtros de texto tolerantes nas movimentações', () => {
  it('a busca livre acha a OP digitada sem traços e em minúsculas', async () => {
    const r = await listarMovimentacoes({ busca: op.toLowerCase().replace(/-/g, '') })
    expect(r.linhas.map((l) => l.ordemProducao)).toEqual([op])
  })

  it('a busca livre acha o item pelo código escrito de outro jeito', async () => {
    const r = await listarMovimentacoes({ busca: semTracos(c.item.codigo) })
    expect(r.total).toBe(2)
    expect(new Set(r.linhas.map((l) => l.item.codigo))).toEqual(new Set([c.item.codigo]))
  })

  it('o filtro de usuário acha o login digitado com espaço no lugar do ponto', async () => {
    const r = await listarMovimentacoes({ usuario: semTracos(admin.login), item: c.item.codigo })
    expect(r.total).toBe(2)
  })

  it('texto que não combina com nada não traz linhas', async () => {
    const r = await listarMovimentacoes({ busca: 'zzz-nada-parecido-zzz' })
    expect(r.total).toBe(0)
  })
})

describe('RF-11 / RF-21 · Filtro de usuário da auditoria', () => {
  it('login digitado com espaço e maiúsculas acha só os registros daquele usuário', async () => {
    const r = await listarAuditoria({ usuario: semTracos(admin.login).toUpperCase() })
    expect(r.total).toBeGreaterThan(0)
    expect(new Set(r.linhas.map((l) => l.login))).toEqual(new Set([admin.login]))
  })
})

describe('RF-11 · Sugestões da busca do topo', () => {
  it('sugere o item pelo código escrito de outro jeito, com a posição e o status', async () => {
    const r = await sugerirItens(semTracos(c.item.codigo))
    expect(r[0]).toMatchObject({ id: c.item.id, codigo: c.item.codigo })
    expect(r.length).toBeLessThanOrEqual(8)
  })

  it('termo vazio não consulta nada', async () => {
    expect(await sugerirItens('   ')).toEqual([])
  })
})
