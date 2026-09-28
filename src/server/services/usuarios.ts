import 'server-only'
import {
  podeAgirSobreUsuario,
  podeCriarComPerfil,
  type AcaoSobreUsuario,
  type Decisao,
  type PessoaNaHierarquia,
} from '@/domain/hierarquia'
import { gerarLogin, loginBase } from '@/domain/login'
import { exigirPermissao } from '@/domain/permissoes'
import { validar } from '@/domain/schemas/comum'
import { schemaEdicaoUsuario, schemaNovoUsuario } from '@/domain/schemas/cadastros'
import { gerarSenhaProvisoria } from '@/domain/senha'
import { PERFIS, type Perfil } from '@/domain/tipos'
import { registrarAuditoria } from '../audit/registrar'
import { hashDeSenha } from '../auth/hash'
import type { Ator } from '../contexto'
import { prisma } from '../db'

import { ehViolacaoDeUnicidade, ErroDeNegocio, exigirUuid, naoEncontrado } from '../erros'

const origemDo = (ator: Ator) => ({
  usuarioId: ator.usuarioId,
  ip: ator.ip,
  userAgent: ator.userAgent,
})

/** Perfil e marca de principal do ator, lidos do banco (a sessão não é a fonte da verdade). */
async function pessoaDoAtor(ator: Ator): Promise<PessoaNaHierarquia> {
  const u = await prisma.usuario.findUnique({
    where: { id: ator.usuarioId },
    select: { id: true, perfil: true, principal: true },
  })
  return u ?? { id: ator.usuarioId, perfil: ator.perfil, principal: false }
}

/**
 * RN-21c: recusa a ação e deixa a tentativa no log. Um Administrador tentando mexer no principal
 * por fora da tela (a tela nem mostra os botões) é um sinal que o dono do sistema precisa ver.
 */
async function exigirHierarquia(
  ator: Ator,
  decisao: Decisao,
  alvo: { id: string; login: string } | null,
  acao: AcaoSobreUsuario | 'criar-admin',
): Promise<void> {
  if (decisao.ok) return
  await prisma.$transaction((tx) =>
    registrarAuditoria(tx, {
      acao: 'ACAO_NEGADA',
      entidade: 'usuario',
      entidadeId: alvo?.id ?? null,
      depois: { acao, alvo: alvo?.login ?? null, motivo: decisao.motivo },
      ...origemDo(ator),
    }),
  )
  throw new ErroDeNegocio(decisao.motivo)
}

/**
 * RN-21d: a matrícula é de um funcionário só. Se já tem login, inclusive inativo, a resposta
 * aponta qual é, para o Admin reativar em vez de criar uma segunda conta.
 */
async function exigirMatriculaLivre(matricula: string, exceto?: string): Promise<void> {
  const dono = await prisma.usuario.findUnique({
    where: { matricula },
    select: { id: true, login: true, ativo: true },
  })
  if (!dono || dono.id === exceto) return
  const mensagem = dono.ativo
    ? `A matrícula ${matricula} já é do login ${dono.login}. Cada funcionário tem um login só.`
    : `A matrícula ${matricula} já é do login ${dono.login}, que está inativo. Reative essa conta em vez de criar outra.`
  throw new ErroDeNegocio(mensagem, { matricula: mensagem })
}

/**
 * RF-02 / RN-21: o Admin informa nome, sobrenome, setor e perfil; o sistema gera login e senha provisória.
 * A senha em texto volta uma única vez, para ser mostrada ao Admin, e não é gravada em lugar nenhum.
 */
export async function criarUsuario(
  ator: Ator,
  entrada: unknown,
): Promise<{ id: string; login: string; senhaProvisoria: string }> {
  exigirPermissao(ator.perfil, 'usuarios:gerenciar')
  const v = validar(schemaNovoUsuario, entrada)
  if (!v.ok) throw new ErroDeNegocio('Confira os campos destacados.', v.erros)
  await exigirHierarquia(
    ator,
    podeCriarComPerfil(await pessoaDoAtor(ator), v.dados.perfil),
    null,
    'criar-admin',
  )
  await exigirMatriculaLivre(v.dados.matricula)
  let base: string
  try {
    base = loginBase(v.dados.nome, v.dados.sobrenome)
  } catch (e) {
    throw new ErroDeNegocio((e as Error).message, { sobrenome: (e as Error).message })
  }
  const senhaProvisoria = gerarSenhaProvisoria()
  const senhaHash = await hashDeSenha(senhaProvisoria)

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // inclui usuários inativos: login nunca é reaproveitado (RN-21b)
        const existentes = await tx.usuario.findMany({
          where: { login: { startsWith: base } },
          select: { login: true },
        })
        const login = gerarLogin(
          v.dados.nome,
          v.dados.sobrenome,
          existentes.map((e) => e.login),
        )
        const u = await tx.usuario.create({
          data: { ...v.dados, login, senhaHash, deveTrocarSenha: true },
        })
        await tx.historicoSenha.create({ data: { usuarioId: u.id, senhaHash } })
        await registrarAuditoria(tx, {
          acao: 'USUARIO_CRIADO',
          entidade: 'usuario',
          entidadeId: u.id,
          depois: {
            nome: u.nome,
            sobrenome: u.sobrenome,
            matricula: u.matricula,
            login: u.login,
            setor: u.setor,
            perfil: u.perfil,
          },
          ...origemDo(ator),
        })
        return { id: u.id, login, senhaProvisoria }
      })
    } catch (e) {
      if (!ehViolacaoDeUnicidade(e)) throw e
      // a mesma matrícula cadastrada ao mesmo tempo por outra pessoa: explica e para
      await exigirMatriculaLivre(v.dados.matricula)
      // dois cadastros simultâneos do mesmo nome: tenta de novo com o próximo número
    }
  }
  throw new ErroDeNegocio('Não foi possível gerar um login único. Tente novamente.')
}

async function buscarUsuario(id: string) {
  exigirUuid(id, 'Usuário')
  const u = await prisma.usuario.findUnique({ where: { id } })
  if (!u) throw naoEncontrado('Usuário')
  return u
}

/** Busca o alvo e confere a hierarquia (RN-21c) antes de qualquer mudança. */
async function alvoPermitido(
  ator: Ator,
  usuarioId: string,
  acao: AcaoSobreUsuario,
  novoPerfil?: Perfil,
) {
  const u = await buscarUsuario(usuarioId)
  const decisao = podeAgirSobreUsuario(await pessoaDoAtor(ator), u, acao, novoPerfil)
  await exigirHierarquia(ator, decisao, u, acao)
  return u
}

/** RN-21a: nova senha provisória, desbloqueio e troca obrigatória; as sessões abertas caem. */
export async function redefinirSenha(
  ator: Ator,
  usuarioId: string,
): Promise<{ login: string; senhaProvisoria: string }> {
  exigirPermissao(ator.perfil, 'usuarios:gerenciar')
  const u = await alvoPermitido(ator, usuarioId, 'redefinir-senha')
  const senhaProvisoria = gerarSenhaProvisoria()
  const senhaHash = await hashDeSenha(senhaProvisoria)
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: u.id },
      data: { senhaHash, deveTrocarSenha: true, falhasLogin: 0, bloqueadoEm: null },
    })
    await tx.historicoSenha.create({ data: { usuarioId: u.id, senhaHash } })
    await tx.sessao.deleteMany({ where: { usuarioId: u.id } })
    await registrarAuditoria(tx, {
      acao: 'SENHA_REDEFINIDA',
      entidade: 'usuario',
      entidadeId: u.id,
      antes: { bloqueado: u.bloqueadoEm !== null },
      depois: { deveTrocarSenha: true, bloqueado: false },
      ...origemDo(ator),
    })
  })
  return { login: u.login, senhaProvisoria }
}

export async function desbloquearUsuario(ator: Ator, usuarioId: string): Promise<void> {
  exigirPermissao(ator.perfil, 'usuarios:gerenciar')
  const u = await alvoPermitido(ator, usuarioId, 'desbloquear')
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id: u.id }, data: { falhasLogin: 0, bloqueadoEm: null } })
    await registrarAuditoria(tx, {
      acao: 'USUARIO_DESBLOQUEADO',
      entidade: 'usuario',
      entidadeId: u.id,
      antes: { bloqueado: u.bloqueadoEm !== null },
      depois: { bloqueado: false },
      ...origemDo(ator),
    })
  })
}

/**
 * RN-21b: inativar derruba as sessões na hora. O Admin não pode inativar a si mesmo, e o
 * principal não pode ser inativado por ninguém (RN-21c).
 */
export async function alterarSituacaoUsuario(
  ator: Ator,
  usuarioId: string,
  ativo: boolean,
): Promise<void> {
  exigirPermissao(ator.perfil, 'usuarios:gerenciar')
  const u = await alvoPermitido(ator, usuarioId, ativo ? 'reativar' : 'inativar')
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id: u.id }, data: { ativo } })
    if (!ativo) await tx.sessao.deleteMany({ where: { usuarioId: u.id } })
    await registrarAuditoria(tx, {
      acao: ativo ? 'USUARIO_REATIVADO' : 'USUARIO_INATIVADO',
      entidade: 'usuario',
      entidadeId: u.id,
      antes: { ativo: u.ativo },
      depois: { ativo },
      ...origemDo(ator),
    })
  })
}

export async function alterarPerfil(ator: Ator, usuarioId: string, perfil: string): Promise<void> {
  exigirPermissao(ator.perfil, 'usuarios:gerenciar')
  if (!(PERFIS as readonly string[]).includes(perfil)) throw new ErroDeNegocio('Perfil inválido.')
  const u = await alvoPermitido(ator, usuarioId, 'mudar-perfil', perfil as Perfil)
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id: u.id }, data: { perfil: perfil as Perfil } })
    await tx.sessao.deleteMany({ where: { usuarioId: u.id } })
    await registrarAuditoria(tx, {
      acao: 'USUARIO_PERFIL_ALTERADO',
      entidade: 'usuario',
      entidadeId: u.id,
      antes: { perfil: u.perfil },
      depois: { perfil },
      ...origemDo(ator),
    })
  })
}

/**
 * RF-02: corrige nome, sobrenome, setor e matrícula. O login não muda (RN-21b): ele identifica a
 * pessoa em todo o histórico. Segue a hierarquia da RN-21c.
 */
export async function editarUsuario(
  ator: Ator,
  usuarioId: string,
  entrada: unknown,
): Promise<void> {
  exigirPermissao(ator.perfil, 'usuarios:gerenciar')
  const u = await alvoPermitido(ator, usuarioId, 'editar-dados')
  const v = validar(schemaEdicaoUsuario, entrada)
  if (!v.ok) throw new ErroDeNegocio('Confira os campos destacados.', v.erros)
  await exigirMatriculaLivre(v.dados.matricula, u.id)
  const campos = ['nome', 'sobrenome', 'setor', 'matricula'] as const
  const mudou = campos.filter((c) => (u[c] ?? null) !== v.dados[c])
  if (mudou.length === 0) return
  try {
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id: u.id }, data: v.dados })
      await registrarAuditoria(tx, {
        acao: 'USUARIO_ALTERADO',
        entidade: 'usuario',
        entidadeId: u.id,
        antes: Object.fromEntries(mudou.map((c) => [c, u[c]])),
        depois: Object.fromEntries(mudou.map((c) => [c, v.dados[c]])),
        ...origemDo(ator),
      })
    })
  } catch (e) {
    if (!ehViolacaoDeUnicidade(e)) throw e
    await exigirMatriculaLivre(v.dados.matricula, u.id)
    throw e
  }
}
