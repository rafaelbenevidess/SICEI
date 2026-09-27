import Image from 'next/image'
import type { ReactNode } from 'react'
import { anosDeDireitos, licenciada, PRODUTO } from '@/lib/produto'
import { Marca } from './Marca'

/**
 * Moldura do login e da troca de senha: formulário à esquerda e painel da marca à direita
 * (o painel some abaixo de 1040 px).
 */
export function TelaDeAcesso({ children }: { children: ReactNode }) {
  const empresa = licenciada()
  return (
    <div className="grid min-h-dvh min-[65rem]:grid-cols-2">
      <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-14 sm:py-10">
        <Marca />
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px]">{children}</div>
        </main>
        <footer className="text-xs text-ink-3">
          {PRODUTO.sigla} © {anosDeDireitos(new Date().getFullYear())} {PRODUTO.titular}
          {empresa && <> · Licenciado para {empresa}</>}
          {' · '}
          <span className="sr-only">Contato comercial: </span>
          <a href={`mailto:${PRODUTO.contatoComercial}`}>{PRODUTO.contatoComercial}</a>
        </footer>
      </div>
      <aside
        aria-hidden
        className="relative hidden flex-col justify-between overflow-hidden bg-[#131a2a] p-14 text-white min-[65rem]:flex"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.06) 1px, transparent 1px)',
          backgroundSize: '56px 40px',
        }}
      >
        <Image
          src="/brand/sicei-logo-escuro-2.png"
          alt=""
          width={575}
          height={169}
          className="h-14 w-auto self-start"
          priority
        />
        <div className="max-w-[460px]">
          <p className="font-mono text-xs tracking-wide text-[#8fb0ff]">A01-G03-C04 · PT-0012</p>
          <p className="mt-3 text-[34px] leading-[1.15] font-semibold tracking-tight">
            {PRODUTO.nome}
          </p>
          <p className="mt-4 text-[15px] text-white/75">
            Cada entrada e saída registrada na hora, saldo sempre atualizado e aviso antes de a
            pastilha acabar.
          </p>
        </div>
      </aside>
    </div>
  )
}
