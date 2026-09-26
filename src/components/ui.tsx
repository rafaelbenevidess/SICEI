import Link from 'next/link'
import type { ReactNode } from 'react'
import { NOME_STATUS } from '@/lib/formatar'

export function Pagina({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string
  descricao?: ReactNode
  acoes?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          {descricao && <p className="mt-1 text-sm text-slate-600">{descricao}</p>}
        </div>
        {acoes && <div className="nao-imprimir flex flex-wrap gap-2">{acoes}</div>}
      </header>
      {children}
    </div>
  )
}

export function Cartao({
  titulo,
  children,
  className = '',
}: {
  titulo?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`min-w-0 rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      {titulo && <h2 className="mb-3 text-lg font-semibold">{titulo}</h2>}
      {children}
    </section>
  )
}

export function Tabela({ children, rotulo }: { children: ReactNode; rotulo: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table
        aria-label={rotulo}
        className="w-full text-left text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_thead]:bg-slate-50 [&_tr]:border-b [&_tr]:border-slate-100"
      >
        {children}
      </table>
    </div>
  )
}

const CORES_STATUS: Record<string, string> = {
  OK: 'bg-green-100 text-green-800 border-green-300',
  ATENCAO: 'bg-amber-100 text-amber-900 border-amber-300',
  CRITICO: 'bg-red-100 text-red-800 border-red-300',
  ZERADO: 'bg-slate-800 text-white border-slate-800',
}

/** RNF-10: o status nunca depende só da cor; sempre tem texto. */
export function BadgeStatus({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${CORES_STATUS[status] ?? ''}`}
    >
      {NOME_STATUS[status] ?? status}
    </span>
  )
}

export function Aviso({
  tipo = 'info',
  children,
}: {
  tipo?: 'erro' | 'ok' | 'info' | 'alerta'
  children: ReactNode
}) {
  const cores = {
    erro: 'border-red-300 bg-red-50 text-red-900',
    ok: 'border-green-300 bg-green-50 text-green-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    alerta: 'border-amber-300 bg-amber-50 text-amber-900',
  }
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`rounded-md border p-3 text-sm ${cores[tipo]}`}
    >
      {children}
    </div>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {children}
    </p>
  )
}

export function LinkBotao({
  href,
  children,
  variante = 'primario',
}: {
  href: string
  children: ReactNode
  variante?: 'primario' | 'secundario'
}) {
  const estilo =
    variante === 'primario'
      ? 'bg-slate-900 text-white hover:bg-slate-700'
      : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
  return (
    <Link href={href} className={`inline-block rounded-md px-3 py-2 text-sm font-medium ${estilo}`}>
      {children}
    </Link>
  )
}

export function Rotulo({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{nome}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}
