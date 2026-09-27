import type { Metadata } from 'next'
import { ScanLine } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Pagina } from '@/components/ui'
import { lerCodigoDaPosicao } from '@/domain/posicao'
import { exigirUsuario } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Ler QR' }

const campo =
  'h-12 w-full min-w-0 rounded-lg border border-line-2 bg-surface px-3 font-mono text-base uppercase text-ink placeholder:text-ink-3 placeholder:normal-case'

/**
 * RN-26: a etiqueta é lida pela câmera nativa do celular, que abre /p/<código>.
 * Aqui fica a orientação e, se a etiqueta estiver apagada, o código digitado.
 */
export default async function LerQr({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>
}) {
  await exigirUsuario()
  const { codigo } = await searchParams
  const cod = codigo?.trim().toUpperCase() ?? ''
  if (cod && lerCodigoDaPosicao(cod)) redirect(`/p/${encodeURIComponent(cod)}`)
  const invalido = cod !== ''

  return (
    <Pagina titulo="Ler etiqueta QR">
      <section className="flex flex-col gap-5 rounded-[14px] border border-line bg-surface p-5 shadow-cartao sm:max-w-xl">
        <div className="flex gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
            <ScanLine aria-hidden className="size-[22px]" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold">Use a câmera do celular</h2>
            <p className="mt-0.5 text-[13px] text-ink-2">
              Aponte a câmera para a etiqueta na frente do compartimento. O QR abre o item direto no
              SICEI, sem instalar aplicativo.
            </p>
          </div>
        </div>
        <form action="/p" className="flex flex-col gap-2 border-t border-line pt-5">
          <label htmlFor="codigo-posicao" className="text-[13px] font-medium">
            Etiqueta apagada? Digite o código da posição
          </label>
          <div className="flex gap-2">
            <input
              id="codigo-posicao"
              name="codigo"
              defaultValue={codigo}
              placeholder="A01-G03-C04"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={invalido || undefined}
              aria-describedby={invalido ? 'codigo-erro' : undefined}
              className={campo}
            />
            <button className="h-12 shrink-0 rounded-lg bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover">
              Abrir
            </button>
          </div>
          {invalido && (
            <p id="codigo-erro" role="alert" className="text-[13px] text-crit-ink">
              Use o formato armário-gaveta-compartimento, por exemplo A01-G03-C04.
            </p>
          )}
        </form>
      </section>
    </Pagina>
  )
}
