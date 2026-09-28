import { beforeAll, describe, expect, it } from 'vitest'
import { MOTIVO_CRIAR_ADMIN, MOTIVO_PRINCIPAL, MOTIVO_SO_PRINCIPAL } from '@/domain/hierarquia'
import type { Ator } from '@/server/contexto'
import { prisma } from '@/server/db'
import {
  alterarPerfil,
  alterarSituacaoUsuario,
  criarUsuario,
  desbloquearUsuario,
  redefinirSenha,
} from '@/server/services/usuarios'
import { atorPrincipal, comoAplicacao, criarAtor } from './apoio'

let principal: Ator
let adminComum: Ator
let outroAdmin: Ator

beforeAll(async () => {
  principal = await atorPrincipal()
  adminComum = await criarAtor('ADMIN')
  outroAdmin = await criarAtor('ADMIN')
})

const tentativasNegadas = (ator: Ator) =>
  prisma.auditLog.count({ where: { acao: 'ACAO_NEGADA', usuarioId: ator.usuarioId } })

describe('RN-21c · Ninguém toma a conta do Administrador principal', () => {
  it('Admin comum não redefine a senha do principal; a senha não muda e a tentativa vai para o log', async () => {
    const antes = await prisma.usuario.findUniqueOrThrow({ where: { id: principal.usuarioId } })
    const negadas = await tentativasNegadas(adminComum)
    await expect(redefinirSenha(adminComum, principal.usuarioId)).rejects.toThrow(MOTIVO_PRINCIPAL)
    const depois = await prisma.usuario.findUniqueOrThrow({ where: { id: principal.usuarioId } })
    expect(depois.senhaHash).toBe(antes.senhaHash)
    expect(await tentativasNegadas(adminComum)).toBe(negadas + 1)
    const registro = await prisma.auditLog.findFirstOrThrow({
      where: { acao: 'ACAO_NEGADA', usuarioId: adminComum.usuarioId },
      orderBy: { seq: 'desc' },
    })
    expect(registro.depois).toMatchObject({ acao: 'redefinir-senha', alvo: principal.login })
  })

  it('Admin comum não inativa nem rebaixa o principal', async () => {
    await expect(alterarSituacaoUsuario(adminComum, principal.usuarioId, false)).rejects.toThrow(
      MOTIVO_PRINCIPAL,
    )
    await expect(alterarPerfil(adminComum, principal.usuarioId, 'CONSULTA')).rejects.toThrow(
      MOTIVO_PRINCIPAL,
    )
    const p = await prisma.usuario.findUniqueOrThrow({ where: { id: principal.usuarioId } })
    expect(p).toMatchObject({ ativo: true, perfil: 'ADMIN', principal: true })
  })

  it('qualquer Admin desbloqueia o principal (só devolve o acesso ao dono)', async () => {
    await prisma.usuario.update({
      where: { id: principal.usuarioId },
      data: { bloqueadoEm: new Date(), falhasLogin: 5 },
    })
    await desbloquearUsuario(adminComum, principal.usuarioId)
    const p = await prisma.usuario.findUniqueOrThrow({ where: { id: principal.usuarioId } })
    expect(p.bloqueadoEm).toBeNull()
  })
})

describe('RN-21c · Só o principal cuida de Administradores', () => {
  it('Admin comum não cria Administrador; o principal cria', async () => {
    const dados = { nome: 'Novo', sobrenome: 'Administrador', setor: 'TI', perfil: 'ADMIN' }
    await expect(criarUsuario(adminComum, dados)).rejects.toThrow(MOTIVO_CRIAR_ADMIN)
    const r = await criarUsuario(principal, dados)
    const u = await prisma.usuario.findUniqueOrThrow({ where: { id: r.id } })
    expect(u).toMatchObject({ perfil: 'ADMIN', principal: false })
  })

  it('Admin comum não redefine senha, não inativa e não muda o perfil de outro Admin', async () => {
    await expect(redefinirSenha(adminComum, outroAdmin.usuarioId)).rejects.toThrow(
      MOTIVO_SO_PRINCIPAL,
    )
    await expect(alterarSituacaoUsuario(adminComum, outroAdmin.usuarioId, false)).rejects.toThrow(
      MOTIVO_SO_PRINCIPAL,
    )
    await expect(alterarPerfil(adminComum, outroAdmin.usuarioId, 'CONSULTA')).rejects.toThrow(
      MOTIVO_SO_PRINCIPAL,
    )
  })

  it('Admin comum não promove ninguém a Administrador; o principal promove', async () => {
    const almox = await criarAtor('ALMOXARIFE')
    await expect(alterarPerfil(adminComum, almox.usuarioId, 'ADMIN')).rejects.toThrow(
      MOTIVO_CRIAR_ADMIN,
    )
    await alterarPerfil(adminComum, almox.usuarioId, 'GESTOR')
    await alterarPerfil(principal, almox.usuarioId, 'ADMIN')
    const u = await prisma.usuario.findUniqueOrThrow({ where: { id: almox.usuarioId } })
    expect(u.perfil).toBe('ADMIN')
  })

  it('o principal redefine a senha e inativa outro Admin', async () => {
    const alvo = await criarAtor('ADMIN')
    const r = await redefinirSenha(principal, alvo.usuarioId)
    expect(r.senhaProvisoria).toHaveLength(12)
    await alterarSituacaoUsuario(principal, alvo.usuarioId, false)
    const u = await prisma.usuario.findUniqueOrThrow({ where: { id: alvo.usuarioId } })
    expect(u.ativo).toBe(false)
  })
})

describe('RN-21c · O banco protege o principal mesmo com SQL direto', () => {
  const tentar = (sql: string, ...params: unknown[]) =>
    comoAplicacao((c) => c.query(sql, params)).then(
      () => 'passou',
      (e: Error) => e.message,
    )

  it('rebaixar, inativar ou apagar o principal é recusado pelo trigger', async () => {
    const id = principal.usuarioId
    expect(await tentar(`UPDATE usuario SET perfil = 'CONSULTA' WHERE id = $1`, id)).toMatch(
      /RN-21c/,
    )
    expect(await tentar('UPDATE usuario SET ativo = false WHERE id = $1', id)).toMatch(/RN-21c/)
    expect(await tentar('UPDATE usuario SET principal = false WHERE id = $1', id)).toMatch(/RN-21c/)
    expect(await tentar('DELETE FROM usuario WHERE id = $1', id)).not.toBe('passou')
  })

  it('ninguém vira principal por UPDATE, e não existe um segundo principal', async () => {
    expect(
      await tentar('UPDATE usuario SET principal = true WHERE id = $1', adminComum.usuarioId),
    ).toMatch(/RN-21c/)
    expect(await prisma.usuario.count({ where: { principal: true } })).toBe(1)
  })

  it('trocar a senha do principal pelo banco continua possível (script de recuperação)', async () => {
    expect(
      await tentar(
        'UPDATE usuario SET falhas_login = 0, bloqueado_em = NULL WHERE id = $1',
        principal.usuarioId,
      ),
    ).toBe('passou')
  })
})
