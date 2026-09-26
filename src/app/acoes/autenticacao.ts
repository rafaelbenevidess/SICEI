'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { destinoSeguro } from '@/lib/redirecionamento'
import { COOKIE_SESSAO, encerrarSessao } from '@/server/auth/sessao'
import { entrar, sair, trocarSenha } from '@/server/services/autenticacao'
import { dadosDoFormulario, executarAcao, type EstadoAcao } from '@/server/web/acao'
import { origemDaRequisicao, usuarioAtual } from '@/server/web/sessao-atual'

export async function acaoEntrar(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  let destino = '/painel'
  const estado = await executarAcao(async () => {
    const r = await entrar(dadosDoFormulario(form), await origemDaRequisicao())
    ;(await cookies()).set(COOKIE_SESSAO, r.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: r.expiraEm,
    })
    destino = r.deveTrocarSenha
      ? '/trocar-senha'
      : destinoSeguro(form.get('volta') as string | null)
  })
  if (!estado.ok) return estado
  redirect(destino)
}

export async function acaoTrocarSenha(_: EstadoAcao, form: FormData): Promise<EstadoAcao> {
  const u = await usuarioAtual()
  if (!u) redirect('/login')
  const estado = await executarAcao(async () => {
    await trocarSenha(u.id, dadosDoFormulario(form), await origemDaRequisicao(), u.sessaoId)
  })
  if (!estado.ok) return estado
  redirect('/painel')
}

export async function acaoSair(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(COOKIE_SESSAO)?.value
  const u = await usuarioAtual()
  if (u) await sair(u.id, u.sessaoId, await origemDaRequisicao())
  else if (token) await encerrarSessao(token)
  jar.delete(COOKIE_SESSAO)
  redirect('/login')
}
