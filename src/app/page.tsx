import Link from 'next/link'

export default function Inicio() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-16">
      <h1 className="text-3xl font-bold">SIMI</h1>
      <p className="text-slate-600">
        Controle de estoque de pastilhas industriais da DDA Metalúrgica.
      </p>
      <nav className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/testes"
          className="rounded-md bg-slate-900 px-4 py-2 text-center font-medium text-white hover:bg-slate-700"
        >
          Laboratório de testes
        </Link>
      </nav>
    </main>
  )
}
