import Link from 'next/link'

export default function SemPermissao() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Acesso negado</h1>
      <p className="text-slate-600">O seu perfil não tem permissão para abrir esta página.</p>
      <Link href="/painel" className="underline">
        Voltar ao painel
      </Link>
    </main>
  )
}
