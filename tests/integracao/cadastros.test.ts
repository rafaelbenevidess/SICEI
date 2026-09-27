import { beforeAll, describe, expect, it } from 'vitest'
import { ErroDePermissao } from '@/domain/permissoes'
import type { Ator } from '@/server/contexto'
import { prisma } from '@/server/db'
import {
  alterarItem,
  alterarLimites,
  alterarSituacao,
  alterarSituacaoItem,
  atribuirPosicao,
  cadastrarFornecedorParaItem,
  criarPosicao,
  desvincularFornecedor,
  salvarFabricante,
  salvarFornecedor,
  vincularFornecedor,
} from '@/server/services/cadastros'
import { registrarImpressaoDeEtiquetas } from '@/server/services/etiquetas'
import { importarPlanilha, previaImportacao } from '@/server/services/importacao'
import { atualizarParametros } from '@/server/services/parametros'
import { registrarMovimentacao } from '@/server/services/movimentacoes'
import { cenario, cnpjValidoAleatorio, criarAtor, unico } from './apoio'

let admin: Ator
let almoxarife: Ator

beforeAll(async () => {
  admin = await criarAtor('ADMIN')
  almoxarife = await criarAtor('ALMOXARIFE')
})

const posicaoLivre = () => ({
  armario: 1 + Math.floor(Math.random() * 99),
  gaveta: 1 + Math.floor(Math.random() * 99),
  compartimento: 1 + Math.floor(Math.random() * 99),
})

describe('RF-03 a RF-05 · Cadastros', () => {
  it('critério do RF-04: fabricante duplicado sem diferenciar maiúsculas', async () => {
    const nome = unico('Sandvik')
    await salvarFabricante(admin, { nome })
    await expect(salvarFabricante(admin, { nome: nome.toUpperCase() })).rejects.toThrow(
      'Já existe um fabricante com este nome.',
    )
  })

  it('critério do RF-05: CNPJ repetido é recusado', async () => {
    const cnpj = cnpjValidoAleatorio()
    await salvarFornecedor(admin, { razaoSocial: 'A', cnpj })
    await expect(salvarFornecedor(admin, { razaoSocial: 'B', cnpj })).rejects.toThrow(
      'Já existe um fornecedor com este CNPJ.',
    )
  })

  it('critério do RF-03: código travado depois da primeira movimentação (RN-01)', async () => {
    const c = await cenario(admin)
    const dados = {
      codigo: `${c.item.codigo}-NOVO`,
      descricao: c.item.descricao,
      aplicacao: 'TORNEAMENTO',
      fabricanteId: c.fabricante.id,
      embalagem: 10,
      estoqueMinimo: 20,
    }
    await alterarItem(admin, c.item.id, dados) // sem movimentação: pode
    await registrarMovimentacao(admin, {
      tipo: 'COMPRA',
      itemId: c.item.id,
      quantidade: 1,
      fornecedorId: c.fornecedor.id,
      precoUnitario: 1,
      notaFiscal: '1',
    })
    await expect(alterarItem(admin, c.item.id, { ...dados, codigo: 'OUTRO' })).rejects.toThrow(
      /RN-01/,
    )
  })

  it('critério do RF-03: item com saldo não pode ser inativado (RN-03)', async () => {
    const c = await cenario(admin)
    await registrarMovimentacao(admin, {
      tipo: 'COMPRA',
      itemId: c.item.id,
      quantidade: 7,
      fornecedorId: c.fornecedor.id,
      precoUnitario: 1,
      notaFiscal: '1',
    })
    await expect(alterarSituacaoItem(admin, c.item.id, false)).rejects.toThrow('Saldo atual: 7')
  })

  it('item inativado com saldo zero libera a posição e fecha o alerta', async () => {
    const c = await cenario(admin)
    const p = await criarPosicao(admin, posicaoLivre()).catch(() =>
      criarPosicao(admin, posicaoLivre()),
    )
    await atribuirPosicao(admin, c.item.id, p.id)
    await alterarSituacaoItem(admin, c.item.id, false)
    expect((await prisma.posicao.findUniqueOrThrow({ where: { id: p.id } })).itemId).toBeNull()
    expect(await prisma.alerta.count({ where: { itemId: c.item.id, fechadoEm: null } })).toBe(0)
  })

  it('critério do RF-05: só um fornecedor preferencial por item', async () => {
    const c = await cenario(admin)
    const outro = await salvarFornecedor(admin, {
      razaoSocial: 'Outro',
      cnpj: cnpjValidoAleatorio(),
    })
    await vincularFornecedor(admin, {
      itemId: c.item.id,
      fornecedorId: outro.id,
      leadTimeDias: 3,
      preferencial: 'on',
    })
    const vinculos = await prisma.itemFornecedor.findMany({ where: { itemId: c.item.id } })
    expect(vinculos.filter((v) => v.preferencial).map((v) => v.fornecedorId)).toEqual([outro.id])
  })

  it('critério do RF-05: o último fornecedor de item ativo não pode ser desvinculado', async () => {
    const c = await cenario(admin)
    await expect(desvincularFornecedor(admin, c.item.id, c.fornecedor.id)).rejects.toThrow(/RN-05/)
  })

  it('critério do RF-12: mudar o mínimo recalcula o status e grava antes/depois no log', async () => {
    const c = await cenario(admin, { minimo: 5 })
    await registrarMovimentacao(admin, {
      tipo: 'COMPRA',
      itemId: c.item.id,
      quantidade: 10,
      fornecedorId: c.fornecedor.id,
      precoUnitario: 1,
      notaFiscal: '1',
    })
    const r = await alterarLimites(admin, {
      itemId: c.item.id,
      estoqueMinimo: 20,
      estoqueMaximo: '',
    })
    expect(r.status).toBe('CRITICO')
    const log = await prisma.auditLog.findFirstOrThrow({
      where: { acao: 'ITEM_LIMITES_ALTERADOS', entidadeId: c.item.id },
    })
    expect(log.antes).toMatchObject({ estoqueMinimo: 5 })
    expect(log.depois).toMatchObject({ estoqueMinimo: 20 })
  })

  it('Almoxarife não edita cadastros nem limites', async () => {
    await expect(salvarFabricante(almoxarife, { nome: unico('X') })).rejects.toBeInstanceOf(
      ErroDePermissao,
    )
    await expect(
      alterarLimites(almoxarife, { itemId: 'x', estoqueMinimo: 1 }),
    ).rejects.toBeInstanceOf(ErroDePermissao)
  })
})

describe('RF-28 / RN-25 · Posições', () => {
  it('critério do RF-28: código gerado, posição ocupada recusa outro item, troca libera a antiga', async () => {
    const a = await cenario(admin)
    const b = await cenario(admin)
    let p1 = null
    while (!p1) p1 = await criarPosicao(admin, posicaoLivre()).catch(() => null)
    let p2 = null
    while (!p2) p2 = await criarPosicao(admin, posicaoLivre()).catch(() => null)
    expect(p1.codigo).toMatch(/^A\d{2}-G\d{2}-C\d{2}$/)
    await atribuirPosicao(admin, a.item.id, p1.id)
    await expect(atribuirPosicao(admin, b.item.id, p1.id)).rejects.toThrow(
      'Esta posição já está ocupada por outro item.',
    )
    const r = await atribuirPosicao(admin, a.item.id, p2.id)
    expect(r.reimprimirEtiqueta).toBe(true)
    expect((await prisma.posicao.findUniqueOrThrow({ where: { id: p1.id } })).itemId).toBeNull()
  })

  it('RN-26: trocar de posição deixa a etiqueta da nova pendente até ser impressa', async () => {
    const a = await cenario(admin)
    let p1 = null
    while (!p1) p1 = await criarPosicao(admin, posicaoLivre()).catch(() => null)
    let p2 = null
    while (!p2) p2 = await criarPosicao(admin, posicaoLivre()).catch(() => null)
    const pendencia = async (id: string) =>
      (await prisma.posicao.findUniqueOrThrow({ where: { id } })).etiquetaPendente
    expect(await pendencia(p1.id)).toBe(false)
    await atribuirPosicao(admin, a.item.id, p1.id)
    expect(await pendencia(p1.id)).toBe(true)
    await atribuirPosicao(admin, a.item.id, p2.id)
    expect(await pendencia(p1.id)).toBe(false) // a antiga ficou vazia
    expect(await pendencia(p2.id)).toBe(true)

    const r = await registrarImpressaoDeEtiquetas(admin, { codigos: [p2.codigo.toLowerCase()] })
    expect(r.impressas).toEqual([p2.codigo])
    expect(await pendencia(p2.id)).toBe(false)
    const log = await prisma.auditLog.findFirst({ orderBy: { seq: 'desc' } })
    expect(log).toMatchObject({
      acao: 'ETIQUETA_IMPRESSA',
      entidade: 'posicao',
      entidadeId: p2.id,
      usuarioId: admin.usuarioId,
      depois: { etiquetas: 1, posicoes: [`${p2.codigo} (${a.item.codigo})`] },
    })
  })

  it('RN-26: posição vazia não gera etiqueta; Consulta não registra impressão', async () => {
    let vazia = null
    while (!vazia) vazia = await criarPosicao(admin, posicaoLivre()).catch(() => null)
    await expect(registrarImpressaoDeEtiquetas(admin, { codigos: [vazia.codigo] })).rejects.toThrow(
      'Nenhuma das posições tem item guardado.',
    )
    const consulta = await criarAtor('CONSULTA')
    await expect(
      registrarImpressaoDeEtiquetas(consulta, { codigos: [vazia.codigo] }),
    ).rejects.toBeInstanceOf(ErroDePermissao)
  })

  it('posição ocupada não pode ser inativada', async () => {
    const a = await cenario(admin)
    let p = null
    while (!p) p = await criarPosicao(admin, posicaoLivre()).catch(() => null)
    await atribuirPosicao(admin, a.item.id, p.id)
    await expect(alterarSituacao(admin, 'posicao', p.id, false)).rejects.toThrow(
      'Retire o item da posição',
    )
  })
})

describe('RF-25 · Importação da planilha', () => {
  it('prévia aponta fornecedor não cadastrado sem gravar; importação válida grava itens e saldo inicial', async () => {
    const forn = await salvarFornecedor(admin, {
      razaoSocial: 'Ferramentas Sul',
      cnpj: cnpjValidoAleatorio(),
    })
    const cod1 = unico('IMP')
    const cod2 = unico('IMP')
    const cab =
      'codigo;descricao;iso;classe;cobertura;aplicacao;fabricante;embalagem;estoque_minimo;estoque_maximo;fornecedor_cnpj;lead_time_dias;posicao;saldo_inicial'
    const ruim = `${cab}\n${cod1};Pastilha A;;;;TORNEAMENTO;Iscar;10;5;;11.222.333/0001-81;5;;12`
    const previa = await previaImportacao(admin, ruim)
    expect(previa[0]).toMatchObject({
      ok: false,
      erros: ['fornecedor_cnpj: fornecedor não cadastrado no SICEI.'],
      resumo: { codigo: cod1 },
    })
    expect(await prisma.item.count({ where: { codigo: cod1 } })).toBe(0)

    const bom = `${cab}\n${cod1};Pastilha A;;;;TORNEAMENTO;Iscar;10;5;;${forn.cnpj};5;;12\n${cod2};Pastilha B;;;;fresamento;Iscar;10;0;;${forn.cnpj};;;0`
    expect(await importarPlanilha(admin, bom)).toEqual({ itens: 2 })
    const item = await prisma.item.findUniqueOrThrow({
      where: { codigo: cod1 },
      include: { movimentacoes: true },
    })
    expect(item.saldo).toBe(12)
    expect(item.movimentacoes).toMatchObject([
      { tipo: 'AJUSTE_POSITIVO', quantidade: 12, motivo: 'saldo inicial da implantação' },
    ])
  })

  it('arquivo sem as colunas do modelo é recusado', async () => {
    await expect(previaImportacao(admin, 'a;b\n1;2')).rejects.toThrow(/Colunas faltando/)
  })

  it('só o Admin importa', async () => {
    const gestor = await criarAtor('GESTOR')
    await expect(previaImportacao(gestor, 'x')).rejects.toBeInstanceOf(ErroDePermissao)
  })
})

describe('RF-26 · Parâmetros', () => {
  it('só o Admin altera; valores inválidos são recusados', async () => {
    const gestor = await criarAtor('GESTOR')
    await expect(atualizarParametros(gestor, {})).rejects.toBeInstanceOf(ErroDePermissao)
    await expect(
      atualizarParametros(admin, {
        janelaConsumoDias: 0,
        sessaoInatividadeMinutos: 30,
        emailAvisos: '',
      }),
    ).rejects.toThrow('Confira os campos destacados.')
    await atualizarParametros(admin, {
      janelaConsumoDias: 60,
      sessaoInatividadeMinutos: 30,
      emailAvisos: '',
    })
    expect(
      (await prisma.parametro.findUniqueOrThrow({ where: { chave: 'janela_consumo_dias' } })).valor,
    ).toBe('60')
    await atualizarParametros(admin, {
      janelaConsumoDias: 90,
      sessaoInatividadeMinutos: 30,
      emailAvisos: '',
    })
  })
})

describe('RF-05 / RF-07 · Cadastro rápido de fornecedor na entrada', () => {
  it('cria o fornecedor e o vínculo com o item na mesma transação, com os dois no log', async () => {
    const c = await cenario(admin)
    const cnpj = cnpjValidoAleatorio()
    const f = await cadastrarFornecedorParaItem(admin, {
      itemId: c.item.id,
      razaoSocial: unico('Cortemax'),
      cnpj,
      codigoNoFornecedor: 'CX-01',
      leadTimeDias: '4',
    })
    const vinculo = await prisma.itemFornecedor.findUnique({
      where: { itemId_fornecedorId: { itemId: c.item.id, fornecedorId: f.id } },
    })
    expect(vinculo).toMatchObject({
      codigoNoFornecedor: 'CX-01',
      leadTimeDias: 4,
      preferencial: false,
    })
    const log = await prisma.auditLog.findMany({
      where: { OR: [{ entidadeId: f.id }, { entidadeId: c.item.id }] },
      orderBy: { seq: 'asc' },
    })
    expect(log.map((l) => l.acao)).toEqual(
      expect.arrayContaining(['FORNECEDOR_CRIADO', 'FORNECEDOR_VINCULADO']),
    )
  })

  it('CNPJ já cadastrado recusa tudo: nem fornecedor, nem vínculo', async () => {
    const c = await cenario(admin)
    const antes = await prisma.fornecedor.count()
    await expect(
      cadastrarFornecedorParaItem(admin, {
        itemId: c.item.id,
        razaoSocial: 'Repetido',
        cnpj: c.fornecedor.cnpj,
      }),
    ).rejects.toThrow('Já existe um fornecedor com este CNPJ.')
    expect(await prisma.fornecedor.count()).toBe(antes)
  })

  it('Almoxarife registra compra, mas não cadastra fornecedor (matriz de permissões)', async () => {
    const c = await cenario(admin)
    await expect(
      cadastrarFornecedorParaItem(almoxarife, {
        itemId: c.item.id,
        razaoSocial: 'Sem permissão',
        cnpj: cnpjValidoAleatorio(),
      }),
    ).rejects.toBeInstanceOf(ErroDePermissao)
  })
})
