import Link from 'next/link'
import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/server/web/sessao-atual'

export default async function Inicio() {
  if (await usuarioAtual()) redirect('/painel')
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-3xl font-bold">SICEI</h1>
      <p className="text-lg text-slate-700">
        Sistema Inteligente de Controle de Estoques Industriais
      </p>
      <p className="text-slate-600">
        Controle de estoque de pastilhas industriais. Licenciado para a DDA Metalúrgica. Trabalho
        acadêmico.
      </p>
      <nav className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-md bg-slate-900 px-4 py-2 text-center font-medium text-white hover:bg-slate-700"
        >
          Entrar
        </Link>
        <Link
          href="/testes"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-center font-medium hover:bg-slate-50"
        >
          Laboratório de testes
        </Link>
      </nav>
    </main>
  )
}
