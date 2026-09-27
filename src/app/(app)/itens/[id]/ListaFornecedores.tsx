'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Selo } from '@/components/ui'
import { formatarData, formatarMoeda, formatarVariacao } from '@/lib/formatar'

export interface FornecedorDaLista {
  fornecedorId: string
  nome: string
  preferencial: boolean
  ativo: boolean
  codigoNoFornecedor: string | null
  leadTimeDias: number | null
  ultimoPreco: number | null
  dataUltimaCompra: string | null
  menorPreco: boolean
  historico: {
    data: string
    precoUnitario: number
    variacaoPercentual: number | null
    quantidade: number
    notaFiscal: string | null
    usuario: string
    estornada: boolean
  }[]
}

/**
 * Fornecedores do item (RN-05, RN-05a). Cada linha abre o histórico de preços daquele fornecedor.
 * Sem permissão de ver preços (RN-05b), a lista chega sem preço, sem data e sem histórico.
 */
export function ListaFornecedores({
  fornecedores,
  verPrecos,
}: {
  fornecedores: FornecedorDaLista[]
  verPrecos: boolean
}) {
  const [aberto, setAberto] = useState<string | null>(null)
  const colunas = verPrecos
    ? 'grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px]'
    : 'grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div
          className={`grid ${colunas} gap-4 bg-surface-2 px-6 py-3 text-xs font-medium text-ink-3`}
        >
          <span>Fornecedor</span>
          {verPrecos && <span className="text-right">Último preço</span>}
          {verPrecos && <span className="text-right">Última compra</span>}
          <span className="text-right">Lead time</span>
          {verPrecos && <span />}
        </div>
        {fornecedores.map((f) => {
          const expandido = aberto === f.fornecedorId
          return (
            <div key={f.fornecedorId} className="border-t border-line">
              <div className={`grid ${colunas} items-center gap-4 px-6 py-3.5`}>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {f.nome}
                    {f.preferencial && <Selo tom="accent">Preferencial</Selo>}
                    {!f.ativo && <Selo>Inativo</Selo>}
                  </p>
                  {f.codigoNoFornecedor && (
                    <p className="font-mono text-xs text-ink-3">cód. {f.codigoNoFornecedor}</p>
                  )}
                </div>
                {verPrecos && (
                  <span
                    className={`text-right text-base font-semibold ${f.ultimoPreco === null ? 'text-ink-3' : f.menorPreco ? 'text-ok-ink' : ''}`}
                  >
                    {f.ultimoPreco === null ? 'sem compras' : formatarMoeda(f.ultimoPreco)}
                  </span>
                )}
                {verPrecos && (
                  <span className="text-right text-ink-2">{formatarData(f.dataUltimaCompra)}</span>
                )}
                <span className="text-right text-ink-2">
                  {f.leadTimeDias === null ? '—' : `${f.leadTimeDias} dias`}
                </span>
                {verPrecos && (
                  <button
                    type="button"
                    onClick={() => setAberto(expandido ? null : f.fornecedorId)}
                    aria-expanded={expandido}
                    aria-label={`Histórico de preços de ${f.nome}`}
                    className="inline-flex size-8 items-center justify-center justify-self-end rounded-lg text-ink-3 hover:bg-surface-2"
                  >
                    <ChevronDown
                      className={`size-4 transition-transform ${expandido ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>
              {expandido && (
                <div className="px-6 pb-4">
                  {f.historico.length === 0 ? (
                    <p className="rounded-[10px] bg-surface-2 px-4 py-3 text-ink-3">
                      Sem compras deste fornecedor.
                    </p>
                  ) : (
                    <table
                      aria-label={`Histórico de preços de ${f.nome}`}
                      className="w-full overflow-hidden rounded-[10px] bg-surface-2 text-left text-sm [&_td]:border-t [&_td]:border-line [&_td]:px-4 [&_td]:py-2.5 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-xs [&_th]:font-medium [&_th]:text-ink-3"
                    >
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th className="text-right">Preço unit.</th>
                          <th className="text-right">Variação</th>
                          <th className="text-right">Qtd.</th>
                          <th>NF</th>
                          <th>Lançado por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {f.historico.map((h) => (
                          <tr key={h.data} className={h.estornada ? 'text-ink-3 line-through' : ''}>
                            <td>
                              {formatarData(h.data)}
                              {h.estornada && (
                                <span className="ml-2 inline-block no-underline">
                                  <Selo>estornada</Selo>
                                </span>
                              )}
                            </td>
                            <td className="text-right">{formatarMoeda(h.precoUnitario)}</td>
                            <td
                              className={`text-right ${(h.variacaoPercentual ?? 0) > 0 ? 'text-crit-ink' : (h.variacaoPercentual ?? 0) < 0 ? 'text-ok-ink' : 'text-ink-3'}`}
                            >
                              {formatarVariacao(h.variacaoPercentual)}
                            </td>
                            <td className="text-right">{h.quantidade}</td>
                            <td className="font-mono text-xs">{h.notaFiscal}</td>
                            <td className="font-mono text-xs text-ink-2">{h.usuario}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
