import { IconeSicei } from './SimboloSicei'

/**
 * Ícone + nome "SICEI" escrito na fonte da interface (Geist), e embaixo a licenciada.
 * O nome é texto de verdade: nítido em qualquer tela e com a cor do tema.
 */
export function Marca({ licenciada }: { licenciada?: string | null }) {
  return (
    <span className="flex items-center gap-2.5">
      <IconeSicei className="size-8 shrink-0" />
      <span className="flex min-w-0 flex-col justify-center gap-1">
        <span className="text-[17px] leading-none font-extrabold tracking-[0.02em] text-ink">
          SICEI
        </span>
        {licenciada && (
          <span className="truncate text-xs leading-none text-ink-3">{licenciada}</span>
        )}
      </span>
    </span>
  )
}
