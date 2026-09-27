import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { lerCodigoDaPosicao } from '@/domain/posicao'
import { Pagina, Vazio } from '@/components/ui'
import { nomeDaPastilha } from '@/lib/formatar'
import { posicoesOcupadas } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { FolhaDeEtiquetas } from './FolhaDeEtiquetas'

export const metadata: Metadata = { title: 'Etiquetas QR' }

/** RF-22 / RN-26: etiquetas para a frente dos compartimentos. O QR aponta para a posição, não para o item. */
export default async function Etiquetas({
  searchParams,
}: {
  searchParams: Promise<{ codigos?: string }>
}) {
  await exigirPermissaoDaPagina('etiquetas:imprimir')
  const { codigos = '' } = await searchParams
  const pedidos = codigos
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c) => lerCodigoDaPosicao(c) !== null)
  const posicoes = await posicoesOcupadas()
  const base = process.env.APP_URL ?? ''
  const etiquetas = await Promise.all(
    posicoes.map(async (p) => ({
      codigo: p.codigo,
      itemCodigo: p.item!.codigo,
      nome: nomeDaPastilha(p.item!),
      // SVG gerado no servidor pela biblioteca qrcode, a partir de um código de posição do banco
      svg: await QRCode.toString(`${base}/p/${p.codigo}`, {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
      }),
    })),
  )
  const inicial = pedidos.length
    ? etiquetas.filter((e) => pedidos.includes(e.codigo)).map((e) => e.codigo)
    : etiquetas.map((e) => e.codigo)

  return (
    <Pagina
      titulo="Etiquetas QR"
      descricao="Uma etiqueta por posição ocupada. O QR aponta para a posição: ler com a câmera abre o item."
    >
      {etiquetas.length === 0 ? (
        <Vazio>Nenhuma posição ocupada. Atribua itens às posições em Cadastros.</Vazio>
      ) : (
        <FolhaDeEtiquetas etiquetas={etiquetas} inicial={inicial} />
      )}
    </Pagina>
  )
}
