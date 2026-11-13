import type { CasoDeTeste } from './tipos'

type Contagem = { OK: number; ATENCAO: number; CRITICO: number; ZERADO: number }

export const casosSaudeDoEstoque: CasoDeTeste<
  Contagem,
  { total: number; emDia: number; emAlerta: number; percentual: number | null }
>[] = [
  {
    descricao: '3 OK, 1 em atenção, 1 crítico e 1 zerado → 50% em dia, 3 em alerta',
    entrada: { OK: 3, ATENCAO: 1, CRITICO: 1, ZERADO: 1 },
    esperado: { total: 6, emDia: 3, emAlerta: 3, percentual: 50 },
  },
  {
    descricao: 'todos OK → 100%',
    entrada: { OK: 12, ATENCAO: 0, CRITICO: 0, ZERADO: 0 },
    esperado: { total: 12, emDia: 12, emAlerta: 0, percentual: 100 },
  },
  {
    descricao: 'nenhum OK → 0%',
    entrada: { OK: 0, ATENCAO: 2, CRITICO: 1, ZERADO: 4 },
    esperado: { total: 7, emDia: 0, emAlerta: 7, percentual: 0 },
  },
  {
    descricao: '2 de 3 OK → 67% (arredonda para o inteiro mais próximo)',
    entrada: { OK: 2, ATENCAO: 1, CRITICO: 0, ZERADO: 0 },
    esperado: { total: 3, emDia: 2, emAlerta: 1, percentual: 67 },
  },
  {
    descricao: 'sem itens cadastrados → percentual nulo, não 0% nem 100%',
    entrada: { OK: 0, ATENCAO: 0, CRITICO: 0, ZERADO: 0 },
    esperado: { total: 0, emDia: 0, emAlerta: 0, percentual: null },
  },
]

export const casosTracosAcesos: CasoDeTeste<
  { percentual: number | null; tracos: number },
  number
>[] = [
  { descricao: '50% de 40 traços → 20', entrada: { percentual: 50, tracos: 40 }, esperado: 20 },
  { descricao: '100% → todos os 40', entrada: { percentual: 100, tracos: 40 }, esperado: 40 },
  { descricao: '0% → nenhum', entrada: { percentual: 0, tracos: 40 }, esperado: 0 },
  {
    descricao: '1% acende um traço: valor acima de zero nunca fica apagado',
    entrada: { percentual: 1, tracos: 40 },
    esperado: 1,
  },
  {
    descricao: '99% deixa um traço apagado: só 100% acende todos',
    entrada: { percentual: 99, tracos: 40 },
    esperado: 39,
  },
  {
    descricao: 'sem percentual (nenhum item) → nenhum',
    entrada: { percentual: null, tracos: 40 },
    esperado: 0,
  },
]

export const casosMatrizDePontos: CasoDeTeste<
  { totais: number[]; linhas: number },
  { unidadesPorPonto: number; pontos: number[] }
>[] = [
  {
    descricao: 'maior dia com 6 unidades em 8 linhas → cada ponto vale 1',
    entrada: { totais: [0, 3, 6, 1], linhas: 8 },
    esperado: { unidadesPorPonto: 1, pontos: [0, 3, 6, 1] },
  },
  {
    descricao: 'maior dia com 14 unidades em 8 linhas → cada ponto vale 2',
    entrada: { totais: [14, 4, 0, 9], linhas: 8 },
    esperado: { unidadesPorPonto: 2, pontos: [7, 2, 0, 5] },
  },
  {
    descricao: 'maior dia com 133 unidades em 8 linhas → cada ponto vale 20',
    entrada: { totais: [0, 0, 133], linhas: 8 },
    esperado: { unidadesPorPonto: 20, pontos: [0, 0, 7] },
  },
  {
    descricao: 'dia com consumo pequeno mostra pelo menos um ponto',
    entrada: { totais: [40, 1], linhas: 8 },
    esperado: { unidadesPorPonto: 5, pontos: [8, 1] },
  },
  {
    descricao: 'mês sem consumo → nenhum ponto',
    entrada: { totais: [0, 0, 0], linhas: 8 },
    esperado: { unidadesPorPonto: 1, pontos: [0, 0, 0] },
  },
  {
    descricao: 'maior dia com 950 unidades em 8 linhas → cada ponto vale 200',
    entrada: { totais: [950, 100], linhas: 8 },
    esperado: { unidadesPorPonto: 200, pontos: [5, 1] },
  },
]

export const casosEscalaDaComparacao: CasoDeTeste<
  { valor: number; referencia: number },
  { valor: number; referencia: number }
>[] = [
  {
    descricao: 'consumo 54 contra 100 no mês anterior → barra em 50%, marca em 92,6%',
    entrada: { valor: 54, referencia: 100 },
    esperado: { valor: 50, referencia: 92.6 },
  },
  {
    descricao: 'consumo acima do mês anterior → a escala segue o consumo',
    entrada: { valor: 150, referencia: 75 },
    esperado: { valor: 92.6, referencia: 46.3 },
  },
  {
    descricao: 'sem consumo nos dois meses → tudo em zero, sem divisão por zero',
    entrada: { valor: 0, referencia: 0 },
    esperado: { valor: 0, referencia: 0 },
  },
]

export const casosVariacaoDoMes: CasoDeTeste<{ atual: number; anterior: number }, number | null>[] =
  [
    {
      descricao: '1.011 contra 1.189 → −15%',
      entrada: { atual: 1011, anterior: 1189 },
      esperado: -15,
    },
    { descricao: '120 contra 100 → +20%', entrada: { atual: 120, anterior: 100 }, esperado: 20 },
    { descricao: 'igual ao anterior → 0%', entrada: { atual: 80, anterior: 80 }, esperado: 0 },
    {
      descricao: 'mês anterior sem consumo → sem variação (null)',
      entrada: { atual: 133, anterior: 0 },
      esperado: null,
    },
  ]

export const casosMediaDiaria: CasoDeTeste<{ total: number; dias: number }, number>[] = [
  {
    descricao: '133 unidades em 12 dias → 11,1 por dia',
    entrada: { total: 133, dias: 12 },
    esperado: 11.1,
  },
  {
    descricao: '30 unidades em 30 dias → 1 por dia',
    entrada: { total: 30, dias: 30 },
    esperado: 1,
  },
  { descricao: 'nenhum dia decorrido → 0', entrada: { total: 10, dias: 0 }, esperado: 0 },
]

export const casosTempoAberto: CasoDeTeste<{ abertoEm: string; agora: string }, string>[] = [
  {
    descricao: 'aberto há 3 horas → hoje',
    entrada: { abertoEm: '2026-09-27T09:00:00-03:00', agora: '2026-09-27T12:00:00-03:00' },
    esperado: 'hoje',
  },
  {
    descricao: 'aberto há 30 horas → há 1 dia',
    entrada: { abertoEm: '2026-09-26T06:00:00-03:00', agora: '2026-09-27T12:00:00-03:00' },
    esperado: 'há 1 dia',
  },
  {
    descricao: 'aberto há 12 dias → há 12 dias',
    entrada: { abertoEm: '2026-09-15T12:00:00-03:00', agora: '2026-09-27T12:00:00-03:00' },
    esperado: 'há 12 dias',
  },
  {
    descricao: 'relógio adiantado no registro (data no futuro) → hoje',
    entrada: { abertoEm: '2026-09-27T13:00:00-03:00', agora: '2026-09-27T12:00:00-03:00' },
    esperado: 'hoje',
  },
]

export const casosDiasDoMes: CasoDeTeste<string, number>[] = [
  { descricao: 'novembro de 2026 → 30 dias', entrada: '2026-11-12', esperado: 30 },
  { descricao: 'dezembro de 2026 → 31 dias', entrada: '2026-12-31', esperado: 31 },
  { descricao: 'fevereiro de 2027 → 28 dias', entrada: '2027-02-01', esperado: 28 },
  { descricao: 'fevereiro de 2028 (bissexto) → 29 dias', entrada: '2028-02-10', esperado: 29 },
]
