import Image from 'next/image'
import type { ReactNode } from 'react'
import { anosDeDireitos, licenciada, logoDaLicenciada, PRODUTO } from '@/lib/produto'
import { Marca } from './Marca'
import { SimboloSicei } from './SimboloSicei'

/**
 * Moldura do login e da troca de senha: formulário à esquerda e painel da marca à direita
 * (o painel some abaixo de 1040 px). Com `comLogoDaLicenciada` (só no login), a logo da empresa
 * que licencia esta instalação aparece acima do formulário e no centro do painel.
 */
export function TelaDeAcesso({
  children,
  comLogoDaLicenciada = false,
}: {
  children: ReactNode
  comLogoDaLicenciada?: boolean
}) {
  const empresa = licenciada()
  const logo = comLogoDaLicenciada ? logoDaLicenciada(empresa) : null
  return (
    <div className="grid min-h-dvh min-[65rem]:grid-cols-2">
      <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-14 sm:py-10">
        <Marca />
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px]">
            {logo && (
              <Image
                src={logo.src}
                alt={empresa ?? ''}
                width={logo.largura}
                height={logo.altura}
                priority
                className="mx-auto mb-8 h-auto w-[220px] max-w-full"
              />
            )}
            {children}
          </div>
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
        <span className="flex items-center gap-4 self-start">
          <SimboloSicei className="h-14 w-auto text-[#3d6bff]" />
          <span className="text-[44px] leading-none font-extrabold tracking-[0.02em]">SICEI</span>
        </span>
        {logo && (
          <div className="flex flex-1 items-center justify-center py-10">
            <Image
              src={logo.src}
              alt=""
              width={logo.largura}
              height={logo.altura}
              className="h-auto w-[320px] max-w-full"
            />
          </div>
        )}
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
