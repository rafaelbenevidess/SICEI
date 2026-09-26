import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { lerCodigoDaPosicao } from '@/domain/posicao'
import { BotaoImprimir } from '@/components/BotaoImprimir'
import { Pagina, Vazio } from '@/components/ui'
import { etiquetasDasPosicoes } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Etiquetas QR' }

/** RF-22 / RN-26: etiquetas para a frente dos compartimentos. O QR aponta para a posição, não para o item. */
export default async function Etiquetas({
  searchParams,
}: {
  searchParams: Promise<{ codigos?: string }>
}) {
  await exigirPermissaoDaPagina('etiquetas:imprimir')
  const { codigos = '' } = await searchParams
  const validos = codigos
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c) => lerCodigoDaPosicao(c) !== null)
    .slice(0, 200)
  const posicoes = await etiquetasDasPosicoes(validos)
  const base = process.env.APP_URL ?? ''
  const etiquetas = await Promise.all(
    posicoes.map(async (p) => ({
      ...p,
      svg: await QRCode.toString(`${base}/p/${p.codigo}`, {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
      }),
    })),
  )
  return (
    <Pagina
      titulo="Etiquetas QR"
      descricao="Imprima em A4 e cole na frente de cada compartimento."
      acoes={<BotaoImprimir />}
    >
      {etiquetas.length === 0 ? (
        <Vazio>Nenhuma posição ocupada selecionada.</Vazio>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 print:grid-cols-3 print:gap-2">
          {etiquetas.map((e) => (
            <div
              key={e.codigo}
              className="flex items-center gap-3 rounded border border-slate-400 bg-white p-3 break-inside-avoid"
            >
              {/* SVG gerado no servidor pela biblioteca qrcode, a partir de um código validado */}
              <div
                className="w-24 shrink-0"
                dangerouslySetInnerHTML={{ __html: e.svg }}
                aria-label={`QR da posição ${e.codigo}`}
                role="img"
              />
              <div className="min-w-0 text-sm">
                <p className="font-mono text-lg font-bold">{e.codigo}</p>
                <p className="font-semibold">{e.item?.codigo}</p>
                <p className="text-xs leading-tight">{e.item?.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Pagina>
  )
}
