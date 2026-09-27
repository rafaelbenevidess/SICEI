import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Cartao, Pagina } from '@/components/ui'
import { detalheMovimentacao } from '@/server/consultas/movimentacoes'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { PainelMovimentacao } from '../PainelMovimentacao'

export const metadata: Metadata = { title: 'Movimentação' }

/** Detalhe de uma movimentação em página própria (links diretos e celular). */
export default async function PaginaMovimentacao({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirPermissaoDaPagina('historico:ver')
  const { id } = await params
  const m = await detalheMovimentacao(id)
  if (!m) notFound()
  return (
    <Pagina
      antes={
        <Link
          href="/movimentacoes"
          className="inline-flex items-center gap-1.5 text-ink-3 no-underline"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Movimentações
        </Link>
      }
      titulo="Movimentação"
    >
      <div className="max-w-xl">
        <Cartao>
          <PainelMovimentacao m={m} perfil={u.perfil} />
        </Cartao>
      </div>
    </Pagina>
  )
}
