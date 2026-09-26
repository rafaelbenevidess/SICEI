'use client'

import { useState } from 'react'
import { conferirEsperado, executarCaso, SUITES, type ResultadoCaso } from '@/lab/suites'
import { chaveDaSuite, lerMeusTestes } from './meusTestes'

type Resultados = Record<string, ResultadoCaso[]>

export function AbaExecutar() {
  const [resultados, setResultados] = useState<Resultados>({})
  const [rodando, setRodando] = useState(false)
  const [duracao, setDuracao] = useState<number | null>(null)

  async function executar(chaves: string[]) {
    setRodando(true)
    const inicio = performance.now()
    const novos: Resultados = {}
    for (const suite of SUITES) {
      const chave = chaveDaSuite(suite)
      if (!chaves.includes(chave)) continue
      novos[chave] = await Promise.all(suite.casos.map((c) => executarCaso(suite, c)))
    }
    if (chaves.includes('meus')) {
      novos.meus = lerMeusTestes().flatMap((t) => {
        const suite = SUITES.find((s) => chaveDaSuite(s) === t.suite)
        if (!suite?.formulario) return []
        const r = suite.formulario.executar(t.valores)
        return [
          {
            descricao: `${t.suite}: ${Object.entries(t.valores)
              .map(([k, v]) => `${k}=${v || '∅'}`)
              .join(', ')}`,
            passou: conferirEsperado(r.resultado, t.esperado),
            esperado: t.esperado,
            obtido: r.resultado,
          },
        ]
      })
    }
    setResultados((atual) => ({ ...atual, ...novos }))
    setDuracao(performance.now() - inicio)
    setRodando(false)
  }

  const todas = [...SUITES.map(chaveDaSuite), 'meus']
  const lista = Object.values(resultados).flat()
  const passaram = lista.filter((r) => r.passou).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => executar(todas)}
          disabled={rodando}
          className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {rodando ? 'Executando…' : 'Executar todos'}
        </button>
        {lista.length > 0 && (
          <p role="status" className="text-sm">
            <strong className={passaram === lista.length ? 'text-green-700' : 'text-red-700'}>
              {passaram} de {lista.length} passaram
            </strong>
            {duracao !== null && (
              <span className="text-slate-500"> em {duracao.toFixed(0)} ms</span>
            )}
          </p>
        )}
      </div>

      {SUITES.map((suite) => {
        const chave = chaveDaSuite(suite)
        const rs = resultados[chave]
        return (
          <details
            key={chave}
            className="rounded-md border border-slate-200"
            open={rs?.some((r) => !r.passou)}
          >
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">{suite.id}</span>
              <span className="font-medium">{suite.titulo}</span>
              <span className="text-sm text-slate-500">({suite.casos.length} casos)</span>
              {rs && (
                <span
                  className={`text-sm font-medium ${rs.every((r) => r.passou) ? 'text-green-700' : 'text-red-700'}`}
                >
                  {rs.filter((r) => r.passou).length}/{rs.length} ✓
                </span>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  executar([chave])
                }}
                className="ml-auto rounded border border-slate-300 px-2 py-0.5 text-sm hover:bg-slate-50"
              >
                Executar este grupo
              </button>
            </summary>
            <div className="border-t border-slate-200 px-3 py-2">
              <p className="mb-2 text-sm text-slate-600">{suite.regra}</p>
              <TabelaResultados casos={suite.casos.map((c) => c.descricao)} resultados={rs} />
            </div>
          </details>
        )
      })}

      {resultados.meus && (
        <div className="rounded-md border border-slate-200 p-3">
          <h2 className="mb-2 font-medium">Seus testes</h2>
          {resultados.meus.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum teste criado ainda. Use a aba 2.</p>
          ) : (
            <TabelaResultados
              casos={resultados.meus.map((r) => r.descricao)}
              resultados={resultados.meus}
            />
          )}
        </div>
      )}
    </div>
  )
}

function TabelaResultados({
  casos,
  resultados,
}: {
  casos: string[]
  resultados?: ResultadoCaso[]
}) {
  return (
    <ul className="flex flex-col gap-1">
      {casos.map((descricao, i) => {
        const r = resultados?.[i]
        return (
          <li key={i} className="text-sm">
            <span aria-hidden className="mr-1">
              {r ? (r.passou ? '✅' : '❌') : '⚪'}
            </span>
            <span className="sr-only">
              {r ? (r.passou ? 'passou' : 'falhou') : 'não executado'}:{' '}
            </span>
            {descricao}
            {r && (
              <span className="block pl-6 text-xs text-slate-500">
                esperado: <code>{r.esperado}</code> · obtido: <code>{r.obtido}</code>
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
