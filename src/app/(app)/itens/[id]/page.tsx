import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { pode } from '@/domain/permissoes'
import {
  Aviso,
  BadgeStatus,
  Cartao,
  LinkBotao,
  Pagina,
  Rotulo,
  Tabela,
  Vazio,
} from '@/components/ui'
import {
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
  formatarVariacao,
  NOME_APLICACAO,
  NOME_TIPO,
} from '@/lib/formatar'
import { listarFornecedores, listarPosicoes } from '@/server/consultas/cadastros'
import { detalheItem, opcoesDeMovimentacao } from '@/server/consultas/estoque'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import {
  BotaoDesvincular,
  FormInventario,
  FormLimites,
  FormMovimentacao,
  FormPosicao,
  FormSituacaoItem,
  FormVinculo,
} from './formularios'

export const metadata: Metadata = { title: 'Item' }

export default async function PaginaItem({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirPermissaoDaPagina('saldo:ver')
  const { id } = await params
  const d = await detalheItem(id, u.perfil)
  if (!d) notFound()
  const { item } = d
  const podeEditar = pode(u.perfil, 'cadastros:editar')
  const podeMovimentar =
    item.ativo && (pode(u.perfil, 'movimentacao:entrada') || pode(u.perfil, 'movimentacao:saida'))
  const alerta = item.alertas[0]

  const [opcoes, todosFornecedores, posicoes] = await Promise.all([
    podeMovimentar ? opcoesDeMovimentacao(item.id) : null,
    podeEditar ? listarFornecedores() : [],
    podeEditar ? listarPosicoes() : [],
  ])

  return (
    <Pagina
      titulo={`${item.codigo} · ${item.descricao}`}
      descricao={
        <span className="flex flex-wrap items-center gap-2">
          <BadgeStatus status={item.status} />
          {!item.ativo && <span className="text-slate-500">Item inativo</span>}
          <span>
            Posição:{' '}
            {item.posicao ? (
              <strong className="font-mono">{item.posicao.codigo}</strong>
            ) : (
              'sem posição'
            )}
          </span>
        </span>
      }
      acoes={
        <>
          {podeEditar && (
            <LinkBotao href={`/itens/${item.id}/editar`} variante="secundario">
              Editar
            </LinkBotao>
          )}
          {item.posicao && pode(u.perfil, 'etiquetas:imprimir') && (
            <LinkBotao
              href={`/cadastros/posicoes/etiquetas?codigos=${item.posicao.codigo}`}
              variante="secundario"
            >
              Etiqueta QR
            </LinkBotao>
          )}
        </>
      }
    >
      {alerta && (
        <Aviso tipo={alerta.nivel === 'ATENCAO' ? 'alerta' : 'erro'}>
          Alerta {alerta.nivel} aberto desde {formatarDataHora(alerta.abertoEm)}.
          {alerta.cientePor &&
            ` Ciente: ${alerta.cientePor.login} em ${formatarDataHora(alerta.cienteEm)}.`}{' '}
          Sugestão de compra: <strong>{d.sugestao.quantidade}</strong> unidades ({d.sugestao.caixas}{' '}
          caixas).
        </Aviso>
      )}

      <Cartao>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Rotulo nome="Saldo">
            <span className="text-3xl font-bold">{item.saldo}</span> un.
          </Rotulo>
          <Rotulo nome="Estoque mínimo">{item.estoqueMinimo}</Rotulo>
          <Rotulo nome="Ponto de reposição">{item.pontoReposicao}</Rotulo>
          <Rotulo nome="Estoque máximo">{item.estoqueMaximo ?? '—'}</Rotulo>
          <Rotulo nome={`Consumo médio (${d.janela} dias)`}>
            {formatarNumero(d.consumoDiario)} / dia
          </Rotulo>
          <Rotulo nome="Embalagem">{item.embalagem} un. por caixa</Rotulo>
          <Rotulo nome="Fabricante">{item.fabricante.nome}</Rotulo>
          <Rotulo nome="Aplicação">{NOME_APLICACAO[item.aplicacao]}</Rotulo>
          <Rotulo nome="ISO">{item.iso ?? '—'}</Rotulo>
          <Rotulo nome="Classe">{item.classe ?? '—'}</Rotulo>
          <Rotulo nome="Cobertura">{item.cobertura ?? '—'}</Rotulo>
        </dl>
      </Cartao>

      {podeMovimentar && opcoes && (
        <Cartao titulo="Registrar movimentação">
          <FormMovimentacao
            itemId={item.id}
            embalagem={item.embalagem}
            podeEntrada={pode(u.perfil, 'movimentacao:entrada')}
            podeSaida={pode(u.perfil, 'movimentacao:saida')}
            {...opcoes}
          />
        </Cartao>
      )}

      <Cartao titulo="Fornecedores">
        {!d.verPrecos && <p className="mb-2 text-sm text-slate-500">O seu perfil não vê preços.</p>}
        <ul className="flex flex-col gap-2">
          {d.fornecedores.map((f) => (
            <li key={f.fornecedorId} className="rounded-md border border-slate-200">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm">
                  <span className="font-medium">
                    {f.nome}
                    {f.preferencial && (
                      <span className="ml-1 rounded bg-blue-100 px-1 text-xs text-blue-800">
                        preferencial
                      </span>
                    )}
                    {!f.ativo && <span className="ml-1 text-xs text-slate-500">(inativo)</span>}
                  </span>
                  {d.verPrecos && (
                    <span>
                      último preço:{' '}
                      <strong>
                        {f.ultimoPreco === null ? 'sem compras' : formatarMoeda(f.ultimoPreco)}
                      </strong>
                    </span>
                  )}
                  <span>última compra: {formatarData(f.dataUltimaCompra)}</span>
                  <span>lead time: {f.leadTimeDias ?? '—'} dias</span>
                  {f.codigoNoFornecedor && (
                    <span className="text-slate-500">cód.: {f.codigoNoFornecedor}</span>
                  )}
                </summary>
                <div className="border-t border-slate-200 p-3">
                  {d.verPrecos &&
                    (f.historico.length === 0 ? (
                      <Vazio>Sem compras deste fornecedor.</Vazio>
                    ) : (
                      <Tabela rotulo={`Histórico de preços de ${f.nome}`}>
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th className="text-right">Preço</th>
                            <th className="text-right">Variação</th>
                            <th className="text-right">Qtd.</th>
                            <th>NF</th>
                            <th>Usuário</th>
                          </tr>
                        </thead>
                        <tbody>
                          {f.historico.map((h, i) => (
                            <tr
                              key={i}
                              className={h.estornada ? 'text-slate-400 line-through' : ''}
                            >
                              <td>
                                {formatarDataHora(h.data)}
                                {h.estornada && (
                                  <span className="ml-1 no-underline">(estornada)</span>
                                )}
                              </td>
                              <td className="text-right">{formatarMoeda(h.precoUnitario)}</td>
                              <td className="text-right">
                                {formatarVariacao(h.variacaoPercentual)}
                              </td>
                              <td className="text-right">{h.quantidade}</td>
                              <td>{h.notaFiscal}</td>
                              <td>{h.usuario}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Tabela>
                    ))}
                  {podeEditar && (
                    <div className="mt-2">
                      <BotaoDesvincular itemId={item.id} fornecedorId={f.fornecedorId} />
                    </div>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
        {podeEditar && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium">
              Vincular ou atualizar fornecedor
            </summary>
            <div className="mt-2">
              <FormVinculo
                itemId={item.id}
                fornecedores={todosFornecedores
                  .filter((f) => f.ativo)
                  .map((f) => ({ valor: f.id, rotulo: f.nomeFantasia ?? f.razaoSocial }))}
              />
            </div>
          </details>
        )}
      </Cartao>

      <div className="grid gap-4 lg:grid-cols-2">
        {pode(u.perfil, 'limites:editar') && (
          <Cartao titulo="Estoque mínimo e máximo">
            <FormLimites itemId={item.id} minimo={item.estoqueMinimo} maximo={item.estoqueMaximo} />
          </Cartao>
        )}
        {podeEditar && item.ativo && (
          <Cartao titulo="Posição no almoxarifado">
            <FormPosicao
              itemId={item.id}
              atual={item.posicao?.codigo ?? null}
              livres={posicoes
                .filter((p) => p.ativo && (!p.item || p.item.id === item.id))
                .map((p) => ({ valor: p.id, rotulo: p.codigo }))}
            />
          </Cartao>
        )}
        {pode(u.perfil, 'movimentacao:ajuste') && item.ativo && (
          <Cartao titulo="Inventário (RN-13)">
            <FormInventario itemId={item.id} saldo={item.saldo} />
          </Cartao>
        )}
        {podeEditar && (
          <Cartao titulo="Situação do item">
            <FormSituacaoItem id={item.id} ativo={item.ativo} />
          </Cartao>
        )}
      </div>

      <Cartao
        titulo={
          <span className="flex items-center justify-between">
            Últimas movimentações
            {pode(u.perfil, 'historico:ver') && (
              <Link
                href={`/movimentacoes?item=${encodeURIComponent(item.codigo)}`}
                className="text-sm font-normal underline"
              >
                ver todas
              </Link>
            )}
          </span>
        }
      >
        {d.movimentacoes.length === 0 ? (
          <Vazio>Nenhuma movimentação.</Vazio>
        ) : (
          <Tabela rotulo="Movimentações do item">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th className="text-right">Qtd.</th>
                <th className="text-right">Saldo</th>
                <th className="hidden sm:table-cell">Destino / colaborador</th>
                <th className="hidden sm:table-cell">Usuário</th>
              </tr>
            </thead>
            <tbody>
              {d.movimentacoes.map((m) => (
                <tr key={m.id} className={m.estornadaPor ? 'text-slate-400' : ''}>
                  <td className="whitespace-nowrap">
                    {pode(u.perfil, 'historico:ver') ? (
                      <Link href={`/movimentacoes/${m.id}`} className="underline">
                        {formatarDataHora(m.criadoEm)}
                      </Link>
                    ) : (
                      formatarDataHora(m.criadoEm)
                    )}
                  </td>
                  <td>
                    {NOME_TIPO[m.tipo]}
                    {m.estornadaPor && ' (estornada)'}
                  </td>
                  <td className="text-right">{m.quantidade}</td>
                  <td className="text-right">
                    {m.saldoAnterior} → {m.saldoPosterior}
                  </td>
                  <td className="hidden sm:table-cell">
                    {[m.destino?.nome, m.colaborador?.nome].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="hidden sm:table-cell">{m.usuario.login}</td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Cartao>
    </Pagina>
  )
}
