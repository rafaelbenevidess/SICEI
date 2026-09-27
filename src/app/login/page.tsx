import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { TelaDeAcesso } from '@/components/TelaDeAcesso'
import { usuarioAtual } from '@/server/web/sessao-atual'
import { FormularioLogin } from './FormularioLogin'

export const metadata: Metadata = { title: 'Entrar' }

/** RN-21: login gerado pelo sistema; nunca e-mail. */
export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ volta?: string }>
}) {
  const u = await usuarioAtual()
  if (u) redirect(u.deveTrocarSenha ? '/trocar-senha' : '/painel')
  const { volta } = await searchParams
  return (
    <TelaDeAcesso>
      <h1 className="text-[30px] font-semibold tracking-tight">Entrar</h1>
      <p className="mt-1 mb-7 text-ink-2">Use o login que o Administrador entregou para você.</p>
      <FormularioLogin volta={volta ?? ''} />
      <p className="mt-6 text-xs text-ink-3">
        Não tem acesso ou esqueceu a senha? Procure o Administrador do sistema. O SICEI não usa
        e-mail para login.
      </p>
    </TelaDeAcesso>
  )
}
