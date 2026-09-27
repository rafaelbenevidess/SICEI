import { ShieldX } from 'lucide-react'
import type { Metadata } from 'next'
import { TelaDeAcesso } from '@/components/TelaDeAcesso'
import { LinkBotao } from '@/components/ui'

export const metadata: Metadata = { title: 'Acesso negado' }

/** A permissão é conferida no servidor; esta página só explica a recusa. */
export default function SemPermissao() {
  return (
    <TelaDeAcesso>
      <span className="grid size-12 place-items-center rounded-xl bg-crit-soft text-crit-ink">
        <ShieldX aria-hidden className="size-6" />
      </span>
      <h1 className="mt-4 text-[30px] font-semibold tracking-tight">Acesso negado</h1>
      <p className="mt-1 text-ink-2">
        O seu perfil não tem permissão para abrir esta página. Se precisar dela, fale com o
        Administrador do sistema.
      </p>
      <div className="mt-6 [&>a]:h-12 [&>a]:w-full">
        <LinkBotao href="/painel">Voltar ao painel</LinkBotao>
      </div>
    </TelaDeAcesso>
  )
}
