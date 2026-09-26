import Link from 'next/link'
import { redirect } from 'next/navigation'
import { lerCodigoDaPosicao } from '@/domain/posicao'
import { itemDaPosicao } from '@/server/consultas/cadastros'
import { usuarioAtual } from '@/server/web/sessao-atual'

/** Destino do QR da etiqueta (RN-26): resolve a posição e abre o item que está nela. */
export default async function QrDaPosicao({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params
  const u = await usuarioAtual()
  if (!u) redirect(`/login?volta=${encodeURIComponent(`/p/${codigo}`)}`)
  const cod = codigo.toUpperCase()
  const posicao = lerCodigoDaPosicao(cod) ? await itemDaPosicao(cod) : null
  if (posicao?.itemId) redirect(`/itens/${posicao.itemId}`)
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Posição {cod}</h1>
      <p className="text-slate-600">
        {posicao ? 'Esta posição está vazia.' : 'Posição não encontrada.'}
      </p>
      <Link href="/itens" className="underline">
        Ir para os itens
      </Link>
    </main>
  )
}
