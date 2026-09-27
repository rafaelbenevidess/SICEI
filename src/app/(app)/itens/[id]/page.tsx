import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Link2,
  Lock,
  MapPin,
  Pencil,
  QrCode,
  ScanLine,
} from 'lucide-react'
import { pode } from '@/domain/permissoes'
import { QtdMovimentacao, TipoMovimentacao } from '@/components/movimentacao'
import {
  Aviso,
  BadgeStatus,
  Cartao,
  ChipCodigo,
  Gauge,
  LinkBotao,
  Pagina,
  Rotulo,
  Selo,
  Tabela,
  Vazio,
} from '@/components/ui'
import {
  formatarDataHora,
  formatarDiaHora,
  formatarNumero,
  NOME_APLICACAO,
  NOME_STATUS,
  nomeDaPastilha,
} from '@/lib/formatar'
import { listarFornecedores, listarPosicoes, opcaoDeFornecedor } from '@/server/consultas/cadastros'
import { detalheItem } from '@/server/consultas/estoque'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { BotaoCiente } from '../../alertas/BotaoCiente'
import {
  BotaoDesvincular,
  FormInventario,
  FormLimites,
  FormPosicao,
  FormSituacaoItem,
  FormVinculo,
} from './formularios'
import { ListaFornecedores } from './ListaFornecedores'

export const metadata: Metadata = { title: 'Item' }

export default async function PaginaItem({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ qr?: string }>
}) {
  const u = await exigirPermissaoDaPagina('saldo:ver')
  const { id } = await params
  const { qr } = await searchParams
  const d = await detalheItem(id, u.perfil)
  if (!d) notFound()
  const { item } = d
  const podeEditar = pode(u.perfil, 'cadastros:editar')
  const podeEntrada = item.ativo && pode(u.perfil, 'movimentacao:entrada')
  const podeSaida = item.ativo && pode(u.perfil, 'movimentacao:saida')
  const alerta = item.alertas[0]
  const precos = d.fornecedores.map((f) => f.ultimoPreco).filter((p): p is number => p !== null)
  const menor = precos.length > 1 ? Math.min(...precos) : null

  const [todosFornecedores, posicoes] = await Promise.all([
    podeEditar ? listarFornecedores() : [],
    podeEditar ? listarPosicoes() : [],
  ])
  const gestao =
    podeEditar || pode(u.perfil, 'limites:editar') || pode(u.perfil, 'movimentacao:ajuste')

  return (
    <Pagina
      antes={
        <Link href="/itens" className="inline-flex items-center gap-1.5 text-ink-3 no-underline">
          <ArrowLeft aria-hidden className="size-3.5" />
          Itens
        </Link>
      }
      titulo={
        <span className="flex flex-wrap items-center gap-3">
          <ChipCodigo forte>{item.codigo}</ChipCodigo>
          {nomeDaPastilha(item)}
        </span>
      }
      descricao={
        <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          <BadgeStatus status={item.status} />
          {!item.ativo && <Selo>Item inativo</Selo>}
          <span className="inline-flex items-center gap-1.5 font-mono text-[13px]">
            <MapPin aria-hidden className="size-4 text-ink-3" />
            {item.posicao?.codigo ?? 'sem posição'}
          </span>
          <span>{item.fabricante.nome}</span>
          <span>{NOME_APLICACAO[item.aplicacao]}</span>
        </span>
      }
      acoes={
        <>
          {item.posicao && pode(u.perfil, 'etiquetas:imprimir') && (
            <LinkBotao
              href={`/cadastros/posicoes/etiquetas?codigos=${item.posicao.codigo}`}
              variante="secundario"
              icone={QrCode}
            >
              Etiqueta
            </LinkBotao>
          )}
          {podeEditar && (
            <LinkBotao href={`/itens/${item.id}/editar`} variante="secundario" icone={Pencil}>
              Editar
            </LinkBotao>
          )}
          {/* no celular, entrada e saída ficam na barra fixa embaixo */}
          <span className="contents max-md:hidden">
            {podeEntrada && (
              <LinkBotao
                href={`/movimentacoes/nova?modo=entrada&item=${item.id}`}
                variante="secundario"
                icone={ArrowDownToLine}
              >
                Entrada
              </LinkBotao>
            )}
            {podeSaida && (
              <LinkBotao
                href={`/movimentacoes/nova?modo=saida&item=${item.id}`}
                icone={ArrowUpFromLine}
              >
                Registrar saída
              </LinkBotao>
            )}
          </span>
        </>
      }
    >
      {qr && item.posicao && (
        <Aviso tipo="info">
          <span className="inline-flex items-center gap-2">
            <ScanLine aria-hidden className="size-4" />
            Posição <strong className="font-mono">{item.posicao.codigo}</strong> lida pela câmera.
          </span>
        </Aviso>
      )}

      {item.posicao?.etiquetaPendente && (
        <Aviso
          tipo="alerta"
          titulo="Etiqueta QR desta posição ainda não impressa"
          acoes={
            pode(u.perfil, 'etiquetas:imprimir') && (
              <LinkBotao
                href={`/cadastros/posicoes/etiquetas?codigos=${item.posicao.codigo}`}
                variante="secundario"
                pequeno
                icone={QrCode}
              >
                Imprimir etiqueta
              </LinkBotao>
            )
          }
        >
          O item está em <strong className="font-mono">{item.posicao.codigo}</strong>. Imprima a
          etiqueta e cole na frente do compartimento: sem ela, a leitura do QR não leva a este item.
        </Aviso>
      )}

      {alerta && (
        <Aviso
          tipo={alerta.nivel === 'ATENCAO' ? 'alerta' : 'erro'}
          acoes={
            <>
              {pode(u.perfil, 'relatorios:ver') && (
                <LinkBotao href="/relatorios?tipo=reposicao" variante="secundario" pequeno>
                  Ver sugestão
                </LinkBotao>
              )}
              {!alerta.cientePor && pode(u.perfil, 'alertas:ciente') && (
                <BotaoCiente alertaId={alerta.id} pequeno />
              )}
            </>
          }
        >
          Alerta <strong>{NOME_STATUS[alerta.nivel]}</strong> aberto desde{' '}
          {formatarDataHora(alerta.abertoEm)}.
          {d.sugestao.quantidade > 0 && (
            <>
              {' '}
              Sugestão de compra: <strong>{d.sugestao.quantidade} unidades</strong> (
              {d.sugestao.caixas} {d.sugestao.caixas === 1 ? 'caixa' : 'caixas'}).
            </>
          )}
          {alerta.cientePor && (
            <>
              {' '}
              Ciente: {alerta.cientePor.login} em {formatarDataHora(alerta.cienteEm)}.
            </>
          )}
        </Aviso>
      )}

      <div className="grid gap-6 min-[75rem]:grid-cols-[2fr_1fr]">
        <Cartao>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[13px] text-ink-2">Saldo disponível</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-3">
                <span className="text-[52px] leading-none font-semibold tracking-[-0.04em]">
                  {item.saldo}
                </span>
                <span className="text-ink-2">
                  unidades · {formatarNumero(Math.round((item.saldo / item.embalagem) * 10) / 10)}{' '}
                  {item.saldo === item.embalagem ? 'caixa' : 'caixas'}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-ink-2">Cobertura estimada</p>
              <p className="text-lg font-semibold">
                {d.cobertura === null
                  ? 'Sem consumo'
                  : item.saldo === 0
                    ? 'Sem saldo'
                    : `~${d.cobertura} ${d.cobertura === 1 ? 'dia' : 'dias'}`}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Gauge
              larga
              saldo={item.saldo}
              minimo={item.estoqueMinimo}
              pontoReposicao={item.pontoReposicao}
              alvo={d.alvo}
              status={item.status}
            />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
            <Numero rotulo={`Consumo médio (${d.janela} dias)`}>
              {formatarNumero(d.consumoDiario)} / dia
            </Numero>
            <Numero rotulo="Lead time preferencial">
              {d.leadTimePreferencial === null ? '—' : `${d.leadTimePreferencial} dias`}
            </Numero>
            <Numero rotulo="Estoque máximo">{item.estoqueMaximo ?? '—'}</Numero>
            <Numero rotulo="Embalagem">{item.embalagem} un. / caixa</Numero>
          </dl>
        </Cartao>

        <Cartao titulo="Especificação">
          <dl>
            <Rotulo nome="ISO">
              <span className="font-mono">{item.iso ?? '—'}</span>
            </Rotulo>
            <Rotulo nome="Classe">{item.classe ?? '—'}</Rotulo>
            <Rotulo nome="Cobertura">{item.cobertura ?? '—'}</Rotulo>
            <Rotulo nome="Aplicação">{NOME_APLICACAO[item.aplicacao]}</Rotulo>
            <Rotulo nome="Fabricante">{item.fabricante.nome}</Rotulo>
            <Rotulo nome="Descrição">{item.descricao}</Rotulo>
            <Rotulo nome="Código interno">
              <span
                className="inline-flex items-center gap-1.5 font-mono"
                title={d.codigoTravado ? 'Travado: o item já tem movimentações (RN-01)' : undefined}
              >
                {d.codigoTravado && <Lock aria-label="travado" className="size-3.5 text-ink-3" />}
                {item.codigo}
              </span>
            </Rotulo>
          </dl>
        </Cartao>
      </div>

      <Cartao
        titulo="Fornecedores"
        subtitulo={
          d.verPrecos
            ? 'Do menor para o maior último preço. Sem compras aparecem no fim.'
            : 'O seu perfil não vê preços.'
        }
        semPadding
        acao={
          podeEditar && (
            <LinkBotao href="#gestao-fornecedor" variante="secundario" pequeno icone={Link2}>
              Vincular fornecedor
            </LinkBotao>
          )
        }
      >
        {d.fornecedores.length === 0 ? (
          <p className="px-6 pb-6 text-ink-3">Nenhum fornecedor vinculado.</p>
        ) : (
          <ListaFornecedores
            verPrecos={d.verPrecos}
            fornecedores={d.fornecedores.map((f) => ({
              fornecedorId: f.fornecedorId,
              nome: f.nome,
              preferencial: f.preferencial,
              ativo: f.ativo,
              codigoNoFornecedor: f.codigoNoFornecedor,
              leadTimeDias: f.leadTimeDias,
              ultimoPreco: f.ultimoPreco,
              dataUltimaCompra: f.dataUltimaCompra,
              menorPreco: menor !== null && f.ultimoPreco === menor,
              historico: f.historico.map((h) => ({
                data: h.data,
                precoUnitario: h.precoUnitario,
                variacaoPercentual: h.variacaoPercentual,
                quantidade: h.quantidade,
                notaFiscal: h.notaFiscal,
                usuario: h.usuario,
                estornada: h.estornada,
              })),
            }))}
          />
        )}
      </Cartao>

      {pode(u.perfil, 'historico:ver') && (
        <Cartao
          titulo="Últimas movimentações"
          semPadding
          acao={
            <Link href={`/movimentacoes?item=${encodeURIComponent(item.codigo)}`}>Ver todas</Link>
          }
        >
          {d.movimentacoes.length === 0 ? (
            <p className="px-6 pb-6 text-ink-3">Nenhuma movimentação.</p>
          ) : (
            <Tabela rotulo="Movimentações do item" emCartao larguraMinima={720}>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Tipo</th>
                  <th className="text-right">Qtd.</th>
                  <th>Saldo</th>
                  <th>Destino · colaborador</th>
                  <th>Usuário</th>
                </tr>
              </thead>
              <tbody>
                {d.movimentacoes.map((m) => {
                  const delta = m.saldoPosterior - m.saldoAnterior
                  return (
                    <tr key={m.id} className={`relative ${m.estornadaPor ? 'text-ink-3' : ''}`}>
                      <td className="whitespace-nowrap">
                        <Link
                          href={`/movimentacoes/${m.id}`}
                          className="text-inherit no-underline after:absolute after:inset-0 after:content-['']"
                        >
                          {formatarDiaHora(m.criadoEm)}
                        </Link>
                      </td>
                      <td>
                        <span className="flex flex-wrap items-center gap-2">
                          <TipoMovimentacao tipo={m.tipo} delta={delta} />
                          {m.estornadaPor && <Selo>estornada</Selo>}
                        </span>
                      </td>
                      <td className="text-right">
                        <QtdMovimentacao delta={delta} />
                      </td>
                      <td className="whitespace-nowrap text-ink-2">
                        {m.saldoAnterior} → {m.saldoPosterior}
                      </td>
                      <td className="text-ink-2">
                        {[m.destino?.nome, m.colaborador?.nome].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="font-mono text-xs text-ink-2">{m.usuario.login}</td>
                    </tr>
                  )
                })}
              </tbody>
            </Tabela>
          )}
        </Cartao>
      )}

      {gestao && (
        <section aria-labelledby="gestao-titulo" className="flex flex-col gap-3">
          <h2 id="gestao-titulo" className="text-base font-semibold">
            Gestão do item
          </h2>
          <div className="grid gap-3 min-[75rem]:grid-cols-2">
            {podeEditar && (
              <Recolhivel id="gestao-fornecedor" titulo="Vincular ou atualizar fornecedor">
                <FormVinculo
                  itemId={item.id}
                  fornecedores={todosFornecedores.filter((f) => f.ativo).map(opcaoDeFornecedor)}
                />
                {d.fornecedores.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
                    <p className="text-[13px] text-ink-3">Desvincular</p>
                    {d.fornecedores.map((f) => (
                      <div key={f.fornecedorId} className="flex items-center justify-between gap-3">
                        <span>{f.nome}</span>
                        <BotaoDesvincular itemId={item.id} fornecedorId={f.fornecedorId} />
                      </div>
                    ))}
                  </div>
                )}
              </Recolhivel>
            )}
            {pode(u.perfil, 'limites:editar') && (
              <Recolhivel titulo="Estoque mínimo e máximo">
                <FormLimites
                  itemId={item.id}
                  minimo={item.estoqueMinimo}
                  maximo={item.estoqueMaximo}
                />
              </Recolhivel>
            )}
            {podeEditar && item.ativo && (
              <Recolhivel titulo="Posição no almoxarifado">
                <FormPosicao
                  itemId={item.id}
                  atual={item.posicao?.codigo ?? null}
                  atualId={item.posicao?.id}
                  livres={posicoes
                    .filter((p) => p.ativo && (!p.item || p.item.id === item.id))
                    .map((p) => ({
                      valor: p.id,
                      rotulo: p.codigo,
                      detalhe: p.item ? 'Posição atual' : 'Livre',
                    }))}
                />
              </Recolhivel>
            )}
            {pode(u.perfil, 'movimentacao:ajuste') && item.ativo && (
              <Recolhivel titulo="Inventário (RN-13)">
                <FormInventario itemId={item.id} saldo={item.saldo} />
              </Recolhivel>
            )}
            {podeEditar && (
              <Recolhivel titulo="Situação do item">
                <FormSituacaoItem id={item.id} ativo={item.ativo} />
              </Recolhivel>
            )}
          </div>
        </section>
      )}

      {!item.ativo && <Vazio>Item inativo: não recebe movimentações novas.</Vazio>}
      {(podeEntrada || podeSaida) && (
        <>
          <div aria-hidden className="h-16 md:hidden" />
          <nav
            aria-label="Registrar movimentação"
            className={`nao-imprimir fixed inset-x-0 bottom-16 z-20 grid gap-2 border-t border-line bg-surface px-4 py-2.5 md:hidden [&>a]:h-[52px] ${podeEntrada && podeSaida ? 'grid-cols-[1fr_2fr]' : 'grid-cols-1'}`}
          >
            {podeEntrada && (
              <LinkBotao
                href={`/movimentacoes/nova?modo=entrada&item=${item.id}`}
                variante="secundario"
                icone={ArrowDownToLine}
              >
                Entrada
              </LinkBotao>
            )}
            {podeSaida && (
              <LinkBotao
                href={`/movimentacoes/nova?modo=saida&item=${item.id}`}
                icone={ArrowUpFromLine}
              >
                Registrar saída
              </LinkBotao>
            )}
          </nav>
        </>
      )}
    </Pagina>
  )
}

function Numero({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] text-ink-2">{rotulo}</dt>
      <dd className="mt-1 text-base font-semibold">{children}</dd>
    </div>
  )
}

function Recolhivel({
  titulo,
  id,
  children,
}: {
  titulo: string
  id?: string
  children: ReactNode
}) {
  return (
    <details
      id={id}
      className="group min-w-0 rounded-[14px] border border-line bg-surface shadow-cartao"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 font-medium [&::-webkit-details-marker]:hidden">
        {titulo}
        <span aria-hidden className="text-ink-3 transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="border-t border-line px-6 py-5">{children}</div>
    </details>
  )
}
