import type { Metadata } from 'next'
import Link from 'next/link'
import { totalDeCasos, SUITES } from '@/lab/suites'
import { Laboratorio } from './Laboratorio'

export const metadata: Metadata = {
  title: 'Laboratório de testes',
  description: 'Execute os testes das regras de negócio do SICEI e crie os seus próprios casos.',
}

export default function PaginaTestes() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm text-slate-500">
          <Link href="/" className="underline">
            SICEI
          </Link>{' '}
          · RNF-13
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Laboratório de testes</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Os testes abaixo rodam no seu navegador e chamam as mesmas funções que o SICEI usa. São{' '}
          {totalDeCasos()} casos em {SUITES.length} grupos, os mesmos que a integração contínua
          executa a cada versão. Cada grupo leva o número da regra de negócio (RN) que verifica.
        </p>
        <p className="mt-2 text-sm">
          <a href="/relatorio-testes/index.html" className="font-medium text-blue-700 underline">
            Relatório completo da suíte com cobertura
          </a>{' '}
          <span className="text-slate-500">(gerado a cada publicação do sistema)</span>
        </p>
      </header>
      <Laboratorio />
    </main>
  )
}
