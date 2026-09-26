/**
 * Registro das suítes do Laboratório de testes (doc 03, seção 9.3; RNF-13).
 * Cada suíte usa os MESMOS casos (*.casos.ts) que o Vitest executa, e chama as
 * mesmas funções de src/domain que o sistema usa.
 */
import { decidirAlerta, type NivelAlerta } from '@/domain/alertas'
import { casosAlerta } from '@/domain/alertas.casos'
import { jsonCanonico } from '@/domain/auditoria'
import { cnpjValido } from '@/domain/cnpj'
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
import { avaliarAtribuicao, codigoDaPosicao } from '@/domain/posicao'
import { casosAtribuicao, casosCodigoPosicao } from '@/domain/posicao.casos'
import { ultimoPrecoValido, variacaoPercentual } from '@/domain/precos'
import { casosUltimoPreco, casosVariacao } from '@/domain/precos.casos'
import { validarMovimentacao } from '@/domain/schemas/movimentacao'
import { casosFormularioMovimentacao } from '@/domain/schemas/movimentacao.casos'
import { deveBloquear, problemasDaSenha } from '@/domain/senha'
import { casosBloqueio, casosSenha } from '@/domain/senha.casos'
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
