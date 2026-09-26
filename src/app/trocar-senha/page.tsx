import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/server/web/sessao-atual'
import { FormularioTrocaSenha } from './FormularioTrocaSenha'

export const metadata: Metadata = { title: 'Trocar senha' }

export default async function PaginaTrocarSenha() {
  const u = await usuarioAtual()
  if (!u) redirect('/login')
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Trocar senha</h1>
        <p className="mt-1 text-sm text-slate-600">
          {u.deveTrocarSenha
            ? `Olá, ${u.nome}. Antes de continuar, crie a sua senha. Assim só você a conhece (RN-21a).`
            : 'Informe a senha atual e a nova senha.'}
        </p>
      </div>
      <FormularioTrocaSenha login={u.login} />
      <ul className="list-disc pl-5 text-xs text-slate-500">
        <li>Pelo menos 10 caracteres.</li>
        <li>Diferente do seu login ({u.login}).</li>
        <li>Diferente das suas 3 últimas senhas.</li>
      </ul>
    </main>
  )
}
