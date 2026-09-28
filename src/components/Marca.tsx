import { IconeSicei } from './SimboloSicei'

/**
 * Ícone + nome "SICEI" escrito na fonte da interface (Geist) e, embaixo, a licenciada em
 * maiúsculas. As duas linhas ocupam a altura do ícone: o topo do "SICEI" alinha com o topo do
 * ícone e a base da licenciada com a base dele.
 */
export function Marca({ licenciada }: { licenciada?: string | null }) {
  return (
    <span className="flex items-center gap-2.5">
      <IconeSicei className="size-9 shrink-0" />
      {licenciada ? (
        <span className="flex h-9 min-w-0 flex-col justify-between">
          <span className="-mt-[3px] text-[20px] leading-[20px] font-extrabold tracking-[0.02em] text-ink">
            SICEI
          </span>
          <span className="-mb-[2px] truncate text-[10px] leading-[12px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
            {licenciada}
          </span>
        </span>
      ) : (
        <span className="text-[20px] leading-none font-extrabold tracking-[0.02em] text-ink">
          SICEI
        </span>
      )}
    </span>
  )
}
