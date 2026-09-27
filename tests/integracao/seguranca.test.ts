import { beforeAll, describe, expect, it } from 'vitest'
import { conferirSaldos, verificarIntegridade } from '@/server/audit/verificar'
import type { Ator } from '@/server/contexto'
import { prisma } from '@/server/db'
import { conferirIntegridade } from '@/server/services/auditoria'
import { registrarMovimentacao } from '@/server/services/movimentacoes'
import { cenario, comoAplicacao, comoDono, criarAtor } from './apoio'

let admin: Ator
let c: Awaited<ReturnType<typeof cenario>>
let movId: string

beforeAll(async () => {
  admin = await criarAtor('ADMIN')
  c = await cenario(admin)
  const r = await registrarMovimentacao(admin, {
    tipo: 'COMPRA',
    itemId: c.item.id,
    quantidade: 10,
    fornecedorId: c.fornecedor.id,
    precoUnitario: 40,
    notaFiscal: 'NF-9',
  })
  movId = r.movimentacao.id
})

describe('RN-09a · O usuário da aplicação não altera o histórico', () => {
  it('UPDATE em movimentacao é negado ao usuário da aplicação', async () => {
    await expect(
      comoAplicacao((db) =>
        db.query('UPDATE movimentacao SET quantidade = 99 WHERE id = $1', [movId]),
      ),
    ).rejects.toThrow(/permission denied|permissão negada/)
  })
  it('DELETE em audit_log é negado ao usuário da aplicação', async () => {
    await expect(comoAplicacao((db) => db.query('DELETE FROM audit_log'))).rejects.toThrow(
      /permission denied|permissão negada/,
    )
  })
  it('nem o dono do banco consegue alterar: o trigger barra UPDATE, DELETE e TRUNCATE', async () => {
    await expect(
      comoDono((db) => db.query('UPDATE movimentacao SET quantidade = 99 WHERE id = $1', [movId])),
    ).rejects.toThrow(/somente inclusão/)
    await expect(comoDono((db) => db.query('DELETE FROM audit_log'))).rejects.toThrow(
      /somente inclusão/,
    )
    await expect(comoDono((db) => db.query('TRUNCATE movimentacao CASCADE'))).rejects.toThrow(
      /somente inclusão/,
    )
  })
  it('o banco recusa saldo negativo mesmo que o código erre (CHECK)', async () => {
    await expect(
      prisma.item.update({ where: { id: c.item.id }, data: { saldo: -1 } }),
    ).rejects.toThrow(/item_saldo_nao_negativo/)
  })
  it('o banco recusa COMPRA sem nota fiscal mesmo que o código erre (CHECK)', async () => {
    await expect(
      prisma.movimentacao.create({
        data: {
          itemId: c.item.id,
          tipo: 'COMPRA',
          quantidade: 1,
          saldoAnterior: 10,
          saldoPosterior: 11,
          fornecedorId: c.fornecedor.id,
          precoUnitario: 10,
          usuarioId: admin.usuarioId,
        },
      }),
    ).rejects.toThrow(/movimentacao_campos_por_tipo/)
  })
})

describe('RN-09a / RN-09b · Verificação de integridade e conferência de saldo', () => {
  it('sem adulteração: cadeia íntegra, movimentações batem com o log e saldos batem', async () => {
    const r = await verificarIntegridade()
    expect(r.cadeia.integra).toBe(true)
    expect(r.movimentacoesDivergentes).toEqual([])
    expect(await conferirSaldos()).toEqual([])
  })

  it('RF-21: a conferência pedida pelo Admin devolve o resumo e fica registrada no log', async () => {
    const r = await conferirIntegridade(admin)
    expect(r.cadeiaIntegra).toBe(true)
    expect(r.adulteracao).toBeNull()
    expect(r.registrosConferidos).toBeGreaterThan(0)
    expect(r.saldosDivergentes).toEqual([])
    expect(r.itensConferidos).toBeGreaterThan(0)
    const ultimo = await prisma.auditLog.findFirst({ orderBy: { seq: 'desc' } })
    expect(ultimo).toMatchObject({
      acao: 'CONFERENCIA_INTEGRIDADE',
      usuarioId: admin.usuarioId,
      depois: { cadeiaIntegra: true, movimentacoesDivergentes: 0, saldosDivergentes: 0 },
    })
  })

  it('RF-21: perfil sem permissão de auditoria não executa a conferência', async () => {
    const consulta = await criarAtor('CONSULTA')
    await expect(conferirIntegridade(consulta)).rejects.toThrow()
  })

  it('saldo alterado direto no banco aparece como divergência', async () => {
    await comoDono((db) => db.query('UPDATE item SET saldo = saldo + 5 WHERE id = $1', [c.item.id]))
    const div = await conferirSaldos()
    expect(div).toEqual([
      { itemId: c.item.id, codigo: c.item.codigo, saldoGuardado: 15, saldoPelasMovimentacoes: 10 },
    ])
    await comoDono((db) => db.query('UPDATE item SET saldo = saldo - 5 WHERE id = $1', [c.item.id]))
    expect(await conferirSaldos()).toEqual([])
  })

  it('fraudador que desliga o trigger e altera uma movimentação é descoberto', async () => {
    await comoDono(async (db) => {
      await db.query('ALTER TABLE movimentacao DISABLE TRIGGER movimentacao_imutavel')
      await db.query('UPDATE movimentacao SET nota_fiscal = $1 WHERE id = $2', ['NF-FALSA', movId])
    })
    try {
      const r = await verificarIntegridade()
      expect(r.cadeia.integra).toBe(true) // o log continua íntegro...
      expect(r.movimentacoesDivergentes).toEqual([movId]) // ...e a movimentação não bate com ele
    } finally {
      await comoDono(async (db) => {
        await db.query('UPDATE movimentacao SET nota_fiscal = $1 WHERE id = $2', ['NF-9', movId])
        await db.query('ALTER TABLE movimentacao ENABLE TRIGGER movimentacao_imutavel')
      })
    }
  })

  it('fraudador que altera o próprio log quebra a cadeia no registro exato', async () => {
    const [{ seq }] = await prisma.$queryRaw<
      { seq: bigint }[]
    >`SELECT min(seq) AS seq FROM audit_log`
    await comoDono(async (db) => {
      await db.query('ALTER TABLE audit_log DISABLE TRIGGER audit_log_imutavel')
      await db.query(`UPDATE audit_log SET acao = acao || '_ADULTERADO' WHERE seq = $1`, [seq])
    })
    try {
      const r = await verificarIntegridade()
      expect(r.cadeia).toMatchObject({ integra: false, seq: Number(seq) })
    } finally {
      await comoDono(async (db) => {
        await db.query(
          `UPDATE audit_log SET acao = replace(acao, '_ADULTERADO', '') WHERE seq = $1`,
          [seq],
        )
        await db.query('ALTER TABLE audit_log ENABLE TRIGGER audit_log_imutavel')
      })
    }
    expect((await verificarIntegridade()).cadeia.integra).toBe(true)
  })

  it('RN-09: cada movimentação tem usuário, IP e dispositivo no log', async () => {
    const reg = await prisma.auditLog.findFirstOrThrow({ where: { entidadeId: movId } })
    expect(reg).toMatchObject({
      acao: 'MOVIMENTACAO_COMPRA',
      usuarioId: admin.usuarioId,
      ip: '127.0.0.1',
      userAgent: 'vitest',
    })
  })
})
