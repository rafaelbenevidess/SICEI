import type { Parcela, TamanhoDoBalde } from './analise'
import type { CasoDeTeste } from './tipos'

/** Entrada: dias do período. Esperado: de quanto em quanto o gráfico agrupa. */
export const casosTamanhoDoBalde: CasoDeTeste<number, TamanhoDoBalde>[] = [
  { descricao: '31 dias → um ponto por dia', entrada: 31, esperado: 'dia' },
  { descricao: '45 dias → ainda por dia', entrada: 45, esperado: 'dia' },
  { descricao: '90 dias → por semana', entrada: 90, esperado: 'semana' },
  { descricao: '365 dias → por mês', entrada: 365, esperado: 'mes' },
]

/** Entrada: data e tamanho. Esperado: o balde em que a data cai. */
export const casosChaveDoBalde: CasoDeTeste<{ data: string; tamanho: TamanhoDoBalde }, string>[] = [
  {
    descricao: 'quarta 16/09/2026 por semana → segunda 14/09',
    entrada: { data: '2026-09-16', tamanho: 'semana' },
    esperado: '2026-09-14',
  },
  {
    descricao: 'domingo 20/09/2026 por semana → segunda 14/09 (a semana começa na segunda)',
    entrada: { data: '2026-09-20', tamanho: 'semana' },
    esperado: '2026-09-14',
  },
  {
    descricao: 'segunda 14/09/2026 por semana → ela mesma',
    entrada: { data: '2026-09-14', tamanho: 'semana' },
    esperado: '2026-09-14',
  },
  {
    descricao: '27/09/2026 por mês → 2026-09',
    entrada: { data: '2026-09-27', tamanho: 'mes' },
    esperado: '2026-09',
  },
]

/** Entrada: período. Esperado: o período anterior do mesmo tamanho. */
export const casosPeriodoAnterior: CasoDeTeste<
  { deIso: string; ateIso: string },
  { deIso: string; ateIso: string }
>[] = [
  {
    descricao: '28/08 a 27/09 (31 dias) → 28/07 a 27/08',
    entrada: { deIso: '2026-08-28', ateIso: '2026-09-27' },
    esperado: { deIso: '2026-07-28', ateIso: '2026-08-27' },
  },
  {
    descricao: 'um dia só, 27/09 → 26/09',
    entrada: { deIso: '2026-09-27', ateIso: '2026-09-27' },
    esperado: { deIso: '2026-09-26', ateIso: '2026-09-26' },
  },
]

/** Entrada: consumo atual e anterior. Esperado: variação em %, ou null sem base. */
export const casosVariacao: CasoDeTeste<{ atual: number; anterior: number }, number | null>[] = [
  { descricao: '133 contra 100 → +33%', entrada: { atual: 133, anterior: 100 }, esperado: 33 },
  { descricao: '90 contra 120 → −25%', entrada: { atual: 90, anterior: 120 }, esperado: -25 },
  { descricao: '48 contra 36 → +33,3%', entrada: { atual: 48, anterior: 36 }, esperado: 33.3 },
  {
    descricao: 'nada no período anterior → sem percentual',
    entrada: { atual: 10, anterior: 0 },
    esperado: null,
  },
]

const parcelas: Parcela[] = [
  { chave: 'PST-001', nome: 'CNMG', total: 48 },
  { chave: 'PST-006', nome: '16ER', total: 30 },
  { chave: 'PST-004', nome: 'APMT', total: 30 },
  { chave: 'PST-002', nome: 'WNMG', total: 18 },
  { chave: 'PST-003', nome: 'DNMG', total: 5 },
  { chave: 'PST-005', nome: 'SPMG', total: 2 },
]
export const PARCELAS_DE_EXEMPLO = parcelas

/** Entrada: quantos mostrar. Esperado: as chaves exibidas (o resto soma em "Outros"). */
export const casosMaioresEOutros: CasoDeTeste<number, { chaves: string[]; outros: number }>[] = [
  {
    descricao: 'os 4 maiores + Outros (5 + 2 = 7 un.); empate de 30 em ordem de código',
    entrada: 4,
    esperado: { chaves: ['PST-001', 'PST-004', 'PST-006', 'PST-002', 'Outros'], outros: 7 },
  },
  {
    descricao: 'pedindo 8 com só 6 → todos, sem Outros',
    entrada: 8,
    esperado: {
      chaves: ['PST-001', 'PST-004', 'PST-006', 'PST-002', 'PST-003', 'PST-005'],
      outros: 0,
    },
  },
]

/** Entrada: maior valor do gráfico. Esperado: topo do eixo numa conta redonda. */
export const casosEscala: CasoDeTeste<number, { topo: number; passos: number[] }>[] = [
  {
    descricao: 'máximo 48 → eixo até 50, de 10 em 10',
    entrada: 48,
    esperado: { topo: 50, passos: [0, 10, 20, 30, 40, 50] },
  },
  {
    descricao: 'máximo 7 → eixo até 8, de 2 em 2',
    entrada: 7,
    esperado: { topo: 8, passos: [0, 2, 4, 6, 8] },
  },
  {
    descricao: 'máximo 133 → eixo até 150, de 50 em 50',
    entrada: 133,
    esperado: { topo: 150, passos: [0, 50, 100, 150] },
  },
  {
    descricao: 'nada no período → eixo de 0 a 1',
    entrada: 0,
    esperado: { topo: 1, passos: [0, 1] },
  },
]

/** Entrada: o parâmetro "sel" da URL. Esperado: a lista de escolhidos. */
export const casosSelecao: CasoDeTeste<string, string[]>[] = [
  {
    descricao: '"PST-001,PST-004" → os dois, na ordem em que foram escolhidos',
    entrada: 'PST-001,PST-004',
    esperado: ['PST-001', 'PST-004'],
  },
  {
    descricao: '" PST-004 , ,PST-001,PST-004" → sem espaços, vazios nem repetidos',
    entrada: ' PST-004 , ,PST-001,PST-004',
    esperado: ['PST-004', 'PST-001'],
  },
  { descricao: 'vazio → nenhum escolhido (análise de todos)', entrada: '', esperado: [] },
  {
    descricao: '25 códigos → só os 20 primeiros',
    entrada: Array.from({ length: 25 }, (_, i) => `PST-${String(i + 1).padStart(3, '0')}`).join(
      ',',
    ),
    esperado: Array.from({ length: 20 }, (_, i) => `PST-${String(i + 1).padStart(3, '0')}`),
  },
]

/** Entrada: quantos escolhidos e se um deles está em foco. Esperado: um traço por escolhido? */
export const casosComparacao: CasoDeTeste<{ escolhidos: number; emFoco: boolean }, boolean>[] = [
  {
    descricao: 'nenhum escolhido → soma de todos',
    entrada: { escolhidos: 0, emFoco: false },
    esperado: false,
  },
  {
    descricao: '1 escolhido → a linha dele, com o período anterior',
    entrada: { escolhidos: 1, emFoco: false },
    esperado: false,
  },
  {
    descricao: '2 escolhidos → um traço para cada',
    entrada: { escolhidos: 2, emFoco: false },
    esperado: true,
  },
  {
    descricao: '4 escolhidos → um traço para cada',
    entrada: { escolhidos: 4, emFoco: false },
    esperado: true,
  },
  {
    descricao: '5 escolhidos → a soma (mais de 4 cores não se distinguem)',
    entrada: { escolhidos: 5, emFoco: false },
    esperado: false,
  },
  {
    descricao: '3 escolhidos com um em foco pelo clique → só a linha do que está em foco',
    entrada: { escolhidos: 3, emFoco: true },
    esperado: false,
  },
]

/** Entrada: altura da ponta de cada linha e o limite de baixo. Esperado: altura dos rótulos. */
export const casosRotulos: CasoDeTeste<{ ys: number[]; limite: number }, number[]>[] = [
  {
    descricao: 'pontas longe umas das outras → cada rótulo na altura da sua linha',
    entrada: { ys: [20, 80, 150], limite: 200 },
    esperado: [20, 80, 150],
  },
  {
    descricao: 'duas pontas a 4 px → a de baixo desce até ficar a 14 px',
    entrada: { ys: [100, 104], limite: 200 },
    esperado: [100, 114],
  },
  {
    descricao:
      'três linhas terminando em zero (no limite, 200) → empilhadas para cima: 172, 186, 200',
    entrada: { ys: [200, 200, 200], limite: 200 },
    esperado: [172, 186, 200],
  },
]
