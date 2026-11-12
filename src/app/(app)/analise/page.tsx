import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, RotateCcw } from 'lucide-react'
import { BotaoImprimir } from '@/components/BotaoImprimir'
import { EscolhaSegmentada, SelecaoMultipla } from '@/components/formulario'
import { classeBotao, LinkBotao, Pagina, Segmentado } from '@/components/ui'
import { LIMITE_DA_SELECAO, periodoAnterior } from '@/domain/analise'
import {
  DIMENSOES,
  escolhidosDaDimensao,
  FILTRO_DA_DIMENSAO,
  MEDIDAS,
  NOME_DA_DIMENSAO,
  NOME_DA_MEDIDA,
  parametrosDaAnalise,
  type Dimensao,
} from '@/domain/schemas/analise'
import { diasAtrasIso, formatarData, hojeIso, inicioDoDia } from '@/lib/formatar'
import { dadosDaAnalise, lerFiltrosDaAnalise, opcoesDaAnalise } from '@/server/consultas/analise'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { PainelAnalitico } from './PainelAnalitico'

export const metadata: Metadata = { title: 'Análise' }

const campo = 'h-10 rounded-lg border border-line-2 bg-surface px-3 text-base text-ink sm:text-sm'
const NOTA = 'Quantidades em unidades. O SICEI não calcula valor de estoque em reais.'

/** Como cada dimensão aparece: pelo código, pelo nome da pessoa ou só pelo nome. */
const APRESENTAR: Record<Dimensao, 'codigo' | 'pessoa' | 'nome'> = {
  item: 'codigo',
  destino: 'codigo',
  colaborador: 'pessoa',
  aplicacao: 'nome',
  fabricante: 'nome',
}

/**
 * RF-17a: análise personalizada. O Gestor escolhe o período, o que medir, por onde comparar e
 * filtra por itens, destinos, colaboradores, aplicações e fabricantes, em qualquer combinação.
 */
export default async function PaginaAnalise({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await exigirPermissaoDaPagina('relatorios:ver')
  const f = lerFiltrosDaAnalise(await searchParams)
  const [dados, opcoes] = await Promise.all([dadosDaAnalise(f), opcoesDaAnalise()])
  const anterior = periodoAnterior(f.de, f.ate)
  const parametros = parametrosDaAnalise(f)
  const csv = `/analise/csv?${new URLSearchParams(parametros)}`
  const rotuloDe = (d: Dimensao, valor: string) =>
    opcoes[d].find((o) => o.valor === valor)?.rotulo ?? valor

  const filtrosDeItem = f.itens.length + f.aplicacoes.length + f.fabricantes.length > 0
  const filtrosDaSaida = f.destinos.length + f.colaboradores.length > 0
  const resumo = DIMENSOES.filter((d) => f[FILTRO_DA_DIMENSAO[d]].length).map(
    (d) =>
      `${NOME_DA_DIMENSAO[d].plural}: ${f[FILTRO_DA_DIMENSAO[d]].map((v) => rotuloDe(d, v)).join(', ')}`,
  )
  const periodo = `de ${formatarData(inicioDoDia(f.de)!)} até ${formatarData(inicioDoDia(f.ate)!)}`

  const filtros = (
    <form action="/analise" className="nao-imprimir flex flex-col gap-5 cartao p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          De
          <input type="date" name="de" defaultValue={f.de} className={campo} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Até
          <input type="date" name="ate" defaultValue={f.ate} className={campo} />
        </label>
        <div className="flex flex-col gap-1.5 text-[13px] font-medium">
          <span>Períodos prontos</span>
          <Segmentado
            rotulo="Período pronto"
            opcoes={[7, 30, 90, 365].map((d) => ({
              href: `/analise?${new URLSearchParams({ ...parametros, de: diasAtrasIso(d - 1), ate: hojeIso() })}`,
              rotulo: d === 365 ? '12 meses' : `${d} dias`,
              ativo: f.ate === hojeIso() && f.de === diasAtrasIso(d - 1),
            }))}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <EscolhaSegmentada
          nome="medida"
          rotulo="O que medir"
          padrao={f.medida}
          opcoes={MEDIDAS.map((m) => ({ valor: m, rotulo: NOME_DA_MEDIDA[m].titulo }))}
        />
        <EscolhaSegmentada
          nome="por"
          rotulo="Comparar por"
          padrao={f.por}
          opcoes={DIMENSOES.map((d) => ({ valor: d, rotulo: NOME_DA_DIMENSAO[d].singular }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 min-[75rem]:grid-cols-3 min-[96rem]:grid-cols-5">
        {DIMENSOES.map((d) => (
          <SelecaoMultipla
            key={d}
            nome={FILTRO_DA_DIMENSAO[d]}
            rotulo={NOME_DA_DIMENSAO[d].plural}
            opcoes={opcoes[d]}
            padrao={f[FILTRO_DA_DIMENSAO[d]]}
            limite={LIMITE_DA_SELECAO}
            placeholder={NOME_DA_DIMENSAO[d].todos}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={classeBotao('primario')}>
          Aplicar
        </button>
        <Link href="/analise" className={classeBotao('secundario')}>
          <RotateCcw aria-hidden />
          Limpar filtros
        </Link>
        <p className="text-[13px] text-ink-3">
          Os filtros se somam: itens escolhidos e um destino mostram só as retiradas daqueles itens
          naquele destino. Escolha de 2 a 8 em &quot;Comparar por&quot; para ver um traço de cada.
        </p>
      </div>
    </form>
  )

  return (
    <Pagina
      titulo="Análise"
      descricao={`${NOME_DA_MEDIDA[f.medida].titulo} por ${NOME_DA_DIMENSAO[f.por].singular.toLowerCase()}, ${periodo}.`}
      acoes={
        <>
          <BotaoImprimir />
          <LinkBotao href={csv} icone={Download}>
            Exportar CSV
          </LinkBotao>
        </>
      }
    >
      {filtros}
      <p className="text-[13px] text-ink-2" aria-label="Filtros aplicados">
        {resumo.length
          ? `Filtros: ${resumo.join(' · ')}.`
          : 'Sem filtros: tudo o que saiu no período.'}
      </p>
      <PainelAnalitico
        // filtros novos: o foco do clique recomeça
        key={JSON.stringify(parametros)}
        dados={{
          deIso: f.de,
          ateIso: f.ate,
          anterior,
          dimensao: NOME_DA_DIMENSAO[f.por],
          apresentar: APRESENTAR[f.por],
          medida: NOME_DA_MEDIDA[f.medida],
          escolhidos: escolhidosDaDimensao(f).map((chave) => ({
            chave,
            nome:
              f.por === 'item' || f.por === 'destino'
                ? (opcoes[f.por].find((o) => o.valor === chave)?.detalhe ?? chave)
                : rotuloDe(f.por, chave),
          })),
          notaDoFluxo: filtrosDeItem
            ? `Só os itens dos filtros: compras, devoluções e ajustes para cima; consumo, perdas e ajustes para baixo.${filtrosDaSaida ? ' Destino e colaborador não valem aqui, porque compra não tem destino.' : ''}`
            : `Todos os itens: compras, devoluções e ajustes para cima; consumo, perdas e ajustes para baixo.${filtrosDaSaida ? ' Destino e colaborador não valem aqui, porque compra não tem destino.' : ''}`,
          alertasFiltrados: filtrosDeItem,
          ...dados,
        }}
      />
      <p className="text-[13px] text-ink-3">{NOTA}</p>
    </Pagina>
  )
}
