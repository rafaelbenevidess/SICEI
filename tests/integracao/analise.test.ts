import { beforeAll, describe, expect, it } from 'vitest'
import { periodoAnterior } from '@/domain/analise'
import type { Ator } from '@/server/contexto'
import { montarRelatorio } from '@/server/consultas/dadosRelatorio'
import { dadosDaAnalise } from '@/server/consultas/relatorios'
import { estornarMovimentacao, registrarMovimentacao } from '@/server/services/movimentacoes'
import { fimDoDia, hojeIso, inicioDoDia } from '@/lib/formatar'
import { cenario, criarAtor } from './apoio'

let admin: Ator
let c: Awaited<ReturnType<typeof cenario>>
const hoje = hojeIso()
const de = inicioDoDia(hoje)!
const ate = fimDoDia(hoje)!
const deAnterior = inicioDoDia(periodoAnterior(hoje, hoje).deIso)!

beforeAll(async () => {
  admin = await criarAtor('ADMIN')
  c = await cenario(admin)
  await registrarMovimentacao(admin, {
    tipo: 'COMPRA',
    itemId: c.item.id,
    quantidade: 30,
    fornecedorId: c.fornecedor.id,
    precoUnitario: 10,
    notaFiscal: 'NF-ANALISE',
  })
  const saida = (quantidade: number) =>
    registrarMovimentacao(admin, {
      tipo: 'CONSUMO_PRODUCAO',
      itemId: c.item.id,
      quantidade,
      destinoId: c.destino.id,
      ordemProducao: 'OP-ANALISE',
      colaboradorId: c.colaborador.id,
    })
  await saida(4)
  await saida(6)
  // saída estornada: não conta como consumo, mas as duas aparecem no fluxo do estoque
  const errada = await saida(5)
  await estornarMovimentacao(admin, {
    movimentacaoId: errada.movimentacao.id,
    justificativa: 'Lançada em dobro',
  })
})

describe('RF-17a · Dados do painel de análise', () => {
  it('soma o consumo do dia por item, sem a saída estornada (4 + 6 = 10)', async () => {
    const d = await dadosDaAnalise(de, ate, deAnterior, 'item')
    const linha = d.porDia.find((l) => l.chave === c.item.codigo)
    expect(linha).toEqual({
      dia: hoje,
      chave: c.item.codigo,
      nome: 'Pastilha de teste',
      quantidade: 10,
    })
  })

  it('agrupa pelo destino quando o Gestor escolhe destino', async () => {
    const d = await dadosDaAnalise(de, ate, deAnterior, 'destino')
    expect(d.porDia.find((l) => l.chave === c.destino.codigo)?.quantidade).toBe(10)
  })

  it('distribui o consumo por dia da semana e hora de São Paulo', async () => {
    const d = await dadosDaAnalise(de, ate, deAnterior, 'item')
    const agora = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(new Date())
    const doItem = d.porHora.filter((l) => l.chave === c.item.codigo)
    expect(doItem.reduce((s, l) => s + l.quantidade, 0)).toBe(10)
    // a hora gravada é a do relógio da fábrica (tolera a virada da hora durante o teste)
    const horas = doItem.map((l) => l.hora)
    const h = Number(agora)
    expect(horas.some((x) => x === h || x === (h + 23) % 24)).toBe(true)
  })

  it('o fluxo conta o efeito no saldo: entrada da compra e do estorno, saída das três saídas', async () => {
    const d = await dadosDaAnalise(de, ate, deAnterior, 'item')
    const dia = d.fluxo.find((f) => f.dia === hoje)!
    // outros testes podem movimentar o mesmo dia; os deste arquivo estão contidos no total
    expect(dia.entradas).toBeGreaterThanOrEqual(30 + 5)
    expect(dia.saidas).toBeGreaterThanOrEqual(4 + 6 + 5)
  })

  it('conta os itens ativos por status', async () => {
    const d = await dadosDaAnalise(de, ate, deAnterior, 'item')
    const total = Object.values(d.situacao).reduce((s, n) => s + n, 0)
    expect(total).toBeGreaterThanOrEqual(1)
  })

  it('o CSV da aba Análise traz o consumo dia a dia com a descrição', async () => {
    const r = await montarRelatorio({ tipo: 'analise', de: hoje, ate: hoje }, false)
    expect(r.cabecalho).toEqual(['Dia', 'Código', 'Descrição', 'Quantidade consumida'])
    expect(r.linhas).toContainEqual([hoje, c.item.codigo, 'Pastilha de teste', 10])
  })
})
