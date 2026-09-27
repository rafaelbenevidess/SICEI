import Image from 'next/image'

/** Ícone + nome "SICEI" (a imagem do nome troca conforme o tema) e, embaixo, a licenciada. */
export function Marca({ licenciada }: { licenciada?: string | null }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/brand/sicei-icon.png"
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-lg"
        priority
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <Image
          src="/brand/sicei-wordmark-escuro.png"
          alt="SICEI"
          width={50}
          height={14}
          className="h-3.5 w-auto escuro:hidden"
          priority
        />
        <Image
          src="/brand/sicei-wordmark-claro.png"
          alt="SICEI"
          width={47}
          height={14}
          className="hidden h-3.5 w-auto escuro:block"
          priority
        />
        {licenciada && <span className="truncate text-xs text-ink-3">{licenciada}</span>}
      </span>
    </span>
  )
}
