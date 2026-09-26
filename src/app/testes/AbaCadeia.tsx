'use client'

import { useEffect, useState } from 'react'
import {
  calcularHash,
  encadear,
  verificarCadeia,
  type RegistroEncadeado,
  type ResultadoVerificacao,
} from '@/domain/auditoria'
import { registrosDeExemplo } from '@/domain/auditoria.casos'

type Registro = RegistroEncadeado<Record<string, unknown>>

export function AbaCadeia() {
  const [original, setOriginal] = useState<Registro[]>([])
  const [cadeia, setCadeia] = useState<Registro[]>([])
  const [resultado, setResultado] = useState<ResultadoVerificacao | null>(null)

  useEffect(() => {
    encadear(registrosDeExemplo).then((c) => {
      setOriginal(c)
      setCadeia(c)
    })
  }, [])

  function alterar(i: number, campo: string, texto: string) {
    const numero = Number(texto)
    const valor = texto.trim() !== '' && Number.isFinite(numero) ? numero : texto
    setCadeia((c) =>
      c.map((r, j) => (j === i ? { ...r, dados: { ...r.dados, [campo]: valor } } : r)),
    )
    setResultado(null)
  }

  async function recalcularHash(i: number) {
    const r = cadeia[i]
    const hash = await calcularHash(r.prevHash, r.seq, r.dados)
    setCadeia((c) => c.map((x, j) => (j === i ? { ...x, hash } : x)))
    setResultado(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Estes são 5 registros de auditoria encadeados (RN-09a). Cada um guarda o hash SHA-256 do
        anterior. Altere qualquer valor, como a quantidade do registro 2, e clique em “Verificar
        integridade”. Tente também “recalcular o hash” do registro alterado, como faria um
        fraudador: a quebra aparece no registro seguinte.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={async () => setResultado(await verificarCadeia(cadeia))}
          className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
        >
          Verificar integridade
        </button>
        <button
          onClick={() => {
            setCadeia(original)
            setResultado(null)
          }}
          className="rounded-md border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50"
        >
          Restaurar original
        </button>
      </div>
      {resultado && (
        <p
          role="status"
          className={`rounded-md border p-3 font-medium ${
            resultado.integra
              ? 'border-green-300 bg-green-50 text-green-800'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          {resultado.integra
            ? `✅ Cadeia íntegra: ${resultado.verificados} registros conferidos.`
            : `❌ Adulteração detectada no registro ${resultado.seq}: ${resultado.motivo}`}
        </p>
      )}
      <ol className="flex flex-col gap-3">
        {cadeia.map((r, i) => {
          const quebrado = resultado && !resultado.integra && resultado.seq === r.seq
          return (
            <li
              key={r.seq}
              className={`rounded-md border p-3 ${quebrado ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            >
              <p className="mb-2 font-mono text-sm font-bold">Registro {r.seq}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {Object.entries(r.dados).map(([campo, valor]) => (
                  <label key={campo} className="flex flex-col text-xs font-medium text-slate-600">
                    {campo}
                    <input
                      value={String(valor)}
                      onChange={(e) => alterar(i, campo, e.target.value)}
                      aria-label={`registro ${r.seq}, ${campo}`}
                      className="rounded border border-slate-300 px-2 py-1 font-mono text-sm text-slate-900"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 break-all font-mono text-[11px] text-slate-500">
                anterior: {r.prevHash}
              </p>
              <p className="break-all font-mono text-[11px] text-slate-500">hash: {r.hash}</p>
              <button
                onClick={() => recalcularHash(i)}
                className="mt-1 text-xs text-blue-700 underline"
              >
                recalcular o hash deste registro
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
