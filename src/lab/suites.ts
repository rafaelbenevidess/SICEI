/**
 * Registro das suítes do Laboratório de testes (doc 03, seção 9.3; RNF-13).
 * Cada suíte usa os MESMOS casos (*.casos.ts) que o Vitest executa, e chama as
 * mesmas funções de src/domain que o sistema usa.
 */
import { decidirAlerta, type NivelAlerta } from '@/domain/alertas'
import {
  afastarRotulos,
  chaveDoBalde,
  compararNaEvolucao,
  normalizarSelecao,
  escalaDoEixo,
  maioresEOutros,
  periodoAnterior,
  tamanhoDoBalde,
  variacao,
  type TamanhoDoBalde,
} from '@/domain/analise'
import {
  casosChaveDoBalde,
  casosComparacao,
  casosRotulos,
  casosSelecao,
  casosEscala,
  casosMaioresEOutros,
  casosPeriodoAnterior,
  casosTamanhoDoBalde,
  casosVariacao as casosVariacaoDoConsumo,
  PARCELAS_DE_EXEMPLO,
} from '@/domain/analise.casos'
import { schemaFiltrosDaAnalise } from '@/domain/schemas/analise'
import { casosFiltrosDaAnalise, resumirFiltros } from '@/domain/schemas/analise.casos'
import { casosAlerta } from '@/domain/alertas.casos'
import { jsonCanonico } from '@/domain/auditoria'
import { buscarItens, buscarOpcoes } from '@/domain/busca'
import { casosBusca, casosOpcoes, ITENS_DE_EXEMPLO, OPCOES_DE_EXEMPLO } from '@/domain/busca.casos'
import { cnpjValido } from '@/domain/cnpj'
import { codigoEquivalente, padronizarCodigo, proximoCodigo } from '@/domain/codigo'
import {
  casosCodigoEquivalente,
  casosPadronizarCodigo,
  casosProximoCodigo,
  CODIGOS_CADASTRADOS,
} from '@/domain/codigo.casos'
import { casosCnpj } from '@/domain/cnpj.casos'
import {
  consumoMedioDiario,
  leadTimeParaCalculo,
  pontoDeReposicao,
  quantidadeEmUnidades,
  statusDoItem,
  sugestaoDeCompra,
  validarLimites,
} from '@/domain/estoque'
import {
  casosConsumoMedio,
  casosConversao,
  casosLeadTime,
  casosLimites,
  casosPontoReposicao,
  casosStatus,
  casosSugestao,
} from '@/domain/estoque.casos'
import { gerarLogin } from '@/domain/login'
import { casosLogin } from '@/domain/login.casos'
import {
  ajusteDeInventario,
  avaliarEstorno,
  avaliarMovimentacao,
  type TipoComum,
} from '@/domain/movimentacao'
import { casosEstorno, casosInventario, casosMovimentacao } from '@/domain/movimentacao.casos'
import { NOME_DO_PERFIL, PERMISSOES, pode, type Permissao } from '@/domain/permissoes'
import { casosPermissao } from '@/domain/permissoes.casos'
import {
  avaliarAtribuicao,
  codigoDaPosicao,
  codigoDoQr,
  interpretarCodigoDePosicao,
} from '@/domain/posicao'
import {
  casosAtribuicao,
  casosCodigoPosicao,
  casosLeituraQr,
  casosPosicaoDigitada,
} from '@/domain/posicao.casos'
import { ultimoPrecoValido, variacaoPercentual } from '@/domain/precos'
import { casosUltimoPreco, casosVariacao } from '@/domain/precos.casos'
import { validarMovimentacao } from '@/domain/schemas/movimentacao'
import { casosFormularioMovimentacao } from '@/domain/schemas/movimentacao.casos'
import { deveBloquear, problemasDaSenha } from '@/domain/senha'
import { casosBloqueio, casosSenha } from '@/domain/senha.casos'
import { formatarNomeProprio, matriculaValida, normalizarMatricula } from '@/domain/pessoa'
import { casosMatricula, casosNomeProprio, casosSobrenome } from '@/domain/pessoa.casos'
import {
  podeAgirSobreUsuario,
  podeCriarComPerfil,
  type Decisao as DecisaoHierarquia,
} from '@/domain/hierarquia'
import {
  casosCriarComPerfil,
  casosHierarquia,
  type EntradaHierarquia,
} from '@/domain/hierarquia.casos'
import {
  PERFIS,
  STATUS_ITEM,
  type CasoDeTeste,
  type Decisao,
  type Perfil,
  type StatusItem,
} from '@/domain/tipos'

/** Campo do formulário "Criar o seu teste". */
export interface CampoLab {
  nome: string
  rotulo: string
  tipo: 'numero' | 'texto' | 'opcoes'
  opcoes?: { valor: string; rotulo: string }[]
  ajuda?: string
  padrao?: string
}

export interface ResultadoFormulario {
  /** Resultado em texto, comparado com o esperado informado pelo avaliador. */
  resultado: string
  /** A conta ou o raciocínio, com os números informados. */
  explicacao: string
}

export interface SuiteLab {
  id: string
  titulo: string
  regra: string
  casos: CasoDeTeste<unknown, unknown>[]
  executar: (entrada: unknown) => unknown | Promise<unknown>
  formatar: (valor: unknown) => string
  formulario?: {
    campos: CampoLab[]
    esperado: CampoLab
    executar: (valores: Record<string, string>) => ResultadoFormulario
  }
}

// ---------- utilitários ----------

function formatarHierarquia(v: unknown): string {
  const d = v as DecisaoHierarquia
  return d.ok ? 'permitido' : `recusado: ${d.motivo}`
}

/** Compara dois valores pelo JSON canônico (mesma comparação para número, objeto e lista). */
export function iguais(a: unknown, b: unknown): boolean {
  return jsonCanonico(a) === jsonCanonico(b)
}

function num(v: string | undefined): number {
  const t = (v ?? '').trim().replace(',', '.')
  if (t === '') return Number.NaN
  return Number(t)
}

function numOuNull(v: string | undefined): number | null {
  return (v ?? '').trim() === '' ? null : num(v)
}

const br = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })

function formatarDecisao(
  d: unknown,
  formatarValor: (v: unknown) => string = (v) => String(v),
): string {
  const decisao = d as Decisao<unknown>
  return decisao.ok ? `aceita: ${formatarValor(decisao.valor)}` : `recusada: ${decisao.motivo}`
}

function formatarSaldos(v: unknown): string {
  const s = v as { saldoAnterior: number; saldoPosterior: number }
  return `saldo ${s.saldoAnterior} → ${s.saldoPosterior}`
}

function erroComoResultado(e: unknown): ResultadoFormulario {
  return { resultado: 'erro', explicacao: e instanceof Error ? e.message : String(e) }
}

const OPCOES_ACEITA = [
  { valor: 'aceita', rotulo: 'aceita' },
  { valor: 'recusada', rotulo: 'recusada' },
]
const OPCOES_SIM_NAO = [
  { valor: 'sim', rotulo: 'sim' },
  { valor: 'nao', rotulo: 'não' },
]
const OPCOES_STATUS = STATUS_ITEM.map((s) => ({ valor: s, rotulo: s }))
const OPCOES_TIPO_COMUM: { valor: TipoComum; rotulo: string }[] = [
  { valor: 'COMPRA', rotulo: 'COMPRA (entrada)' },
  { valor: 'DEVOLUCAO_PRODUCAO', rotulo: 'DEVOLUCAO_PRODUCAO (entrada)' },
  { valor: 'AJUSTE_POSITIVO', rotulo: 'AJUSTE_POSITIVO (entrada)' },
  { valor: 'CONSUMO_PRODUCAO', rotulo: 'CONSUMO_PRODUCAO (saída)' },
  { valor: 'PERDA_QUEBRA', rotulo: 'PERDA_QUEBRA (saída)' },
  { valor: 'AJUSTE_NEGATIVO', rotulo: 'AJUSTE_NEGATIVO (saída)' },
]

const casos = <E, S>(lista: CasoDeTeste<E, S>[]) => lista as CasoDeTeste<unknown, unknown>[]

// ---------- suítes ----------

export const SUITES: SuiteLab[] = [
  {
    id: 'RN-15',
    titulo: 'Ponto de reposição',
    regra:
      'mínimo + consumo médio diário × lead time, arredondado para cima. Sem consumo ou sem lead time, vale o mínimo.',
    casos: casos(casosPontoReposicao),
    executar: (e) => pontoDeReposicao(e as Parameters<typeof pontoDeReposicao>[0]),
    formatar: (v) => String(v),
    formulario: {
      campos: [
        { nome: 'minimo', rotulo: 'Estoque mínimo', tipo: 'numero', padrao: '20' },
        { nome: 'consumoDiario', rotulo: 'Consumo médio diário', tipo: 'numero', padrao: '3' },
        {
          nome: 'leadTime',
          rotulo: 'Lead time (dias)',
          tipo: 'numero',
          padrao: '7',
          ajuda: 'Deixe em branco para "sem lead time".',
        },
      ],
      esperado: { nome: 'esperado', rotulo: 'Ponto de reposição esperado', tipo: 'numero' },
      executar: (v) => {
        try {
          const entrada = {
            minimo: num(v.minimo),
            consumoDiario: num(v.consumoDiario),
            leadTime: numOuNull(v.leadTime),
          }
          const r = pontoDeReposicao(entrada)
          const conta =
            entrada.leadTime === null || entrada.consumoDiario <= 0
              ? `sem consumo ou sem lead time, vale o mínimo: ${br(entrada.minimo)}`
              : `${br(entrada.minimo)} + ${br(entrada.consumoDiario)} × ${br(entrada.leadTime)} = ${br(entrada.minimo + entrada.consumoDiario * entrada.leadTime)} → arredondado para cima: ${r}`
          return { resultado: String(r), explicacao: conta }
        } catch (e) {
          return erroComoResultado(e)
        }
      },
    },
  },
  {
    id: 'RN-15',
    titulo: 'Lead time usado no cálculo',
    regra: 'Usa o fornecedor preferencial; sem preferencial, o de menor último preço.',
    casos: casos(casosLeadTime),
    executar: (e) => leadTimeParaCalculo(e as Parameters<typeof leadTimeParaCalculo>[0]),
    formatar: (v) => (v === null ? 'nenhum' : `${v} dias`),
  },
  {
    id: 'RN-16',
    titulo: 'Consumo médio diário',
    regra: 'Soma das saídas de consumo na janela ÷ número de dias da janela (padrão 90).',
    casos: casos(casosConsumoMedio),
    executar: (e) => consumoMedioDiario(e as Parameters<typeof consumoMedioDiario>[0]),
    formatar: (v) => br(v as number),
    formulario: {
      campos: [
        {
          nome: 'totalConsumido',
          rotulo: 'Total consumido na janela',
          tipo: 'numero',
          padrao: '270',
        },
        { nome: 'janelaDias', rotulo: 'Janela (dias)', tipo: 'numero', padrao: '90' },
      ],
      esperado: { nome: 'esperado', rotulo: 'Consumo diário esperado', tipo: 'numero' },
      executar: (v) => {
        try {
          const r = consumoMedioDiario({
            totalConsumido: num(v.totalConsumido),
            janelaDias: num(v.janelaDias),
          })
          return {
            resultado: br(r),
            explicacao: `${br(num(v.totalConsumido))} ÷ ${br(num(v.janelaDias))} = ${br(r)} por dia`,
          }
        } catch (e) {
          return erroComoResultado(e)
        }
      },
    },
  },
  {
    id: 'RN-17',
    titulo: 'Status do item',
    regra:
      'ZERADO (saldo 0), CRITICO (≤ mínimo), ATENCAO (≤ ponto de reposição) ou OK. Vale a primeira que se aplicar.',
    casos: casos(casosStatus),
    executar: (e) => statusDoItem(e as Parameters<typeof statusDoItem>[0]),
    formatar: (v) => String(v),
    formulario: {
      campos: [
        { nome: 'saldo', rotulo: 'Saldo', tipo: 'numero', padrao: '35' },
        { nome: 'minimo', rotulo: 'Estoque mínimo', tipo: 'numero', padrao: '20' },
        { nome: 'pontoReposicao', rotulo: 'Ponto de reposição', tipo: 'numero', padrao: '41' },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Status esperado',
        tipo: 'opcoes',
        opcoes: OPCOES_STATUS,
      },
      executar: (v) => {
        const e = {
          saldo: num(v.saldo),
          minimo: num(v.minimo),
          pontoReposicao: num(v.pontoReposicao),
        }
        const r: StatusItem = statusDoItem(e)
        const motivo: Record<StatusItem, string> = {
          ZERADO: `saldo ${e.saldo} ≤ 0`,
          CRITICO: `saldo ${e.saldo} ≤ mínimo ${e.minimo}`,
          ATENCAO: `saldo ${e.saldo} ≤ ponto de reposição ${e.pontoReposicao}`,
          OK: `saldo ${e.saldo} > ponto de reposição ${e.pontoReposicao}`,
        }
        return { resultado: r, explicacao: motivo[r] }
      },
    },
  },
  {
    id: 'RN-20',
    titulo: 'Sugestão de compra',
    regra:
      '(máximo, ou ponto de reposição + consumo × 30) − saldo, arredondado para cima em caixas. Item OK não entra.',
    casos: casos(casosSugestao),
    executar: (e) => sugestaoDeCompra(e as Parameters<typeof sugestaoDeCompra>[0]),
    formatar: (v) => {
      const s = v as { quantidade: number; caixas: number }
      return `${s.quantidade} unidades (${s.caixas} caixas)`
    },
    formulario: {
      campos: [
        { nome: 'saldo', rotulo: 'Saldo', tipo: 'numero', padrao: '35' },
        { nome: 'minimo', rotulo: 'Estoque mínimo', tipo: 'numero', padrao: '20' },
        { nome: 'pontoReposicao', rotulo: 'Ponto de reposição', tipo: 'numero', padrao: '41' },
        {
          nome: 'maximo',
          rotulo: 'Estoque máximo',
          tipo: 'numero',
          padrao: '',
          ajuda: 'Deixe em branco se o item não tem máximo.',
        },
        { nome: 'consumoDiario', rotulo: 'Consumo médio diário', tipo: 'numero', padrao: '3' },
        { nome: 'embalagem', rotulo: 'Unidades por caixa', tipo: 'numero', padrao: '10' },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Quantidade sugerida esperada (unidades)',
        tipo: 'numero',
      },
      executar: (v) => {
        try {
          const e = {
            saldo: num(v.saldo),
            minimo: num(v.minimo),
            pontoReposicao: num(v.pontoReposicao),
            maximo: numOuNull(v.maximo),
            consumoDiario: num(v.consumoDiario),
            embalagem: num(v.embalagem),
          }
          const r = sugestaoDeCompra(e)
          if (r.quantidade === 0)
            return { resultado: '0', explicacao: 'status OK ou saldo já no alvo: nada a comprar' }
          const alvo = e.maximo ?? `${e.pontoReposicao} + ${br(e.consumoDiario)} × 30`
          return {
            resultado: String(r.quantidade),
            explicacao: `alvo = ${alvo}; falta = alvo − ${e.saldo}; arredondado para ${r.caixas} caixas de ${e.embalagem} = ${r.quantidade}`,
          }
        } catch (e) {
          return erroComoResultado(e)
        }
      },
    },
  },
  {
    id: 'RN-07',
    titulo: 'Conversão de caixas em unidades',
    regra: 'O estoque é controlado em unidades inteiras; entrada em caixas é convertida.',
    casos: casos(casosConversao),
    executar: (e) => quantidadeEmUnidades(e as Parameters<typeof quantidadeEmUnidades>[0]),
    formatar: (v) => formatarDecisao(v, (x) => `${x} unidades`),
    formulario: {
      campos: [
        { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'numero', padrao: '3' },
        {
          nome: 'unidade',
          rotulo: 'Informada em',
          tipo: 'opcoes',
          opcoes: [
            { valor: 'CAIXA', rotulo: 'caixas' },
            { valor: 'UNIDADE', rotulo: 'unidades' },
          ],
          padrao: 'CAIXA',
        },
        { nome: 'embalagem', rotulo: 'Unidades por caixa', tipo: 'numero', padrao: '10' },
      ],
      esperado: { nome: 'esperado', rotulo: 'Unidades esperadas', tipo: 'numero' },
      executar: (v) => {
        const r = quantidadeEmUnidades({
          quantidade: num(v.quantidade),
          unidade: v.unidade as 'CAIXA' | 'UNIDADE',
          embalagem: num(v.embalagem),
        })
        return r.ok
          ? {
              resultado: String(r.valor),
              explicacao:
                v.unidade === 'CAIXA'
                  ? `${v.quantidade} × ${v.embalagem} = ${r.valor}`
                  : 'já informado em unidades',
            }
          : { resultado: 'recusada', explicacao: r.motivo }
      },
    },
  },
  {
    id: 'RN-14',
    titulo: 'Estoque mínimo e máximo',
    regra: 'Mínimo obrigatório (≥ 0); máximo opcional e maior que o mínimo.',
    casos: casos(casosLimites),
    executar: (e) => validarLimites(e as Parameters<typeof validarLimites>[0]),
    formatar: (v) => formatarDecisao(v, () => 'ok'),
    formulario: {
      campos: [
        { nome: 'minimo', rotulo: 'Estoque mínimo', tipo: 'numero', padrao: '20' },
        {
          nome: 'maximo',
          rotulo: 'Estoque máximo',
          tipo: 'numero',
          padrao: '20',
          ajuda: 'Em branco = sem máximo.',
        },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Resultado esperado',
        tipo: 'opcoes',
        opcoes: OPCOES_ACEITA,
      },
      executar: (v) => {
        const r = validarLimites({ minimo: num(v.minimo), maximo: numOuNull(v.maximo) })
        return r.ok
          ? { resultado: 'aceita', explicacao: 'limites válidos' }
          : { resultado: 'recusada', explicacao: r.motivo }
      },
    },
  },
  {
    id: 'RN-08',
    titulo: 'Entrada e saída sem saldo negativo',
    regra: 'Saída maior que o saldo é recusada, com a mensagem mostrando quanto existe.',
    casos: casos(casosMovimentacao),
    executar: (e) => avaliarMovimentacao(e as Parameters<typeof avaliarMovimentacao>[0]),
    formatar: (v) => formatarDecisao(v, formatarSaldos),
    formulario: {
      campos: [
        {
          nome: 'tipo',
          rotulo: 'Tipo',
          tipo: 'opcoes',
          opcoes: OPCOES_TIPO_COMUM,
          padrao: 'CONSUMO_PRODUCAO',
        },
        { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'numero', padrao: '5' },
        { nome: 'saldoAtual', rotulo: 'Saldo atual', tipo: 'numero', padrao: '3' },
        {
          nome: 'itemAtivo',
          rotulo: 'Item ativo?',
          tipo: 'opcoes',
          opcoes: OPCOES_SIM_NAO,
          padrao: 'sim',
        },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Resultado esperado',
        tipo: 'opcoes',
        opcoes: OPCOES_ACEITA,
      },
      executar: (v) => {
        const r = avaliarMovimentacao({
          tipo: v.tipo as TipoComum,
          quantidade: num(v.quantidade),
          saldoAtual: num(v.saldoAtual),
          itemAtivo: v.itemAtivo !== 'nao',
        })
        return r.ok
          ? { resultado: 'aceita', explicacao: formatarSaldos(r.valor) }
          : { resultado: 'recusada', explicacao: r.motivo }
      },
    },
  },
  {
    id: 'RN-12',
    titulo: 'Estorno',
    regra: 'Inverte a original uma única vez; estorno não se estorna; o saldo nunca fica negativo.',
    casos: casos(casosEstorno),
    executar: (e) => avaliarEstorno(e as Parameters<typeof avaliarEstorno>[0]),
    formatar: (v) => formatarDecisao(v, formatarSaldos),
    formulario: {
      campos: [
        {
          nome: 'tipo',
          rotulo: 'Tipo da movimentação original',
          tipo: 'opcoes',
          opcoes: [...OPCOES_TIPO_COMUM, { valor: 'ESTORNO', rotulo: 'ESTORNO' }],
          padrao: 'COMPRA',
        },
        { nome: 'quantidade', rotulo: 'Quantidade da original', tipo: 'numero', padrao: '30' },
        {
          nome: 'jaEstornada',
          rotulo: 'Já foi estornada?',
          tipo: 'opcoes',
          opcoes: OPCOES_SIM_NAO,
          padrao: 'nao',
        },
        { nome: 'saldoAtual', rotulo: 'Saldo atual do item', tipo: 'numero', padrao: '10' },
        {
          nome: 'justificativa',
          rotulo: 'Justificativa',
          tipo: 'texto',
          padrao: 'NF lançada em duplicidade',
        },
        {
          nome: 'itemAtivo',
          rotulo: 'Item ativo?',
          tipo: 'opcoes',
          opcoes: OPCOES_SIM_NAO,
          padrao: 'sim',
        },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Resultado esperado',
        tipo: 'opcoes',
        opcoes: OPCOES_ACEITA,
      },
      executar: (v) => {
        const r = avaliarEstorno({
          original: {
            tipo: v.tipo as TipoComum,
            quantidade: num(v.quantidade),
            jaEstornada: v.jaEstornada === 'sim',
          },
          saldoAtual: num(v.saldoAtual),
          justificativa: v.justificativa ?? '',
          itemAtivo: v.itemAtivo !== 'nao',
        })
        return r.ok
          ? { resultado: 'aceita', explicacao: formatarSaldos(r.valor) }
          : { resultado: 'recusada', explicacao: r.motivo }
      },
    },
  },
  {
    id: 'RN-13',
    titulo: 'Ajuste de inventário',
    regra: 'A diferença entre o contado e o saldo vira AJUSTE_POSITIVO ou AJUSTE_NEGATIVO.',
    casos: casos(casosInventario),
    executar: (e) => ajusteDeInventario(e as Parameters<typeof ajusteDeInventario>[0]),
    formatar: (v) =>
      formatarDecisao(v, (x) => {
        const a = x as { tipo: string; quantidade: number } | null
        return a === null ? 'sem ajuste' : `${a.tipo} de ${a.quantidade}`
      }),
    formulario: {
      campos: [
        { nome: 'saldo', rotulo: 'Saldo no sistema', tipo: 'numero', padrao: '25' },
        { nome: 'contado', rotulo: 'Quantidade contada', tipo: 'numero', padrao: '28' },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Ajuste esperado (ex.: AJUSTE_POSITIVO de 3, ou "sem ajuste")',
        tipo: 'texto',
      },
      executar: (v) => {
        const r = ajusteDeInventario({ saldo: num(v.saldo), contado: num(v.contado) })
        if (!r.ok) return { resultado: 'recusada', explicacao: r.motivo }
        if (r.valor === null)
          return { resultado: 'sem ajuste', explicacao: 'a contagem bate com o saldo' }
        return {
          resultado: `${r.valor.tipo} de ${r.valor.quantidade}`,
          explicacao: `contado ${v.contado} − saldo ${v.saldo}`,
        }
      },
    },
  },
  {
    id: 'RN-18',
    titulo: 'Alertas sem repetição',
    regra:
      'Um alerta aberto por item: sobe de nível se piorar, fecha sozinho quando o item volta a OK. E-mail ao entrar em CRITICO ou ZERADO.',
    casos: casos(casosAlerta),
    executar: (e) => decidirAlerta(e as Parameters<typeof decidirAlerta>[0]),
    formatar: (v) => {
      const a = v as { acao: string; nivel?: string; enviarEmail?: boolean }
      return [
        a.acao,
        a.nivel,
        a.enviarEmail ? 'com e-mail' : a.enviarEmail === false ? 'sem e-mail' : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    },
    formulario: {
      campos: [
        {
          nome: 'nivelAberto',
          rotulo: 'Alerta aberto hoje',
          tipo: 'opcoes',
          opcoes: [
            { valor: '', rotulo: 'nenhum' },
            ...(['ATENCAO', 'CRITICO', 'ZERADO'] as const).map((s) => ({ valor: s, rotulo: s })),
          ],
          padrao: 'ATENCAO',
        },
        {
          nome: 'novoStatus',
          rotulo: 'Novo status do item',
          tipo: 'opcoes',
          opcoes: OPCOES_STATUS,
          padrao: 'CRITICO',
        },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Ação esperada',
        tipo: 'opcoes',
        opcoes: ['NENHUMA', 'ABRIR', 'ESCALAR', 'ATUALIZAR', 'FECHAR'].map((a) => ({
          valor: a,
          rotulo: a,
        })),
      },
      executar: (v) => {
        const r = decidirAlerta({
          nivelAberto: (v.nivelAberto || null) as NivelAlerta | null,
          novoStatus: v.novoStatus as StatusItem,
        })
        const email = 'enviarEmail' in r ? (r.enviarEmail ? ', envia e-mail' : ', sem e-mail') : ''
        return {
          resultado: r.acao,
          explicacao: `${r.acao}${'nivel' in r ? ` para ${r.nivel}` : ''}${email}`,
        }
      },
    },
  },
  {
    id: 'RN-05a',
    titulo: 'Último preço do fornecedor',
    regra: 'É o da compra mais recente não estornada.',
    casos: casos(casosUltimoPreco),
    executar: (e) =>
      ultimoPrecoValido(e as Parameters<typeof ultimoPrecoValido>[0])?.precoUnitario ?? null,
    formatar: (v) =>
      v === null ? 'sem preço' : `R$ ${(v as number).toFixed(2).replace('.', ',')}`,
  },
  {
    id: 'RN-05b',
    titulo: 'Variação de preço entre compras',
    regra: '(atual − anterior) ÷ anterior, em %, com 1 casa decimal.',
    casos: casos(casosVariacao),
    executar: (e) => {
      const { anterior, atual } = e as { anterior: number; atual: number }
      return variacaoPercentual(anterior, atual)
    },
    formatar: (v) => `${br(v as number)}%`,
    formulario: {
      campos: [
        { nome: 'anterior', rotulo: 'Preço anterior (R$)', tipo: 'numero', padrao: '37,40' },
        { nome: 'atual', rotulo: 'Preço atual (R$)', tipo: 'numero', padrao: '38,90' },
      ],
      esperado: { nome: 'esperado', rotulo: 'Variação esperada (%)', tipo: 'numero' },
      executar: (v) => {
        try {
          const r = variacaoPercentual(num(v.anterior), num(v.atual))
          return {
            resultado: br(r),
            explicacao: `(${br(num(v.atual))} − ${br(num(v.anterior))}) ÷ ${br(num(v.anterior))} = ${br(r)}%`,
          }
        } catch (e) {
          return erroComoResultado(e)
        }
      },
    },
  },
  {
    id: 'RN-21',
    titulo: 'Geração de login',
    regra:
      'nome.sobrenome sem acentos e sem partículas; se já existe ou existiu, recebe o menor número livre a partir de 2.',
    casos: casos(casosLogin),
    executar: (e) => {
      const { nome, sobrenome, existentes } = e as {
        nome: string
        sobrenome: string
        existentes: string[]
      }
      return gerarLogin(nome, sobrenome, existentes)
    },
    formatar: (v) => String(v),
    formulario: {
      campos: [
        { nome: 'nome', rotulo: 'Nome', tipo: 'texto', padrao: 'Maria Aparecida' },
        { nome: 'sobrenome', rotulo: 'Sobrenome', tipo: 'texto', padrao: 'de Souza' },
        {
          nome: 'existentes',
          rotulo: 'Logins que já existem (separados por vírgula)',
          tipo: 'texto',
          padrao: 'maria.souza',
        },
      ],
      esperado: { nome: 'esperado', rotulo: 'Login esperado', tipo: 'texto' },
      executar: (v) => {
        try {
          const existentes = (v.existentes ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          const r = gerarLogin(v.nome ?? '', v.sobrenome ?? '', existentes)
          return {
            resultado: r,
            explicacao: existentes.length
              ? `logins existentes considerados: ${existentes.join(', ')}`
              : 'nenhum login existente',
          }
        } catch (e) {
          return erroComoResultado(e)
        }
      },
    },
  },
  {
    id: 'RF-02',
    titulo: 'Nome com cara de nome',
    regra:
      'Nome digitado todo em maiúsculas ou todo em minúsculas é gravado com a inicial maiúscula e as partículas (da, de, dos) em minúsculas. Nome já misturado fica como está.',
    casos: casos(casosNomeProprio),
    executar: (e) => formatarNomeProprio(e as string),
    formatar: (v) => String(v),
  },
  {
    id: 'RF-02',
    titulo: 'Sobrenome',
    regra: 'O sobrenome continua o nome: a partícula do começo fica em minúsculas ("da Silva").',
    casos: casos(casosSobrenome),
    executar: (e) => formatarNomeProprio(e as string, { sobrenome: true }),
    formatar: (v) => String(v),
  },
  {
    id: 'RN-21d',
    titulo: 'Matrícula do usuário',
    regra:
      'Sem espaços e em maiúsculas; de 1 a 20 letras, números, ponto, hífen ou barra. Cada matrícula tem um login só.',
    casos: casos(casosMatricula),
    executar: (e) => ({
      matricula: normalizarMatricula(e as string),
      valida: matriculaValida(e as string),
    }),
    formatar: (v) => {
      const r = v as { matricula: string; valida: boolean }
      return `${r.matricula || '(vazia)'}: ${r.valida ? 'aceita' : 'recusada'}`
    },
  },
  {
    id: 'RN-21c',
    titulo: 'Administrador principal',
    regra:
      'Ninguém inativa, rebaixa ou redefine a senha do Administrador principal pelo sistema; só ele gerencia, cria ou promove outros Administradores. Desbloquear é livre, porque só devolve o acesso ao dono.',
    casos: casos(casosHierarquia),
    executar: (e) => {
      const { ator, alvo, acao, novoPerfil } = e as EntradaHierarquia
      return podeAgirSobreUsuario(ator, alvo, acao, novoPerfil)
    },
    formatar: formatarHierarquia,
  },
  {
    id: 'RN-21c',
    titulo: 'Quem cria Administradores',
    regra: 'Um Administrador novo só pode ser criado pelo Administrador principal.',
    casos: casos(casosCriarComPerfil),
    executar: (e) => {
      const { ator, perfil } = e as {
        ator: Parameters<typeof podeCriarComPerfil>[0]
        perfil: Perfil
      }
      return podeCriarComPerfil(ator, perfil)
    },
    formatar: formatarHierarquia,
  },
  {
    id: 'RN-22',
    titulo: 'Política de senha',
    regra: 'Pelo menos 10 caracteres, diferente do login e sem repetir as 3 últimas.',
    casos: casos(casosSenha),
    executar: (e) => problemasDaSenha(e as Parameters<typeof problemasDaSenha>[0]),
    formatar: (v) =>
      (v as string[]).length === 0 ? 'aceita' : `recusada: ${(v as string[]).join(' ')}`,
    formulario: {
      campos: [
        { nome: 'senha', rotulo: 'Nova senha', tipo: 'texto', padrao: 'curta123' },
        { nome: 'login', rotulo: 'Login do usuário', tipo: 'texto', padrao: 'joao.silva' },
        {
          nome: 'ultimas',
          rotulo: 'Últimas 3 senhas (separadas por vírgula)',
          tipo: 'texto',
          padrao: '',
        },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Resultado esperado',
        tipo: 'opcoes',
        opcoes: OPCOES_ACEITA,
      },
      executar: (v) => {
        const ultimas = (v.ultimas ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3)
        const p = problemasDaSenha({
          senha: v.senha ?? '',
          login: v.login ?? '',
          repeteUmaDasUltimas: ultimas.includes(v.senha ?? ''),
        })
        return p.length === 0
          ? { resultado: 'aceita', explicacao: 'atende à política' }
          : { resultado: 'recusada', explicacao: p.join(' ') }
      },
    },
  },
  {
    id: 'RN-22',
    titulo: 'Bloqueio após falhas de login',
    regra: 'A conta é bloqueada na 5ª falha seguida.',
    casos: casos(casosBloqueio),
    executar: (e) => deveBloquear(e as number),
    formatar: (v) => (v ? 'bloqueia' : 'não bloqueia'),
    formulario: {
      campos: [{ nome: 'falhas', rotulo: 'Falhas seguidas', tipo: 'numero', padrao: '5' }],
      esperado: {
        nome: 'esperado',
        rotulo: 'Resultado esperado',
        tipo: 'opcoes',
        opcoes: [
          { valor: 'bloqueia', rotulo: 'bloqueia' },
          { valor: 'não bloqueia', rotulo: 'não bloqueia' },
        ],
      },
      executar: (v) => {
        const r = deveBloquear(num(v.falhas))
        return {
          resultado: r ? 'bloqueia' : 'não bloqueia',
          explicacao: `${v.falhas} falha(s); o limite é 5`,
        }
      },
    },
  },
  {
    id: 'RN-04',
    titulo: 'Validação de CNPJ',
    regra:
      'Dígitos verificadores por módulo 11. Aceita o formato alfanumérico em vigor desde julho de 2026.',
    casos: casos(casosCnpj),
    executar: (e) => cnpjValido(e as string),
    formatar: (v) => (v ? 'válido' : 'inválido'),
    formulario: {
      campos: [{ nome: 'cnpj', rotulo: 'CNPJ', tipo: 'texto', padrao: '12.ABC.345/01DE-35' }],
      esperado: {
        nome: 'esperado',
        rotulo: 'Resultado esperado',
        tipo: 'opcoes',
        opcoes: [
          { valor: 'válido', rotulo: 'válido' },
          { valor: 'inválido', rotulo: 'inválido' },
        ],
      },
      executar: (v) => {
        const r = cnpjValido(v.cnpj ?? '')
        return {
          resultado: r ? 'válido' : 'inválido',
          explicacao: r
            ? 'os dois dígitos verificadores conferem'
            : 'formato ou dígitos verificadores não conferem',
        }
      },
    },
  },
  {
    id: 'RN-25',
    titulo: 'Código da posição',
    regra: 'Armário → Gaveta → Compartimento, cada um de 1 a 99, no formato A01-G03-C04.',
    casos: casos(casosCodigoPosicao),
    executar: (e) => codigoDaPosicao(e as Parameters<typeof codigoDaPosicao>[0]),
    formatar: (v) => formatarDecisao(v),
    formulario: {
      campos: [
        { nome: 'armario', rotulo: 'Armário', tipo: 'numero', padrao: '1' },
        { nome: 'gaveta', rotulo: 'Gaveta', tipo: 'numero', padrao: '3' },
        { nome: 'compartimento', rotulo: 'Compartimento', tipo: 'numero', padrao: '4' },
      ],
      esperado: { nome: 'esperado', rotulo: 'Código esperado', tipo: 'texto' },
      executar: (v) => {
        const r = codigoDaPosicao({
          armario: num(v.armario),
          gaveta: num(v.gaveta),
          compartimento: num(v.compartimento),
        })
        return r.ok
          ? { resultado: r.valor, explicacao: 'dois dígitos por nível' }
          : { resultado: 'recusada', explicacao: r.motivo }
      },
    },
  },
  {
    id: 'RN-25',
    titulo: 'Um item por compartimento',
    regra: 'Posição ocupada por outro item ou inativa não recebe item.',
    casos: casos(casosAtribuicao),
    executar: (e) => avaliarAtribuicao(e as Parameters<typeof avaliarAtribuicao>[0]),
    formatar: (v) => formatarDecisao(v, () => 'ok'),
  },
  {
    id: 'RF-11',
    titulo: 'Busca de itens que aceita o código de qualquer jeito',
    regra:
      'Maiúsculas, acentos, traços, espaços e zeros à esquerda não importam: "Pst001", "pst 1" e "PST-1" acham o PST-001. Código exato vem primeiro.',
    casos: casos(casosBusca),
    executar: (e) => buscarItens(e as string, ITENS_DE_EXEMPLO).map((i) => i.codigo),
    formatar: (v) => ((v as string[]).length ? (v as string[]).join(', ') : 'nenhum'),
    formulario: {
      campos: [
        { nome: 'termo', rotulo: 'O que a pessoa digitou', tipo: 'texto', padrao: 'Pst001' },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Códigos esperados (separados por vírgula; vazio = nenhum)',
        tipo: 'texto',
      },
      executar: (v) => {
        const r = buscarItens(v.termo ?? '', ITENS_DE_EXEMPLO).map((i) => i.codigo)
        return {
          resultado: r.join(', '),
          explicacao: `itens de exemplo: ${ITENS_DE_EXEMPLO.map((i) => i.codigo).join(', ')}`,
        }
      },
    },
  },
  {
    id: 'RF-11',
    titulo: 'Busca nas listas de escolha (fornecedor, colaborador, destino, posição)',
    regra:
      'Acha pelo nome, CNPJ só com números, matrícula ou setor, sem ligar para maiúsculas, acentos, traços e zeros à esquerda.',
    casos: casos(casosOpcoes),
    executar: (e) => buscarOpcoes(e as string, OPCOES_DE_EXEMPLO).map((o) => o.valor),
    formatar: (v) => {
      const l = (v as string[]).map((x) => OPCOES_DE_EXEMPLO.find((o) => o.valor === x)?.rotulo)
      return l.length ? l.join(', ') : 'nenhuma'
    },
  },
  {
    id: 'RN-25',
    titulo: 'Posição digitada de qualquer jeito',
    regra:
      '"a4g2c1", "A4 G2 C1" e "a04-g02-c01" viram A04-G02-C01; o que não for posição é recusado.',
    casos: casos(casosPosicaoDigitada),
    executar: (e) => interpretarCodigoDePosicao(e as string),
    formatar: (v) => (v === null ? 'não é posição' : String(v)),
  },
  {
    id: 'RN-01',
    titulo: 'Código do item no padrão da sequência',
    regra: 'Com PST-001 cadastrado, "pst8" e "PST-8" são gravados como PST-008.',
    casos: casos(casosPadronizarCodigo),
    executar: (e) => padronizarCodigo(e as string, CODIGOS_CADASTRADOS),
    formatar: (v) => String(v),
  },
  {
    id: 'RN-01',
    titulo: 'Código escrito de outro jeito é o mesmo código',
    regra: '"pst001" e "PST1" são o PST-001: o cadastro recusa como código repetido.',
    casos: casos(casosCodigoEquivalente),
    executar: (e) => codigoEquivalente(e as string, CODIGOS_CADASTRADOS),
    formatar: (v) => (v === null ? 'livre' : `igual a ${v}`),
  },
  {
    id: 'RF-03',
    titulo: 'Próximo código interno',
    regra:
      'O cadastro sugere o próximo número da sequência mais usada, com os mesmos zeros à esquerda, pulando códigos que já existem ou existiram.',
    casos: casos(casosProximoCodigo),
    executar: (e) => proximoCodigo(e as string[]),
    formatar: (v) => String(v),
    formulario: {
      campos: [
        {
          nome: 'existentes',
          rotulo: 'Códigos já cadastrados (separados por vírgula)',
          tipo: 'texto',
          padrao: 'PST-001, PST-002, PST-005',
        },
      ],
      esperado: { nome: 'esperado', rotulo: 'Código esperado', tipo: 'texto' },
      executar: (v) => {
        const existentes = (v.existentes ?? '')
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
        return { resultado: proximoCodigo(existentes), explicacao: 'maior número + 1' }
      },
    },
  },
  {
    id: 'RN-26',
    titulo: 'Leitura do QR da etiqueta',
    regra:
      'A câmera lê a URL da etiqueta e o sistema usa só o código da posição (A01-G03-C04). Texto sem código válido não abre nada.',
    casos: casos(casosLeituraQr),
    executar: (e) => codigoDoQr(e as string),
    formatar: (v) => (v === null ? 'não é etiqueta' : String(v)),
    formulario: {
      campos: [
        {
          nome: 'texto',
          rotulo: 'Texto lido pela câmera',
          tipo: 'texto',
          padrao: 'https://sicei-ddausinagem.vercel.app/p/A01-G03-C04',
        },
      ],
      esperado: { nome: 'esperado', rotulo: 'Código esperado', tipo: 'texto' },
      executar: (v) => {
        const r = codigoDoQr(v.texto ?? '')
        return r
          ? { resultado: r, explicacao: 'o sistema abre /p/' + r }
          : { resultado: 'não é etiqueta', explicacao: 'nenhum código de posição válido' }
      },
    },
  },
  {
    id: 'Permissões',
    titulo: 'Matriz de permissões (doc 02, seção 5)',
    regra: 'O servidor confere o perfil em toda ação. Esconder o botão não é proteção.',
    casos: casos(casosPermissao),
    executar: (e) => {
      const { perfil, permissao } = e as { perfil: Perfil; permissao: Permissao }
      return pode(perfil, permissao)
    },
    formatar: (v) => (v ? 'permitido' : 'negado'),
    formulario: {
      campos: [
        {
          nome: 'perfil',
          rotulo: 'Perfil',
          tipo: 'opcoes',
          opcoes: PERFIS.map((p) => ({ valor: p, rotulo: NOME_DO_PERFIL[p] })),
          padrao: 'ALMOXARIFE',
        },
        {
          nome: 'permissao',
          rotulo: 'Ação',
          tipo: 'opcoes',
          opcoes: PERMISSOES.map((p) => ({ valor: p, rotulo: p })),
          padrao: 'movimentacao:estornar',
        },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Resultado esperado',
        tipo: 'opcoes',
        opcoes: [
          { valor: 'permitido', rotulo: 'permitido' },
          { valor: 'negado', rotulo: 'negado' },
        ],
      },
      executar: (v) => {
        const r = pode(v.perfil as Perfil, v.permissao as Permissao)
        return {
          resultado: r ? 'permitido' : 'negado',
          explicacao: `${NOME_DO_PERFIL[v.perfil as Perfil]} → ${v.permissao}`,
        }
      },
    },
  },
  {
    id: 'RN-10 / RN-11',
    titulo: 'Campos obrigatórios da movimentação',
    regra:
      'Compra: fornecedor, preço e NF. Consumo: destino, OP e colaborador. Devolução: destino, colaborador e motivo. Perda: motivo.',
    casos: casos(casosFormularioMovimentacao),
    executar: (e) => {
      const r = validarMovimentacao(e)
      return r.ok ? [] : Object.keys(r.erros)
    },
    formatar: (v) =>
      (v as string[]).length === 0 ? 'aceito' : `faltam/erros: ${(v as string[]).join(', ')}`,
    formulario: {
      campos: [
        {
          nome: 'tipo',
          rotulo: 'Tipo',
          tipo: 'opcoes',
          opcoes: ['COMPRA', 'DEVOLUCAO_PRODUCAO', 'CONSUMO_PRODUCAO', 'PERDA_QUEBRA'].map((t) => ({
            valor: t,
            rotulo: t,
          })),
          padrao: 'CONSUMO_PRODUCAO',
        },
        { nome: 'quantidade', rotulo: 'Quantidade', tipo: 'numero', padrao: '4' },
        { nome: 'fornecedorId', rotulo: 'Fornecedor', tipo: 'texto', padrao: '' },
        { nome: 'precoUnitario', rotulo: 'Preço unitário', tipo: 'numero', padrao: '' },
        { nome: 'notaFiscal', rotulo: 'Nota fiscal', tipo: 'texto', padrao: '' },
        { nome: 'destinoId', rotulo: 'Destino', tipo: 'texto', padrao: 'Torno CNC 03' },
        { nome: 'ordemProducao', rotulo: 'Ordem de produção', tipo: 'texto', padrao: '' },
        { nome: 'colaboradorId', rotulo: 'Colaborador', tipo: 'texto', padrao: 'Carlos Pereira' },
        { nome: 'motivo', rotulo: 'Motivo', tipo: 'texto', padrao: '' },
      ],
      esperado: {
        nome: 'esperado',
        rotulo: 'Resultado esperado',
        tipo: 'opcoes',
        opcoes: [
          { valor: 'aceito', rotulo: 'aceito' },
          { valor: 'recusado', rotulo: 'recusado' },
        ],
      },
      executar: (v) => {
        const r = validarMovimentacao({ ...v, itemId: 'item-demonstracao' })
        return r.ok
          ? { resultado: 'aceito', explicacao: 'todos os campos obrigatórios preenchidos' }
          : { resultado: 'recusado', explicacao: Object.values(r.erros).join(' ') }
      },
    },
  },
  {
    id: 'RF-17a',
    titulo: 'Agrupamento do painel no tempo',
    regra:
      'Até 45 dias o gráfico mostra um ponto por dia; até 200, por semana; acima disso, por mês.',
    casos: casos(casosTamanhoDoBalde),
    executar: (e) => tamanhoDoBalde(e as number),
    formatar: (v) =>
      ({ dia: 'por dia', semana: 'por semana', mes: 'por mês' })[v as TamanhoDoBalde],
  },
  {
    id: 'RF-17a',
    titulo: 'Semana e mês de cada data',
    regra: 'Por semana, a data cai na segunda-feira da sua semana; por mês, no mês dela.',
    casos: casos(casosChaveDoBalde),
    executar: (e) => {
      const { data, tamanho } = e as { data: string; tamanho: TamanhoDoBalde }
      return chaveDoBalde(data, tamanho)
    },
    formatar: (v) => String(v),
  },
  {
    id: 'RF-17a',
    titulo: 'Período anterior para comparar',
    regra: 'O período anterior tem o mesmo número de dias e termina na véspera do início.',
    casos: casos(casosPeriodoAnterior),
    executar: (e) => {
      const { deIso, ateIso } = e as { deIso: string; ateIso: string }
      return periodoAnterior(deIso, ateIso)
    },
    formatar: (v) => {
      const p = v as { deIso: string; ateIso: string }
      return `${p.deIso} a ${p.ateIso}`
    },
  },
  {
    id: 'RF-17a',
    titulo: 'Variação do consumo',
    regra:
      '(atual − anterior) ÷ anterior × 100, com uma casa. Sem consumo no período anterior não há percentual.',
    casos: casos(casosVariacaoDoConsumo),
    executar: (e) => {
      const { atual, anterior } = e as { atual: number; anterior: number }
      return variacao(atual, anterior)
    },
    formatar: (v) => (v === null ? 'sem percentual' : `${br(v as number)}%`),
    formulario: {
      campos: [
        { nome: 'atual', rotulo: 'Consumo no período', tipo: 'numero', padrao: '133' },
        { nome: 'anterior', rotulo: 'Consumo no período anterior', tipo: 'numero', padrao: '100' },
      ],
      esperado: { nome: 'esperado', rotulo: 'Variação esperada (%)', tipo: 'texto' },
      executar: (v) => {
        const atual = num(v.atual)
        const anterior = num(v.anterior)
        const r = variacao(atual, anterior)
        return r === null
          ? { resultado: 'sem percentual', explicacao: 'sem consumo no período anterior' }
          : {
              resultado: String(r),
              explicacao: `(${br(atual)} − ${br(anterior)}) ÷ ${br(anterior)} × 100 = ${br(r)}%`,
            }
      },
    },
  },
  {
    id: 'RF-17a',
    titulo: 'Maiores consumidores e "Outros"',
    regra:
      'O gráfico mostra os maiores pelo total; o resto soma numa barra "Outros". Empate fica em ordem de código.',
    casos: casos(casosMaioresEOutros),
    executar: (e) => {
      const r = maioresEOutros(PARCELAS_DE_EXEMPLO, e as number)
      return {
        chaves: r.map((p) => p.chave),
        outros: r.find((p) => p.chave === 'Outros')?.total ?? 0,
      }
    },
    formatar: (v) => {
      const r = v as { chaves: string[]; outros: number }
      return `${r.chaves.join(', ')}${r.outros ? ` (Outros = ${r.outros})` : ''}`
    },
  },
  {
    id: 'RF-17a',
    titulo: 'Eixo dos gráficos em números redondos',
    regra:
      'O topo do eixo é o menor múltiplo de 1, 2, 2,5 ou 5 (× 10ⁿ) que cabe em até 5 divisões.',
    casos: casos(casosEscala),
    executar: (e) => escalaDoEixo(e as number),
    formatar: (v) => {
      const r = v as { topo: number; passos: number[] }
      return `até ${br(r.topo)}: ${r.passos.map(br).join(', ')}`
    },
  },
  {
    id: 'RF-17a',
    titulo: 'Itens escolhidos para a análise',
    regra:
      'A escolha vem como "PST-001,PST-004": sem espaços, vazios nem repetidos, na ordem em que foram escolhidos (é ela que dá as cores), no máximo 20.',
    casos: casos(casosSelecao),
    executar: (e) => normalizarSelecao(e as string),
    formatar: (v) => ((v as string[]).length ? (v as string[]).join(', ') : 'nenhum'),
  },
  {
    id: 'RF-17a',
    titulo: 'Um traço por escolhido na evolução',
    regra:
      'De 2 a 8 escolhidos, sem nenhum em foco pelo clique, a evolução mostra um traço de cada, com as 8 cores da paleta. Com 1, ou com mais de 8, mostra a soma.',
    casos: casos(casosComparacao),
    executar: (e) => {
      const { escolhidos, emFoco } = e as { escolhidos: number; emFoco: boolean }
      return compararNaEvolucao(escolhidos, emFoco)
    },
    formatar: (v) => (v ? 'um traço por escolhido' : 'a soma'),
  },
  {
    id: 'RF-17a',
    titulo: 'Filtros da página de análise',
    regra:
      'O que vem na URL e não faz sentido vira o padrão (consumo, por item), sem erro. Período invertido é desvirado. Os filtros se somam.',
    casos: casos(casosFiltrosDaAnalise),
    executar: (e) => resumirFiltros(schemaFiltrosDaAnalise.parse(e)),
    formatar: (v) => {
      const r = v as { por: string; medida: string; de?: string; ate?: string; filtros: string }
      const periodo = r.de ? `, ${r.de} a ${r.ate}` : ''
      return `${r.medida} por ${r.por}${periodo}${r.filtros ? `; ${r.filtros}` : ''}`
    },
  },
  {
    id: 'RF-17a',
    titulo: 'Nomes na ponta das linhas sem se sobrepor',
    regra:
      'Cada nome fica na altura da sua linha, a pelo menos 14 px dos outros, sem passar do fim do gráfico: se passar, o grupo sobe.',
    casos: casos(casosRotulos),
    executar: (e) => {
      const { ys, limite } = e as { ys: number[]; limite: number }
      return afastarRotulos(ys, limite)
    },
    formatar: (v) => (v as number[]).join(', '),
  },
]

export interface ResultadoCaso {
  descricao: string
  passou: boolean
  esperado: string
  obtido: string
}

/** Roda um caso oficial. Erros inesperados contam como falha, com a mensagem. */
export async function executarCaso(
  suite: SuiteLab,
  caso: CasoDeTeste<unknown, unknown>,
): Promise<ResultadoCaso> {
  try {
    const obtido = await suite.executar(caso.entrada)
    return {
      descricao: caso.descricao,
      passou: iguais(obtido, caso.esperado),
      esperado: suite.formatar(caso.esperado),
      obtido: suite.formatar(obtido),
    }
  } catch (e) {
    return {
      descricao: caso.descricao,
      passou: false,
      esperado: suite.formatar(caso.esperado),
      obtido: `erro: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

/** Compara o resultado do formulário com o esperado digitado pelo avaliador. */
export function conferirEsperado(resultado: string, esperado: string): boolean {
  const normalizar = (s: string) => {
    const t = s.trim().toLowerCase().replace(',', '.')
    const n = Number(t)
    return t !== '' && Number.isFinite(n) ? String(n) : t.replace(/\s+/g, ' ')
  }
  return normalizar(resultado) === normalizar(esperado)
}

export function totalDeCasos(): number {
  return SUITES.reduce((n, s) => n + s.casos.length, 0)
}
