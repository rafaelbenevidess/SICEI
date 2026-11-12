'use client'

import { Check, CircleCheck, Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import { acaoImportar, acaoPreviaImportacao } from '@/app/acoes/admin'
import { classeBotao, LinkBotao } from '@/components/ui'
import type { LinhaDaPrevia } from '@/domain/importacao'
import { formatarNumero } from '@/lib/formatar'

type Passo = 1 | 2 | 3

const PASSOS: { n: Passo; titulo: string; sub: string }[] = [
  { n: 1, titulo: 'Enviar o CSV', sub: 'No modelo do sistema' },
  { n: 2, titulo: 'Conferir a prévia', sub: 'Erros linha a linha' },
  { n: 3, titulo: 'Importar', sub: 'Tudo ou nada' },
]

function Passos({ atual, concluido }: { atual: Passo; concluido: boolean }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {PASSOS.map(({ n, titulo, sub }) => {
        const feito = n < atual || (concluido && n === 3)
        const ativo = n === atual && !concluido
        return (
          <li
            key={n}
            aria-current={ativo ? 'step' : undefined}
            className={`flex items-center gap-3 rounded-cartao border px-4 py-3.5 ${
              ativo ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
            }`}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                feito
                  ? 'bg-ok text-white'
                  : ativo
                    ? 'bg-accent text-on-accent'
                    : 'bg-surface-3 text-ink-2'
              }`}
            >
              {feito ? <Check aria-label="concluído" className="size-4" /> : n}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{titulo}</span>
              <span className="block text-xs text-ink-3">{sub}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** RF-25: envio do CSV, prévia linha a linha sem gravar nada e gravação tudo ou nada. */
export function Importacao({ modelo }: { modelo: string }) {
  const [arquivo, setArquivo] = useState<{ nome: string; conteudo: string } | null>(null)
  const [linhas, setLinhas] = useState<LinhaDaPrevia[] | null>(null)
  const [importados, setImportados] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [pendente, iniciar] = useTransition()
  const entrada = useRef<HTMLInputElement>(null)

  async function escolher(f: File | undefined) {
    setErro(null)
    setLinhas(null)
    if (!f) return
    if (!/\.csv$/i.test(f.name) && f.type !== 'text/csv') {
      setErro('Envie um arquivo .csv.')
      return
    }
    const conteudo = await f.text()
    setArquivo({ nome: f.name, conteudo })
    iniciar(async () => {
      const r = await acaoPreviaImportacao(conteudo)
      if (r.ok) setLinhas(r.lista as LinhaDaPrevia[])
      else setErro(r.erro ?? 'Não foi possível ler o arquivo.')
    })
  }

  function importar() {
    if (!arquivo) return
    iniciar(async () => {
      const r = await acaoImportar(arquivo.conteudo)
      if (r.ok) setImportados(Number(r.dados?.itens ?? 0))
      else setErro(r.erro ?? 'Não foi possível importar.')
    })
  }

  function recomecar() {
    setArquivo(null)
    setLinhas(null)
    setImportados(null)
    setErro(null)
    if (entrada.current) entrada.current.value = ''
  }

  const erros = linhas?.filter((l) => !l.ok) ?? []
  const validas = (linhas?.length ?? 0) - erros.length
  const passo: Passo = importados !== null ? 3 : linhas ? 2 : 1

  const seletor = (
    <input
      ref={entrada}
      type="file"
      accept=".csv,text/csv"
      aria-label="Arquivo CSV"
      className="sr-only"
      onChange={(e) => escolher(e.target.files?.[0])}
    />
  )

  return (
    <div className="flex flex-col gap-5">
      <Passos atual={passo} concluido={importados !== null} />

      <section className="cartao p-5 sm:p-7">
        {erro && (
          <p role="alert" className="mb-4 rounded-xl bg-crit-soft px-4 py-3 text-sm text-crit-ink">
            {erro}
          </p>
        )}

        {importados !== null ? (
          <div role="status" className="flex flex-col items-center gap-2 py-10 text-center">
            <CircleCheck aria-hidden className="size-14 text-ok" strokeWidth={1.5} />
            <p className="mt-2 text-xl font-semibold">
              {formatarNumero(importados)}{' '}
              {importados === 1 ? 'item importado' : 'itens importados'}
            </p>
            <p className="max-w-md text-sm text-ink-2">
              O saldo de cada item entrou como ajuste positivo com a justificativa “saldo inicial da
              implantação”, e tudo ficou registrado no log de auditoria.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={recomecar} className={classeBotao('secundario')}>
                Nova importação
              </button>
              <LinkBotao href="/itens">Ver itens</LinkBotao>
            </div>
          </div>
        ) : linhas && arquivo ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <FileSpreadsheet aria-hidden className="size-6 shrink-0 text-ok" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{arquivo.nome}</p>
                <p className="text-[13px] text-ink-2">
                  {formatarNumero(linhas.length)} {linhas.length === 1 ? 'linha' : 'linhas'}:{' '}
                  <b className="text-ok-ink">
                    {formatarNumero(validas)} {validas === 1 ? 'válida' : 'válidas'}
                  </b>
                  ,{' '}
                  <b className={erros.length ? 'text-crit-ink' : undefined}>
                    {formatarNumero(erros.length)} com erro
                  </b>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => entrada.current?.click()}
                className={classeBotao('secundario')}
                disabled={pendente}
              >
                <Upload aria-hidden />
                {erros.length ? 'Enviar arquivo corrigido' : 'Trocar arquivo'}
              </button>
              <button
                type="button"
                onClick={importar}
                disabled={pendente || erros.length > 0 || validas === 0}
                className={classeBotao('primario')}
              >
                {pendente
                  ? 'Importando…'
                  : `Importar ${formatarNumero(validas)} ${validas === 1 ? 'item' : 'itens'}`}
              </button>
              {seletor}
            </div>

            {erros.length > 0 && (
              <div role="alert" className="rounded-xl bg-crit-soft px-4 py-3 text-sm text-crit-ink">
                <p className="font-semibold">
                  Corrija as linhas abaixo e envie o arquivo de novo. Nada é gravado enquanto houver
                  erro.
                </p>
                <ul className="mt-1.5 list-disc pl-5">
                  {erros.slice(0, 20).map((l) => (
                    <li key={l.linha}>
                      Linha {l.linha}: {!l.ok && l.erros.join(' ')}
                    </li>
                  ))}
                  {erros.length > 20 && <li>… e mais {erros.length - 20} linhas.</li>}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-line">
              <table
                aria-label="Prévia da importação"
                className="w-full min-w-[860px] border-collapse text-left text-sm [&_td]:border-t [&_td]:border-line [&_td]:px-4 [&_td]:py-2.5 [&_th]:bg-surface-2 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-xs [&_th]:font-medium [&_th]:text-ink-3"
              >
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Código</th>
                    <th>ISO · classe</th>
                    <th>Fornecedor</th>
                    <th>Posição</th>
                    <th className="text-right">Mínimo</th>
                    <th className="text-right">Saldo inicial</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.linha} className={l.ok ? undefined : 'bg-crit-soft'}>
                      <td className="font-mono text-xs text-ink-3">{l.linha}</td>
                      <td className="font-mono text-xs font-semibold whitespace-nowrap">
                        {l.resumo.codigo || '—'}
                      </td>
                      <td className="font-mono text-xs whitespace-nowrap">
                        {l.resumo.isoClasse || '—'}
                      </td>
                      <td className="whitespace-nowrap">{l.resumo.fornecedor || '—'}</td>
                      <td className="font-mono text-xs whitespace-nowrap">
                        {l.resumo.posicao || '—'}
                      </td>
                      <td className="text-right tabular-nums">{l.resumo.minimo || '—'}</td>
                      <td className="text-right tabular-nums">{l.resumo.saldo || '—'}</td>
                      <td className="text-[13px]">
                        {l.ok ? (
                          <span className="inline-flex items-center gap-1 text-ok-ink">
                            <Check aria-hidden className="size-4" /> Válida
                          </span>
                        ) : (
                          <span className="inline-flex items-start gap-1 text-crit-ink">
                            <X aria-hidden className="mt-0.5 size-4 shrink-0" />
                            {l.erros.join(' ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-2 px-4 py-3.5">
              <FileSpreadsheet aria-hidden className="size-6 shrink-0 text-ok" />
              <div className="min-w-0 flex-1 basis-64">
                <p className="font-medium">modelo-importacao-sicei.csv</p>
                <p className="text-[13px] text-ink-2">
                  Separador ponto e vírgula. O fornecedor precisa estar cadastrado; o fabricante é
                  criado se não existir.
                </p>
              </div>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(modelo)}`}
                download="modelo-importacao-sicei.csv"
                className={classeBotao('secundario', true)}
              >
                <Download aria-hidden />
                Baixar modelo
              </a>
            </div>
            <label
              onDragOver={(e) => {
                e.preventDefault()
                setArrastando(true)
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(e) => {
                e.preventDefault()
                setArrastando(false)
                escolher(e.dataTransfer.files?.[0])
              }}
              className={`flex h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-cartao border-2 border-dashed px-4 text-center transition-colors focus-within:border-accent hover:border-accent hover:bg-accent-soft ${
                arrastando ? 'border-accent bg-accent-soft' : 'border-line-2'
              }`}
            >
              <Upload aria-hidden className="size-7 text-accent" />
              <span className="text-[15px] font-semibold">
                {pendente ? 'Lendo o arquivo…' : 'Arraste o CSV aqui ou clique para escolher'}
              </span>
              <span className="text-[13px] text-ink-3">
                Só .csv · a prévia aparece antes de gravar qualquer coisa
              </span>
              {seletor}
            </label>
          </div>
        )}
      </section>
    </div>
  )
}
