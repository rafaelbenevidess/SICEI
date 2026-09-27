import 'server-only'
import { sha256Hex } from '@/domain/auditoria'
import type { Perfil } from '@/domain/tipos'
import { prisma } from '../db'
import { lerParametros } from '../parametros'

export const COOKIE_SESSAO = 'sicei_sessao'
/** Duração máxima de uma sessão, com ou sem uso (doc 03, seção 5.5). */
export const DURACAO_MAXIMA_HORAS = 12

export interface UsuarioDaSessao {
  id: string
  nome: string
  sobrenome: string
  login: string
  perfil: Perfil
  setor: string
  deveTrocarSenha: boolean
  sessaoId: string
}

function tokenAleatorio(): string {
  const bytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString('base64url')
}

/** Cria a sessão e devolve o token do cookie. O banco guarda só o SHA-256 do token. */
export async function criarSessao(
  usuarioId: string,
  origem: { ip: string | null; userAgent: string | null },
): Promise<{ token: string; expiraEm: Date }> {
  const token = tokenAleatorio()
  const expiraEm = new Date(Date.now() + DURACAO_MAXIMA_HORAS * 3600_000)
  await prisma.sessao.create({
    data: {
      id: await sha256Hex(token),
      usuarioId,
      expiraEm,
      ip: origem.ip,
      userAgent: origem.userAgent,
    },
  })
  return { token, expiraEm }
}

/**
 * Valida o token: sessão existente, dentro da duração máxima, sem inatividade além do limite,
 * usuário ativo e não bloqueado. Sessão vencida é apagada.
 */
export async function validarToken(
  token: string | undefined | null,
): Promise<UsuarioDaSessao | null> {
  if (!token || token.length < 20 || token.length > 100) return null
  const id = await sha256Hex(token)
  const sessao = await prisma.sessao.findUnique({ where: { id }, include: { usuario: true } })
  if (!sessao) return null

  const agora = Date.now()
  const { sessaoInatividadeMinutos } = await lerParametros()
  const inativa = agora - sessao.ultimoUso.getTime() > sessaoInatividadeMinutos * 60_000
  const u = sessao.usuario
  if (sessao.expiraEm.getTime() <= agora || inativa || !u.ativo || u.bloqueadoEm !== null) {
    await prisma.sessao.deleteMany({ where: { id } })
    return null
  }
  // atualiza o último uso no máximo uma vez por minuto
  if (agora - sessao.ultimoUso.getTime() > 60_000) {
    await prisma.sessao.update({ where: { id }, data: { ultimoUso: new Date(agora) } })
  }
  return {
    id: u.id,
    nome: u.nome,
    sobrenome: u.sobrenome,
    login: u.login,
    perfil: u.perfil,
    setor: u.setor,
    deveTrocarSenha: u.deveTrocarSenha,
    sessaoId: id,
  }
}

export async function encerrarSessao(token: string): Promise<void> {
  await prisma.sessao.deleteMany({ where: { id: await sha256Hex(token) } })
}
