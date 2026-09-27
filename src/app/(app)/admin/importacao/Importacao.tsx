'use client'

import { useState, useTransition } from 'react'
import { acaoImportar, acaoPreviaImportacao } from '@/app/acoes/admin'
import type { ResultadoLinha } from '@/domain/importacao'

/** RF-25: prévia linha a linha antes de gravar; gravação tudo-ou-nada. */
export function Importacao({ modelo }: { modelo: string }) {
  const [conteudo, setConteudo] = useState<string | null>(null)
  const [linhas, setLinhas] = useState<ResultadoLinha[] | null>(null)
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null)
  const [pendente, iniciar] = useTransition()

  async function escolher(arquivo: File | undefined) {
    setLinhas(null)
    setMensagem(null)
    if (!arquivo) return
    const texto = await arquivo.text()
    setConteudo(texto)
    iniciar(async () => {
      const r = await acaoPreviaImportacao(texto)
      if (r.ok) setLinhas(r.lista as ResultadoLinha[])
      else setMensagem({ tipo: 'erro', texto: r.erro ?? 'Falha ao ler o arquivo.' })
    })
  }

  function importar() {
    if (!conteudo) return
    iniciar(async () => {
      const r = await acaoImportar(conteudo)
      setMensagem(
        r.ok
          ? { tipo: 'ok', texto: r.mensagem ?? 'Importado.' }
          : { tipo: 'erro', texto: r.erro ?? 'Falha.' },
      )
      if (r.ok) setLinhas(null)
    })
  }

  const erros = linhas?.filter((l) => !l.ok) ?? []
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(modelo)}`}
          download="modelo-importacao-sicei.csv"
          className="font-medium underline"
        >
          Baixar o modelo de CSV
        </a>{' '}
        (separador ponto e vírgula). O fornecedor precisa estar cadastrado; o fabricante é criado se
        não existir.
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Arquivo CSV
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => escolher(e.target.files?.[0])}
          className="text-sm"
        />
      </label>
      {pendente && <p role="status">Processando…</p>}
      {mensagem && (
        <p
          role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
          className={`rounded-md border p-2 text-sm ${mensagem.tipo === 'erro' ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}
        >
          {mensagem.texto}
        </p>
      )}
      {linhas && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            {linhas.length} linha(s):{' '}
            <strong className="text-green-700">{linhas.length - erros.length} válidas</strong>,{' '}
            <strong className={erros.length ? 'text-red-700' : ''}>{erros.length} com erro</strong>.
          </p>
          {erros.length > 0 && (
            <ul className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
              {erros.map((l) => (
                <li key={l.linha}>
                  Linha {l.linha}: {!l.ok && l.erros.join(' ')}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={importar}
            disabled={pendente || erros.length > 0}
            className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Importar {linhas.length - erros.length} item(ns)
          </button>
        </div>
      )}
    </div>
  )
}
