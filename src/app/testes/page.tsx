import type { Metadata } from 'next'
import Link from 'next/link'
import { Marca } from '@/components/Marca'
import { Rodape } from '@/components/Rodape'
import { totalDeCasos, SUITES } from '@/lab/suites'
import { licenciada } from '@/lib/produto'
import { Laboratorio } from './Laboratorio'

export const metadata: Metadata = {
  title: 'Laboratório de testes',
  description: 'Execute os testes das regras de negócio do SICEI e crie os seus próprios casos.',
}

/** RNF-13: o avaliador executa os testes das regras no navegador, sem instalar nada. */
export default function PaginaTestes() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-4 py-3 md:px-10">
        <Link href="/" aria-label="SICEI, página inicial" className="no-underline">
          <Marca />
        </Link>
        <Link href="/login" className="text-sm font-medium">
          Entrar no sistema
        </Link>
      </div>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <header className="mb-6">
          <p className="text-sm text-ink-3">RNF-13</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight sm:text-3xl">
            Laboratório de testes
          </h1>
          <p className="mt-2 max-w-3xl text-ink-2">
            Os testes abaixo rodam no seu navegador e chamam as mesmas funções que o SICEI usa. São{' '}
            {totalDeCasos()} casos em {SUITES.length} grupos, os mesmos que a integração contínua
            executa a cada versão. Cada grupo leva o número da regra de negócio (RN) que verifica.
          </p>
          <p className="mt-2 text-sm">
            {/* relatório estático em public/, gerado no build: não é uma rota do Next */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/relatorio-testes/index.html"
              className="font-medium text-accent-ink underline"
            >
              Relatório completo da suíte com cobertura
            </a>{' '}
            <span className="text-ink-3">(gerado a cada publicação do sistema)</span>
          </p>
        </header>
        <Laboratorio />
      </main>
      <Rodape anoAtual={new Date().getFullYear()} licenciada={licenciada()} />
    </div>
  )
}
