import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LinkBotao, Pagina, Vazio } from '@/components/ui'
import { lerCodigoDaPosicao } from '@/domain/posicao'
import { itemDaPosicao } from '@/server/consultas/cadastros'
import { exigirUsuario } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Posição' }

/** Destino do QR da etiqueta (RN-26): resolve a posição e abre o item que está nela. */
export default async function QrDaPosicao({ params }: { params: Promise<{ codigo: string }> }) {
  await exigirUsuario()
  const { codigo } = await params
  const cod = decodeURIComponent(codigo).toUpperCase()
  const posicao = lerCodigoDaPosicao(cod) ? await itemDaPosicao(cod) : null
  if (posicao?.itemId) redirect(`/itens/${posicao.itemId}?qr=${encodeURIComponent(cod)}`)
  return (
    <Pagina titulo={`Posição ${cod}`}>
      <Vazio>
        {posicao
          ? 'Esta posição está vazia. Nenhum item foi atribuído a ela.'
          : 'Posição não encontrada. Confira o código da etiqueta.'}
      </Vazio>
      <div className="flex flex-wrap gap-2">
        <LinkBotao href="/p" variante="secundario">
          Ler outra etiqueta
        </LinkBotao>
        <LinkBotao href="/itens">Ir para os itens</LinkBotao>
      </div>
    </Pagina>
  )
}
