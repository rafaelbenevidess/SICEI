import { beforeAll, describe, expect, it } from 'vitest'
import type { Ator } from '@/server/contexto'
import {
  dadosDaAnalise,
  lerFiltrosDaAnalise,
  montarCsvDaAnalise,
  opcoesDaAnalise,
} from '@/server/consultas/analise'
import { salvarColaborador, salvarDestino } from '@/server/services/cadastros'
import { estornarMovimentacao, registrarMovimentacao } from '@/server/services/movimentacoes'
import { hojeIso } from '@/lib/formatar'
import { cenario, criarAtor, novaMatricula, unico } from './apoio'

let admin: Ator
let c: Awaited<ReturnType<typeof cenario>>
let outro: Awaited<ReturnType<typeof cenario>>
let destino2: { id: string; codigo: string }
let matricula: string
const hoje = hojeIso()
const filtros = (p: Record<string, string> = {}) =>
  lerFiltrosDaAnalise({ de: hoje, ate: hoje, ...p })

beforeAll(async () => {
  admin = await criarAtor('ADMIN')
  c = await cenario(admin)
  outro = await cenario(admin)
  destino2 = await salvarDestino(admin, { tipo: 'SETOR', codigo: unico('SET'), nome: 'Setor 2' })
  matricula = novaMatricula()
  const colaborador = await salvarColaborador(admin, {
    nome: 'Juliana Martins',
    matricula,
    setor: 'Usinagem',
  })
  for (const cen of [c, outro]) {
    await registrarMovimentacao(admin, {
      tipo: 'COMPRA',
      itemId: cen.item.id,
      quantidade: 30,
      fornecedorId: cen.fornecedor.id,
      precoUnitario: 10,
      notaFiscal: 'NF-ANALISE',
    })
  }
  const saida = (itemId: string, quantidade: number, destinoId: string, colaboradorId: string) =>
    registrarMovimentacao(admin, {
      tipo: 'CONSUMO_PRODUCAO',
      itemId,
      quantidade,
      destinoId,
      ordemProducao: 'OP-ANALISE',
      colaboradorId,
    })
  await saida(c.item.id, 4, c.destino.id, c.colaborador.id)
  await saida(c.item.id, 6, destino2.id, colaborador.id)
  await saida(outro.item.id, 7, c.destino.id, colaborador.id)
  // saída estornada: não conta como consumo
  const errada = await saida(c.item.id, 5, c.destino.id, c.colaborador.id)
  await estornarMovimentacao(admin, {
    movimentacaoId: errada.movimentacao.id,
    justificativa: 'Lançada em dobro',
  })
  await registrarMovimentacao(admin, {
    tipo: 'PERDA_QUEBRA',
    itemId: c.item.id,
    quantidade: 2,
    motivo: 'Caiu no chão',
  })
})

const doItem = (d: Awaited<ReturnType<typeof dadosDaAnalise>>, codigo: string) =>
  d.porDia.filter((l) => l.chave === codigo).reduce((s, l) => s + l.quantidade, 0)

describe('RF-17a · Dados da análise', () => {
  it('consumo do item sem a saída estornada (4 + 6 = 10), com o número de retiradas', async () => {
    const d = await dadosDaAnalise(filtros({ itens: c.item.codigo }))
    expect(d.porDia).toEqual([
      { dia: hoje, chave: c.item.codigo, nome: 'Pastilha de teste', quantidade: 10, vezes: 2 },
    ])
  })

  it('filtro de dois itens traz só os dois (10 e 7)', async () => {
    const d = await dadosDaAnalise(filtros({ itens: `${c.item.codigo},${outro.item.codigo}` }))
    expect(new Set(d.porDia.map((l) => l.chave))).toEqual(
      new Set([c.item.codigo, outro.item.codigo]),
    )
    expect(doItem(d, outro.item.codigo)).toBe(7)
  })

  it('filtros se somam: item + destino → só a retirada daquele destino (4)', async () => {
    const d = await dadosDaAnalise(filtros({ itens: c.item.codigo, destinos: c.destino.codigo }))
    expect(doItem(d, c.item.codigo)).toBe(4)
  })

  it('ver por colaborador, filtrando pela matrícula: 6 + 7 = 13', async () => {
    const d = await dadosDaAnalise(filtros({ por: 'colaborador', colaboradores: matricula }))
    expect(d.porDia).toEqual([
      { dia: hoje, chave: matricula, nome: 'Juliana Martins', quantidade: 13, vezes: 2 },
    ])
  })

  it('medida "perdas" soma só a quebra (2); a perda sem destino aparece como "Sem destino"', async () => {
    const d = await dadosDaAnalise(
      filtros({ medida: 'perdas', por: 'destino', itens: c.item.codigo }),
    )
    expect(d.porDia).toEqual([
      { dia: hoje, chave: 'Sem destino', nome: 'Sem destino', quantidade: 2, vezes: 1 },
    ])
  })

  it('medida "consumo + perdas" soma as duas (10 + 2 = 12)', async () => {
    const d = await dadosDaAnalise(filtros({ medida: 'saidas', itens: c.item.codigo }))
    expect(doItem(d, c.item.codigo)).toBe(12)
  })

  it('ver por aplicação mostra o nome legível', async () => {
    const d = await dadosDaAnalise(filtros({ por: 'aplicacao', itens: c.item.codigo }))
    expect(d.porDia[0]).toMatchObject({ chave: 'TORNEAMENTO', nome: 'Torneamento', quantidade: 10 })
  })

  it('filtro de fabricante pelo nome', async () => {
    const d = await dadosDaAnalise(
      filtros({ por: 'fabricante', fabricantes: outro.fabricante.nome }),
    )
    expect(d.porDia.map((l) => [l.chave, l.quantidade])).toEqual([[outro.fabricante.nome, 7]])
  })

  it('distribui por hora de São Paulo e soma o mesmo total do dia', async () => {
    const d = await dadosDaAnalise(filtros({ itens: c.item.codigo }))
    expect(d.porHora.reduce((s, l) => s + l.quantidade, 0)).toBe(10)
    const h = Number(
      new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        hourCycle: 'h23',
      }).format(new Date()),
    )
    // tolera a virada da hora durante o teste
    expect(d.porHora.some((l) => l.hora === h || l.hora === (h + 23) % 24)).toBe(true)
  })

  it('entradas e saídas do item pelo efeito no saldo: compra e estorno entram, saídas e perda saem', async () => {
    const d = await dadosDaAnalise(filtros({ itens: c.item.codigo }))
    expect(d.fluxo).toEqual([{ dia: hoje, entradas: 30 + 5, saidas: 4 + 6 + 5 + 2 }])
  })

  it('os alertas contam só os itens filtrados', async () => {
    const d = await dadosDaAnalise(filtros({ itens: c.item.codigo }))
    expect(Object.values(d.situacao).reduce((s, n) => s + n, 0)).toBe(1)
  })

  it('as opções dos filtros trazem o item com a descrição e o colaborador pela matrícula', async () => {
    const o = await opcoesDaAnalise()
    expect(o.item.find((i) => i.valor === c.item.codigo)?.detalhe).toBe('Pastilha de teste')
    expect(o.colaborador.find((x) => x.valor === matricula)?.rotulo).toBe('Juliana Martins')
    expect(o.aplicacao.map((a) => a.rotulo)).toContain('Furação')
  })

  it('o CSV traz o consumo dia a dia com os mesmos filtros da tela', async () => {
    const r = await montarCsvDaAnalise({
      de: hoje,
      ate: hoje,
      itens: `${c.item.codigo},${outro.item.codigo}`,
    })
    expect(r.cabecalho).toEqual(['Dia', 'Item', 'Descrição', 'Consumo', 'Retiradas'])
    expect(r.linhas).toContainEqual([hoje, c.item.codigo, 'Pastilha de teste', 10, 2])
    expect(r.linhas).toHaveLength(2)
  })
})
