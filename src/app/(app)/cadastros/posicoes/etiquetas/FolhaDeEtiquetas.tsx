'use client'

import { Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { acaoEtiquetasImpressas } from '@/app/acoes/cadastros'
import { Toast } from '@/components/formulario'
import { classeBotao, Selo } from '@/components/ui'
import { pontuarTexto } from '@/domain/busca'

interface Etiqueta {
  codigo: string
  itemCodigo: string
  nome: string
  svg: string
  /** RN-26: o item entrou nesta posição e a etiqueta ainda não foi impressa */
  pendente: boolean
}

/** Escolha das posições e prévia da folha A4; na impressão sai só a folha. */
export function FolhaDeEtiquetas({
  etiquetas,
  inicial,
}: {
  etiquetas: Etiqueta[]
  inicial: string[]
}) {
  const router = useRouter()
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set(inicial))
  const [filtro, setFiltro] = useState('')
  const [pendente, iniciar] = useTransition()
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string; chave: number } | null>(
    null,
  )
  const pendentes = etiquetas.filter((e) => e.pendente)
  const todas = marcadas.size === etiquetas.length
  const escolhidas = etiquetas.filter((e) => marcadas.has(e.codigo))
  // RF-11: "a4g2c1" acha A04-G02-C01 e "pst7" acha a posição do PST-007
  const visiveis = filtro.trim()
    ? etiquetas.filter((e) => pontuarTexto(filtro, [e.codigo, e.itemCodigo, e.nome]) > 0)
    : etiquetas
  const alternar = (codigo: string) =>
    setMarcadas((m) => {
      const n = new Set(m)
      if (n.has(codigo)) n.delete(codigo)
      else n.add(codigo)
      return n
    })

  return (
    <div className="grid items-start gap-6 min-[65rem]:grid-cols-[340px_minmax(0,1fr)]">
      <section className="nao-imprimir overflow-hidden rounded-[14px] border border-line bg-surface shadow-cartao">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 className="font-semibold">Posições ocupadas</h2>
          {pendentes.length > 0 && (
            <button
              type="button"
              onClick={() => setMarcadas(new Set(pendentes.map((e) => e.codigo)))}
              className="text-[13px] font-medium text-warn-ink hover:underline"
            >
              Só as {pendentes.length} pendentes
            </button>
          )}
          <button
            type="button"
            onClick={() => setMarcadas(todas ? new Set() : new Set(etiquetas.map((e) => e.codigo)))}
            className="text-[13px] font-medium text-accent-ink hover:underline"
          >
            {todas ? 'Limpar seleção' : 'Selecionar todas'}
          </button>
        </div>
        <div className="px-5 pb-4">
          <label htmlFor="filtro-etiquetas" className="sr-only">
            Filtrar posições
          </label>
          <input
            id="filtro-etiquetas"
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Posição ou item (ex.: a4g2c1, pst7)"
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full min-w-0 rounded-lg border border-line-2 bg-surface px-3 text-base text-ink placeholder:text-ink-3 sm:text-sm"
          />
          {filtro.trim() && visiveis.length > 0 && (
            <button
              type="button"
              onClick={() => setMarcadas((m) => new Set([...m, ...visiveis.map((e) => e.codigo)]))}
              className="mt-2 text-[13px] font-medium text-accent-ink hover:underline"
            >
              Marcar {visiveis.length === 1 ? 'a encontrada' : `as ${visiveis.length} encontradas`}
            </button>
          )}
        </div>
        {visiveis.length === 0 && (
          <p className="border-t border-line px-5 py-4 text-[13px] text-ink-3">
            Nenhuma posição com “{filtro.trim()}”.
          </p>
        )}
        <ul className="max-h-[70vh] overflow-y-auto">
          {visiveis.map((e) => (
            <li key={e.codigo} className="border-t border-line">
              <label className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={marcadas.has(e.codigo)}
                  onChange={() => alternar(e.codigo)}
                  className="size-4 accent-[var(--accent)]"
                />
                <span className="font-mono text-[13px] font-medium">{e.codigo}</span>
                <span className="font-mono text-xs text-ink-3">{e.itemCodigo}</span>
                {e.pendente && (
                  <span className="ml-auto">
                    <Selo tom="warn">Não impressa</Selo>
                  </span>
                )}
              </label>
            </li>
          ))}
        </ul>
        <div className="border-t border-line p-4">
          <button
            type="button"
            onClick={() =>
              iniciar(async () => {
                // registra antes de abrir a janela de impressão, que trava a página
                const r = await acaoEtiquetasImpressas(escolhidas.map((e) => e.codigo))
                setResultado({
                  ok: Boolean(r.ok),
                  texto: r.ok ? (r.mensagem ?? '') : (r.erro ?? 'Não foi possível registrar.'),
                  chave: Date.now(),
                })
                window.print()
                router.refresh()
              })
            }
            disabled={escolhidas.length === 0 || pendente}
            className={`${classeBotao('primario')} w-full`}
          >
            <Printer aria-hidden />
            Imprimir {escolhidas.length} {escolhidas.length === 1 ? 'etiqueta' : 'etiquetas'}
          </button>
          {resultado && !resultado.ok && (
            <p role="alert" className="mt-3 text-[13px] text-crit-ink">
              {resultado.texto}
            </p>
          )}
        </div>
        {resultado?.ok && <Toast chave={resultado.chave}>{resultado.texto}</Toast>}
      </section>

      <section
        aria-label="Prévia da folha A4"
        className="rounded-[14px] bg-surface-3 p-4 sm:p-8 print:bg-white print:p-0"
      >
        <div className="mx-auto aspect-[210/297] w-full max-w-[620px] bg-white p-[5%] text-[#14191f] shadow-pop print:aspect-auto print:max-w-none print:p-0 print:shadow-none">
          {escolhidas.length === 0 ? (
            <p className="pt-10 text-center text-sm text-[#6d7279]">
              Marque as posições que vão para a folha.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2">
              {escolhidas.map((e) => (
                <div
                  key={e.codigo}
                  className="flex min-w-0 items-center gap-2.5 rounded border border-dashed border-[#cdd1d6] p-2.5 break-inside-avoid"
                >
                  <div
                    role="img"
                    aria-label={`QR da posição ${e.codigo}`}
                    className="w-14 shrink-0 [&_svg]:h-auto [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: e.svg }}
                  />
                  <div className="min-w-0 leading-tight">
                    <p className="font-mono text-xs font-semibold">{e.codigo}</p>
                    <p className="font-mono text-[10px]">{e.itemCodigo}</p>
                    <p className="truncate text-[10px] text-[#484e55]">{e.nome}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
