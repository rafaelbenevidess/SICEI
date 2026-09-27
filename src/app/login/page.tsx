import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/server/web/sessao-atual'
import { FormularioLogin } from './FormularioLogin'

export const metadata: Metadata = { title: 'Entrar' }

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ volta?: string }>
}) {
  const u = await usuarioAtual()
  if (u) redirect(u.deveTrocarSenha ? '/trocar-senha' : '/painel')
  const { volta } = await searchParams
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">SICEI</h1>
        <p className="text-slate-600">Sistema Inteligente de Controle de Estoques Industriais</p>
        <p className="text-sm text-slate-500">Licenciado para DDA Metalúrgica</p>
      </div>
      <FormularioLogin volta={volta ?? ''} />
      <p className="text-xs text-slate-500">
        Não tem acesso ou esqueceu a senha? Procure o Administrador do sistema. O SICEI não usa
        e-mail para login.
      </p>
    </main>
  )
}
