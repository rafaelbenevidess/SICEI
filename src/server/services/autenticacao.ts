import 'server-only'
import {
  JANELA_TENTATIVAS_IP_MINUTOS,
  deveBloquear,
  excedeuLimiteDoIp,
  problemasDaSenha,
} from '@/domain/senha'
import { validar } from '@/domain/schemas/comum'
import { schemaLogin, schemaTrocaSenha } from '@/domain/schemas/cadastros'
import { registrarAuditoria } from '../audit/registrar'
import { criarSessao } from '../auth/sessao'
import { gastarTempoComoSeVerificasse, hashDeSenha, senhaConfere } from '../auth/hash'
import { prisma } from '../db'
import { ErroDeNegocio } from '../erros'

export const MENSAGEM_LOGIN_INVALIDO = 'Login ou senha inválidos.'
export const MENSAGEM_CONTA_BLOQUEADA =
  'Conta bloqueada após 5 tentativas sem sucesso. Procure o Administrador.'
export const MENSAGEM_MUITAS_TENTATIVAS =
  'Muitas tentativas a partir deste endereço. Aguarde alguns minutos.'

interface Origem {
  ip: string | null
  userAgent: string | null
}

/** RF-01: login com bloqueio (RN-22), rate limit por IP e mensagem única para login ou senha errados. */
export async function entrar(
  entrada: unknown,
  origem: Origem,
): Promise<{ token: string; expiraEm: Date; deveTrocarSenha: boolean }> {
  const v = validar(schemaLogin, entrada)
  if (!v.ok) throw new ErroDeNegocio(MENSAGEM_LOGIN_INVALIDO, v.erros)
  const login = v.dados.login.toLowerCase()
  const ip = origem.ip ?? 'desconhecido'

  const desde = new Date(Date.now() - JANELA_TENTATIVAS_IP_MINUTOS * 60_000)
  const tentativas = await prisma.tentativaLogin.count({ where: { ip, criadoEm: { gte: desde } } })
  if (excedeuLimiteDoIp(tentativas)) throw new ErroDeNegocio(MENSAGEM_MUITAS_TENTATIVAS)

  const usuario = await prisma.usuario.findUnique({ where: { login } })
  const falhar = async (mensagem: string, usuarioId: string | null, extra: object = {}) => {
    await prisma.$transaction(async (tx) => {
      await tx.tentativaLogin.create({ data: { ip, login, sucesso: false } })
      await registrarAuditoria(tx, {
        acao: 'LOGIN_FALHOU',
        entidade: 'usuario',
        entidadeId: usuarioId,
        depois: { login, ...extra },
        usuarioId,
        ...origem,
      })
    })
    throw new ErroDeNegocio(mensagem)
  }

  if (!usuario || !usuario.ativo) {
    await gastarTempoComoSeVerificasse(v.dados.senha)
    return falhar(MENSAGEM_LOGIN_INVALIDO, null)
  }
  const confere = await senhaConfere(usuario.senhaHash, v.dados.senha)
  // conta bloqueada: a resposta é sempre a mesma, com ou sem a senha certa.
  // Assim ninguém continua testando senhas depois do bloqueio (RN-22).
  if (usuario.bloqueadoEm) return falhar(MENSAGEM_CONTA_BLOQUEADA, usuario.id, { bloqueado: true })
  if (!confere) {
    const falhas = usuario.falhasLogin + 1
    const bloquear = deveBloquear(falhas)
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: usuario.id },
        data: { falhasLogin: falhas, bloqueadoEm: bloquear ? new Date() : null },
      })
      if (bloquear) {
        await tx.sessao.deleteMany({ where: { usuarioId: usuario.id } })
        await registrarAuditoria(tx, {
          acao: 'USUARIO_BLOQUEADO',
          entidade: 'usuario',
          entidadeId: usuario.id,
          depois: { falhasLogin: falhas },
          usuarioId: usuario.id,
          ...origem,
        })
      }
    })
    return falhar(bloquear ? MENSAGEM_CONTA_BLOQUEADA : MENSAGEM_LOGIN_INVALIDO, usuario.id, {
      falhasLogin: falhas,
    })
  }

  const sessao = await criarSessao(usuario.id, origem)
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id: usuario.id }, data: { falhasLogin: 0 } })
    await tx.tentativaLogin.create({ data: { ip, login, sucesso: true } })
    await registrarAuditoria(tx, {
      acao: 'LOGIN',
      entidade: 'usuario',
      entidadeId: usuario.id,
      usuarioId: usuario.id,
      ...origem,
    })
  })
  return { ...sessao, deveTrocarSenha: usuario.deveTrocarSenha }
}

export async function sair(usuarioId: string, sessaoId: string, origem: Origem): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.sessao.deleteMany({ where: { id: sessaoId } })
    await registrarAuditoria(tx, {
      acao: 'LOGOUT',
      entidade: 'usuario',
      entidadeId: usuarioId,
      usuarioId,
      ...origem,
    })
  })
}

/** RN-21a / RN-22: troca de senha, obrigatória no primeiro acesso. */
export async function trocarSenha(
  usuarioId: string,
  entrada: unknown,
  origem: Origem,
  sessaoAtualId?: string,
): Promise<void> {
  const v = validar(schemaTrocaSenha, entrada)
  if (!v.ok) throw new ErroDeNegocio('Confira os campos destacados.', v.erros)
  const usuario = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuarioId },
    include: { historicoSenhas: { orderBy: { criadoEm: 'desc' }, take: 3 } },
  })
  if (!(await senhaConfere(usuario.senhaHash, v.dados.senhaAtual))) {
    throw new ErroDeNegocio('A senha atual não confere.', {
      senhaAtual: 'A senha atual não confere.',
    })
  }
  const recentes = [usuario.senhaHash, ...usuario.historicoSenhas.map((h) => h.senhaHash)].slice(
    0,
    3,
  )
  let repete = false
  for (const h of recentes) if (await senhaConfere(h, v.dados.novaSenha)) repete = true
  const problemas = problemasDaSenha({
    senha: v.dados.novaSenha,
    login: usuario.login,
    repeteUmaDasUltimas: repete,
  })
  if (problemas.length)
    throw new ErroDeNegocio(problemas.join(' '), { novaSenha: problemas.join(' ') })

  const novoHash = await hashDeSenha(v.dados.novaSenha)
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: usuarioId },
      data: { senhaHash: novoHash, deveTrocarSenha: false },
    })
    await tx.historicoSenha.create({ data: { usuarioId, senhaHash: novoHash } })
    // as outras sessões (outros aparelhos) caem; a atual continua
    await tx.sessao.deleteMany({
      where: { usuarioId, ...(sessaoAtualId ? { id: { not: sessaoAtualId } } : {}) },
    })
    await registrarAuditoria(tx, {
      acao: 'SENHA_ALTERADA',
      entidade: 'usuario',
      entidadeId: usuarioId,
      usuarioId,
      ...origem,
    })
  })
}
