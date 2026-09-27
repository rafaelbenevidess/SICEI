'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_AVISO_ALERTAS } from '@/lib/avisoDeAlertas'
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
    // RF-13: a cada login, quem pode dar ciente vê o pop-up dos alertas pendentes
    ;(await cookies()).set(COOKIE_AVISO_ALERTAS, '1', {
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
  jar.delete(COOKIE_AVISO_ALERTAS)
  redirect('/login')
}

/** Botão VER do pop-up de alertas: apaga a marca do login e leva à tela de alertas. */
export async function acaoVerAlertas(): Promise<void> {
  if (!(await usuarioAtual())) redirect('/login')
  ;(await cookies()).delete(COOKIE_AVISO_ALERTAS)
  redirect('/alertas')
}

/** A pessoa chegou à tela de alertas por outro caminho: o pop-up já cumpriu o papel. */
export async function acaoAvisoDeAlertasVisto(): Promise<void> {
  if (!(await usuarioAtual())) return
  ;(await cookies()).delete(COOKIE_AVISO_ALERTAS)
}
