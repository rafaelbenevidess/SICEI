import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LeitorQr } from '@/components/LeitorQr'
import { Pagina } from '@/components/ui'
import { lerCodigoDaPosicao } from '@/domain/posicao'
import { exigirUsuario } from '@/server/web/sessao-atual'

export const metadata: Metadata = { title: 'Ler QR' }

const campo =
  'h-12 w-full min-w-0 rounded-lg border border-line-2 bg-surface px-3 font-mono text-base uppercase text-ink placeholder:text-ink-3 placeholder:normal-case'

/**
 * RN-26: "Ler QR" abre a câmera dentro do SICEI e lê a etiqueta da gaveta. Se a etiqueta
 * estiver apagada ou o aparelho não tiver câmera, o código pode ser digitado.
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
      <div className="flex flex-col gap-4 sm:max-w-xl">
        <LeitorQr autoIniciar={!invalido} />
        <section className="flex flex-col gap-5 rounded-[14px] border border-line bg-surface p-5 shadow-cartao">
          <form action="/p" className="flex flex-col gap-2">
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
        <p className="text-xs text-ink-3">
          A câmera do próprio celular também lê a etiqueta: o QR abre o item direto no SICEI.
        </p>
      </div>
    </Pagina>
  )
}
