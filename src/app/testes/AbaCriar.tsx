'use client'

import { useMemo, useState } from 'react'
import { conferirEsperado, SUITES, type CampoLab, type ResultadoFormulario } from '@/lab/suites'
import { chaveDaSuite, gravarMeusTestes, lerMeusTestes, type MeuTeste } from './meusTestes'

const suitesComFormulario = SUITES.filter((s) => s.formulario)

function valoresPadrao(chave: string): Record<string, string> {
  const s = suitesComFormulario.find((x) => chaveDaSuite(x) === chave)
  return Object.fromEntries((s?.formulario?.campos ?? []).map((c) => [c.nome, c.padrao ?? '']))
}

export function AbaCriar() {
  const [chave, setChave] = useState(chaveDaSuite(suitesComFormulario[0]))
  const [valores, setValores] = useState<Record<string, string>>(() => valoresPadrao(chave))
  const [esperado, setEsperado] = useState('')
  const [resultado, setResultado] = useState<ResultadoFormulario | null>(null)
  // a aba só é montada no navegador (depois de um clique), então ler o localStorage aqui é seguro
  const [meus, setMeus] = useState<MeuTeste[]>(lerMeusTestes)

  const suite = useMemo(() => suitesComFormulario.find((s) => chaveDaSuite(s) === chave)!, [chave])
  const form = suite.formulario!

  function trocarSuite(nova: string) {
    setChave(nova)
    setValores(valoresPadrao(nova))
    setEsperado('')
    setResultado(null)
  }

  function testar(e: React.FormEvent) {
    e.preventDefault()
    setResultado(form.executar(valores))
  }

  function salvar() {
    const lista = [...meus, { id: crypto.randomUUID(), suite: chave, valores, esperado }]
    setMeus(lista)
    gravarMeusTestes(lista)
  }

  function remover(id: string) {
    const lista = meus.filter((t) => t.id !== id)
    setMeus(lista)
    gravarMeusTestes(lista)
  }

  const passou =
    resultado !== null && esperado.trim() !== '' && conferirEsperado(resultado.resultado, esperado)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Escolha uma regra, informe as entradas e o resultado que você espera. O SICEI calcula com a
        função real e diz se o seu teste passou.
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Regra
        <select
          value={chave}
          onChange={(e) => trocarSuite(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-2 font-normal"
        >
          {suitesComFormulario.map((s) => (
            <option key={chaveDaSuite(s)} value={chaveDaSuite(s)}>
              {chaveDaSuite(s)}
            </option>
          ))}
        </select>
      </label>
      <p className="rounded-md bg-slate-50 p-2 text-sm text-slate-700">{suite.regra}</p>

      <form onSubmit={testar} className="grid gap-3 sm:grid-cols-2">
        {form.campos.map((c) => (
          <Campo
            key={`${chave}-${c.nome}`}
            campo={c}
            valor={valores[c.nome] ?? ''}
            onChange={(v) => setValores((atual) => ({ ...atual, [c.nome]: v }))}
          />
        ))}
        <Campo campo={form.esperado} valor={esperado} onChange={setEsperado} destaque />
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
          >
            Testar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={esperado.trim() === ''}
            className="rounded-md border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Salvar este teste
          </button>
        </div>
      </form>

      {resultado && (
        <div
          role="status"
          className={`rounded-md border p-3 ${
            esperado.trim() === ''
              ? 'border-slate-300 bg-slate-50'
              : passou
                ? 'border-green-300 bg-green-50'
                : 'border-red-300 bg-red-50'
          }`}
        >
          <p className="font-medium">
            {esperado.trim() === ''
              ? 'Resultado calculado'
              : passou
                ? '✅ Seu teste passou'
                : '❌ Seu teste falhou'}
          </p>
          <p className="text-sm">
            obtido: <code>{resultado.resultado}</code>
            {esperado.trim() !== '' && (
              <>
                {' '}
                · esperado: <code>{esperado}</code>
              </>
            )}
          </p>
          <p className="text-sm text-slate-600">{resultado.explicacao}</p>
        </div>
      )}

      {meus.length > 0 && (
        <div>
          <h2 className="mb-2 font-medium">Seus testes salvos ({meus.length})</h2>
          <p className="mb-2 text-sm text-slate-500">
            Eles rodam junto com os oficiais em “Executar todos”.
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {meus.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <span className="flex-1">
                  {t.suite} → esperado <code>{t.esperado}</code>
                </span>
                <button onClick={() => remover(t.id)} className="text-red-700 underline">
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Campo({
  campo,
  valor,
  onChange,
  destaque,
}: {
  campo: CampoLab
  valor: string
  onChange: (v: string) => void
  destaque?: boolean
}) {
  const classe = `rounded-md border px-2 py-2 font-normal ${destaque ? 'border-blue-400' : 'border-slate-300'}`
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {campo.rotulo}
      {campo.tipo === 'opcoes' ? (
        <select value={valor} onChange={(e) => onChange(e.target.value)} className={classe}>
          {destaque && <option value="">escolha…</option>}
          {campo.opcoes!.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          inputMode={campo.tipo === 'numero' ? 'decimal' : 'text'}
          className={classe}
        />
      )}
      {campo.ajuda && <span className="text-xs font-normal text-slate-500">{campo.ajuda}</span>}
    </label>
  )
}
