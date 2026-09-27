import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LinkBotao, Pagina, Vazio } from '@/components/ui'
import { interpretarCodigoDePosicao } from '@/domain/posicao'
import { itemDaPosicao } from '@/server/consultas/cadastros'
import { exigirUsuario } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Posição' }

/** Destino do QR da etiqueta (RN-26): resolve a posição e abre o item que está nela. */
export default async function QrDaPosicao({ params }: { params: Promise<{ codigo: string }> }) {
  await exigirUsuario()
  const { codigo } = await params
  const digitado = decodeURIComponent(codigo)
  const padrao = interpretarCodigoDePosicao(digitado)
  // /p/a1g3c4 vira /p/A01-G03-C04, o mesmo endereço do QR impresso
  if (padrao && padrao !== digitado) redirect(`/p/${padrao}`)
  const cod = padrao ?? digitado.toUpperCase()
  const posicao = padrao ? await itemDaPosicao(padrao) : null
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
