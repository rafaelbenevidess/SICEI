'use client'

import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Bell,
  ChartLine,
  ChevronRight,
  FileChartColumn,
  FlaskConical,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  QrCode,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Upload,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { avisoJaVisto, mostrarAvisoDeAlertas } from '@/lib/avisoDeAlertas'
import type { Tema } from '@/lib/tema'
import { Avatar, classeBotao } from '../ui'
import { Marca } from '../Marca'
import { AvisoDeAlertas } from './AvisoDeAlertas'
import { BuscaDoTopo } from './BuscaDoTopo'
import { BotaoTema } from './BotaoTema'
import { hrefAtivo, trilha, type GrupoMenu, type NomeIcone } from './menu'

const ICONES: Record<NomeIcone, LucideIcon> = {
  painel: LayoutDashboard,
  itens: Package,
  movimentacoes: ArrowLeftRight,
  alertas: Bell,
  sugestao: ShoppingCart,
  entrada: ArrowDownToLine,
  saida: ArrowUpFromLine,
  relatorios: FileChartColumn,
  analise: ChartLine,
  cadastros: FolderOpen,
  etiquetas: QrCode,
  usuarios: Users,
  auditoria: ShieldCheck,
  parametros: SlidersHorizontal,
  importacao: Upload,
}

interface Props {
  grupos: GrupoMenu[]
  usuario: { nome: string; detalhe: string }
  alertas: number
  /** RF-13: alertas sem ciente a anunciar no pop-up (0 = sem pop-up) */
  alertasSemCiente?: number
  licenciada: string | null
  tema: Tema
  podeRegistrarSaida: boolean
  acaoSair: () => Promise<void>
  rodape: ReactNode
  children: ReactNode
}

/** Estrutura das páginas logadas: menu lateral, topo, conteúdo e rodapé (handoff, "Shell"). */
export function Shell({
  grupos,
  usuario,
  alertas,
  alertasSemCiente = 0,
  licenciada,
  tema,
  podeRegistrarSaida,
  acaoSair,
  rodape,
  children,
}: Props) {
  const caminho = usePathname()
  // RF-13: o menu não é recarregado a cada clique; por isso a tela guarda que a pessoa já
  // passou pelos alertas e o aviso só volta no próximo login
  const [alertasVistos, setAlertasVistos] = useState(false)
  if (avisoJaVisto(alertasVistos, caminho) !== alertasVistos) setAlertasVistos(true)
  const parametros = useSearchParams()
  const [gaveta, setGaveta] = useState(false)
  const ativo = hrefAtivo(
    grupos.flatMap((g) => g.itens.map((i) => i.href)),
    caminho,
    parametros,
  )
  const onde = trilha(grupos, caminho, parametros)

  // a gaveta fecha ao trocar de página
  const [caminhoDaGaveta, setCaminhoDaGaveta] = useState(caminho)
  if (caminhoDaGaveta !== caminho) {
    setCaminhoDaGaveta(caminho)
    setGaveta(false)
  }

  const menu = (
    <div className="flex h-full flex-col gap-4 px-3.5 pt-5 pb-4">
      <div className="flex items-center justify-between px-2">
        <Link href="/painel" className="no-underline" aria-label="SICEI, ir para o painel">
          <Marca licenciada={licenciada} />
        </Link>
        <button
          type="button"
          onClick={() => setGaveta(false)}
          aria-label="Fechar menu"
          className="inline-flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2 md:hidden"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav aria-label="Menu principal" className="-mx-1 flex-1 overflow-y-auto px-1">
        {grupos.map((g) => (
          <div key={g.titulo} className="mb-3">
            <p className="mb-1.5 px-2.5 text-[11px] font-medium tracking-[0.07em] text-ink-3 uppercase">
              {g.titulo}
            </p>
            <ul className="flex flex-col gap-0.5">
              {g.itens.map((i) => {
                const Icone = ICONES[i.icone]
                const eh = i.href === ativo
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      aria-current={eh ? 'page' : undefined}
                      className={`flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 no-underline ${eh ? 'bg-surface-3 font-semibold text-ink' : 'font-medium text-ink-2 hover:bg-surface-2 hover:text-ink'}`}
                    >
                      <Icone
                        aria-hidden
                        className={`size-[17px] shrink-0 ${eh ? 'text-accent' : 'text-ink-3'}`}
                      />
                      <span className="flex-1 truncate">{i.rotulo}</span>
                      {i.icone === 'alertas' && alertas > 0 && (
                        <span className="rounded-[10px] bg-crit-soft px-1.5 text-xs font-semibold text-crit-ink">
                          {alertas}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        <Link
          href="/testes"
          className="flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 font-medium text-ink-3 no-underline hover:bg-surface-2 hover:text-ink"
        >
          <FlaskConical aria-hidden className="size-[17px]" />
          Laboratório de testes
        </Link>
      </nav>
      <div className="border-t border-line pt-3.5">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar nome={usuario.nome} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{usuario.nome}</p>
            <p className="truncate text-xs text-ink-3">{usuario.detalhe}</p>
          </div>
          <BotaoTema inicial={tema} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/trocar-senha" className={`${classeBotao('secundario', true)} w-full`}>
            <KeyRound aria-hidden />
            Senha
          </Link>
          <form action={acaoSair}>
            <button type="submit" className={`${classeBotao('secundario', true)} w-full`}>
              <LogOut aria-hidden />
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[252px_minmax(0,1fr)] print:block">
      <aside className="nao-imprimir sticky top-0 hidden h-dvh border-r border-line bg-surface md:block">
        {menu}
      </aside>

      {gaveta && (
        <div className="nao-imprimir fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setGaveta(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 w-[284px] max-w-[85vw] bg-surface shadow-pop">
            {menu}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="nao-imprimir sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-[color-mix(in_oklch,var(--bg)_88%,transparent)] px-4 backdrop-blur-[10px] md:px-10">
          <button
            type="button"
            onClick={() => setGaveta(true)}
            aria-label="Abrir menu"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2 md:hidden"
          >
            <Menu className="size-5" />
          </button>
          {onde && (
            <p className="hidden shrink-0 items-center gap-2 text-[13px] text-ink-3 min-[65rem]:flex">
              {onde.grupo}
              <ChevronRight aria-hidden className="size-3.5" />
              <span className="text-ink">{onde.tela}</span>
            </p>
          )}
          <div className="flex flex-1 justify-end gap-2.5">
            <BuscaDoTopo />
            <Link
              href="/alertas"
              className={`${classeBotao('secundario')} h-[38px] max-sm:px-3`}
              aria-label={`${alertas} ${alertas === 1 ? 'alerta aberto' : 'alertas abertos'}`}
            >
              <Bell aria-hidden className={alertas > 0 ? 'text-crit' : ''} />
              {alertas}
              <span className="max-sm:hidden">{alertas === 1 ? 'alerta' : 'alertas'}</span>
            </Link>
            {podeRegistrarSaida && (
              <Link
                href="/movimentacoes/nova?modo=saida"
                className={`${classeBotao('primario')} h-[38px] max-sm:hidden`}
              >
                <ArrowUpFromLine aria-hidden />
                Registrar saída
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-24 md:px-10 md:pt-8 md:pb-14">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
        <div className="max-md:pb-16">{rodape}</div>
      </div>

      <nav
        aria-label="Atalhos"
        className="nao-imprimir fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-line bg-surface md:hidden"
      >
        {[
          { href: '/painel', rotulo: 'Painel', Icone: LayoutDashboard },
          { href: '/itens', rotulo: 'Itens', Icone: Package },
          { href: '/p', rotulo: 'Ler QR', Icone: ScanLine },
          { href: '/alertas', rotulo: 'Alertas', Icone: Bell },
        ].map(({ href, rotulo, Icone }) => {
          const eh = caminho === href || caminho.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={eh ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium no-underline ${eh ? 'text-accent' : 'text-ink-3'}`}
            >
              <span className="relative">
                <Icone aria-hidden className="size-5" />
                {href === '/alertas' && alertas > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 rounded-full bg-crit px-1 text-[10px] leading-4 font-semibold text-white">
                    {alertas}
                  </span>
                )}
              </span>
              {rotulo}
            </Link>
          )
        })}
      </nav>

      {mostrarAvisoDeAlertas({
        marcado: alertasSemCiente > 0 && !alertasVistos,
        podeDarCiente: true,
        semCiente: alertasSemCiente,
        caminho,
      }) && <AvisoDeAlertas semCiente={alertasSemCiente} />}
    </div>
  )
}
