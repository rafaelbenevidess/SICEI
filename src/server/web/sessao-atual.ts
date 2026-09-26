import 'server-only'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { pode, type Permissao } from '@/domain/permissoes'
import { COOKIE_SESSAO, validarToken, type UsuarioDaSessao } from '../auth/sessao'
import type { Ator } from '../contexto'

/** Usuário da sessão atual, validado no banco (uma vez por requisição). */
export const usuarioAtual = cache(async (): Promise<UsuarioDaSessao | null> => {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  return validarToken(token)
})

/** Exige sessão válida e senha já trocada; senão, redireciona. */
export async function exigirUsuario(): Promise<UsuarioDaSessao> {
  const u = await usuarioAtual()
  if (!u) redirect('/login')
  if (u.deveTrocarSenha) redirect('/trocar-senha')
  return u
}

/** Exige a permissão para abrir a página. */
export async function exigirPermissaoDaPagina(permissao: Permissao): Promise<UsuarioDaSessao> {
  const u = await exigirUsuario()
  if (!pode(u.perfil, permissao)) redirect('/sem-permissao')
  return u
}

export async function origemDaRequisicao(): Promise<{
  ip: string | null
  userAgent: string | null
}> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null
  return { ip, userAgent: h.get('user-agent')?.slice(0, 300) ?? null }
}

/** O Ator de uma Server Action: confere a sessão de novo (toda Action é uma porta de entrada). */
export async function atorDaAcao(): Promise<Ator> {
  const u = await exigirUsuario()
  const origem = await origemDaRequisicao()
  return { usuarioId: u.id, login: u.login, perfil: u.perfil, ...origem }
}
