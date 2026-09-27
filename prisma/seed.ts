/**
 * Seed do SICEI.
 * - Sempre: parâmetros padrão e o usuário "admin" (se ainda não houver nenhum usuário),
 *   com senha provisória mostrada no terminal e troca obrigatória no primeiro acesso (RN-21).
 * - Com SEED_DEMO=1: dados de demonstração criados pelos próprios serviços do sistema,
 *   então tudo passa pelas mesmas regras e fica no log encadeado.
 */
import { gerarSenhaProvisoria } from '../src/domain/senha'
import { registrarAuditoria } from '../src/server/audit/registrar'
import { hashDeSenha } from '../src/server/auth/hash'
import type { Ator } from '../src/server/contexto'
import { prisma } from '../src/server/db'
import { PADROES } from '../src/server/parametros'
import {
  atribuirPosicao,
  criarItem,
  criarPosicao,
  salvarColaborador,
  salvarDestino,
  salvarFabricante,
  salvarFornecedor,
  vincularFornecedor,
} from '../src/server/services/cadastros'
import { registrarMovimentacao } from '../src/server/services/movimentacoes'
import { criarUsuario } from '../src/server/services/usuarios'

async function parametros() {
  for (const [chave, valor] of Object.entries(PADROES)) {
    await prisma.parametro.upsert({ where: { chave }, create: { chave, valor }, update: {} })
  }
}

async function administrador(): Promise<Ator> {
  const existente = await prisma.usuario.findFirst({
    where: { perfil: 'ADMIN' },
    orderBy: { criadoEm: 'asc' },
  })
  if (existente) {
    console.log(`Administrador já existe: ${existente.login}`)
    return {
      usuarioId: existente.id,
      login: existente.login,
      perfil: 'ADMIN',
      ip: null,
      userAgent: 'seed',
    }
  }
  // SEED_SENHA_ADMIN só existe para os testes ponta a ponta; na instalação real a senha é aleatória
  const senha = process.env.SEED_SENHA_ADMIN || gerarSenhaProvisoria()
  const senhaHash = await hashDeSenha(senha)
  const admin = await prisma.$transaction(async (tx) => {
    const u = await tx.usuario.create({
      data: {
        nome: 'Administrador',
        sobrenome: 'do Sistema',
        login: 'admin',
        setor: 'TI',
        perfil: 'ADMIN',
        senhaHash,
      },
    })
    await tx.historicoSenha.create({ data: { usuarioId: u.id, senhaHash } })
    await registrarAuditoria(tx, {
      acao: 'USUARIO_CRIADO',
      entidade: 'usuario',
      entidadeId: u.id,
      depois: { login: u.login, perfil: u.perfil, origem: 'instalação' },
      usuarioId: null,
      ip: null,
      userAgent: 'seed',
    })
    return u
  })
  console.log('\n==============================================')
  console.log(' Administrador inicial criado')
  console.log(`   login: admin`)
  console.log(`   senha provisória: ${senha}`)
  console.log(' A troca de senha é obrigatória no primeiro acesso.')
  console.log('==============================================\n')
  return { usuarioId: admin.id, login: 'admin', perfil: 'ADMIN', ip: null, userAgent: 'seed' }
}

async function demonstracao(admin: Ator) {
  if ((await prisma.item.count()) > 0) {
    console.log('Já existem itens: dados de demonstração não foram criados.')
    return
  }
  const fab = Object.fromEntries(
    await Promise.all(
      ['Sandvik', 'Iscar', 'Kennametal', 'Mitsubishi'].map(async (nome) => [
        nome,
        await salvarFabricante(admin, { nome }),
      ]),
    ),
  )
  const f1 = await salvarFornecedor(admin, {
    razaoSocial: 'Ferramentas Sul Comércio Ltda',
    nomeFantasia: 'Ferramentas Sul',
    cnpj: '11.222.333/0001-81',
    telefone: '(47) 3333-1000',
    contato: 'Paulo',
  })
  const f2 = await salvarFornecedor(admin, {
    razaoSocial: 'Usinagem Catarinense Distribuidora Ltda',
    nomeFantasia: 'UCD',
    cnpj: '12.ABC.345/01DE-35',
    telefone: '(47) 3222-2000',
    contato: 'Fernanda',
  })
  const f3 = await salvarFornecedor(admin, {
    razaoSocial: 'Metal Duro Brasil S.A.',
    nomeFantasia: 'Metal Duro',
    cnpj: '04.252.011/0001-10',
  })
  const destinos = [
    await salvarDestino(admin, { tipo: 'MAQUINA', codigo: 'CNC-01', nome: 'Torno CNC 01' }),
    await salvarDestino(admin, { tipo: 'MAQUINA', codigo: 'CNC-03', nome: 'Torno CNC 03' }),
    await salvarDestino(admin, { tipo: 'MAQUINA', codigo: 'CU-01', nome: 'Centro de usinagem 01' }),
    await salvarDestino(admin, { tipo: 'SETOR', codigo: 'USI', nome: 'Usinagem' }),
    await salvarDestino(admin, {
      tipo: 'CENTRO_CUSTO',
      codigo: 'CC-310',
      nome: 'Centro de custo 310 - Peças',
    }),
  ]
  const colaboradores = [
    await salvarColaborador(admin, {
      nome: 'Carlos Pereira',
      matricula: '1021',
      setor: 'Usinagem',
    }),
    await salvarColaborador(admin, {
      nome: 'Juliana Martins',
      matricula: '1045',
      setor: 'Usinagem',
    }),
    await salvarColaborador(admin, {
      nome: 'Roberto Alves',
      matricula: '1102',
      setor: 'Manutenção',
    }),
  ]

  const itens = [
    {
      codigo: 'PST-001',
      descricao: 'Pastilha CNMG 120408 PM 4325',
      iso: 'CNMG 120408',
      classe: 'P25',
      cobertura: 'CVD',
      aplicacao: 'TORNEAMENTO',
      fab: 'Sandvik',
      min: 20,
      max: 120,
      pos: [1, 1, 1],
      compra: 60,
      consumo: 48,
    },
    {
      codigo: 'PST-002',
      descricao: 'Pastilha WNMG 080408 M15',
      iso: 'WNMG 080408',
      classe: 'M15',
      cobertura: 'PVD',
      aplicacao: 'TORNEAMENTO',
      fab: 'Iscar',
      min: 15,
      max: null,
      pos: [1, 1, 2],
      compra: 30,
      consumo: 18,
    },
    {
      codigo: 'PST-003',
      descricao: 'Pastilha DNMG 150608 P20',
      iso: 'DNMG 150608',
      classe: 'P20',
      cobertura: 'CVD',
      aplicacao: 'TORNEAMENTO',
      fab: 'Kennametal',
      min: 10,
      max: 60,
      pos: [1, 2, 1],
      compra: 40,
      consumo: 5,
    },
    {
      codigo: 'PST-004',
      descricao: 'Pastilha APMT 1604PDER K20',
      iso: 'APMT 1604PDER',
      classe: 'K20',
      cobertura: 'PVD',
      aplicacao: 'FRESAMENTO',
      fab: 'Mitsubishi',
      min: 20,
      max: null,
      pos: [2, 1, 1],
      compra: 30,
      consumo: 30,
    },
    {
      codigo: 'PST-005',
      descricao: 'Pastilha SPMG 07T308 furação',
      iso: 'SPMG 07T308',
      classe: 'P30',
      cobertura: 'PVD',
      aplicacao: 'FURACAO',
      fab: 'Sandvik',
      min: 10,
      max: 50,
      pos: [3, 1, 1],
      compra: 20,
      consumo: 2,
    },
    {
      codigo: 'PST-006',
      descricao: 'Pastilha 16ER 1.5 ISO rosca externa',
      iso: '16ER 1.5 ISO',
      classe: 'M20',
      cobertura: 'PVD',
      aplicacao: 'ROSQUEAMENTO',
      fab: 'Iscar',
      min: 5,
      max: null,
      pos: [4, 1, 1],
      compra: 10,
      consumo: 30,
    },
  ] as const

  for (const d of itens) {
    const item = await criarItem(
      admin,
      {
        codigo: d.codigo,
        descricao: d.descricao,
        iso: d.iso,
        classe: d.classe,
        cobertura: d.cobertura,
        aplicacao: d.aplicacao,
        fabricanteId: fab[d.fab].id,
        embalagem: 10,
        estoqueMinimo: d.min,
        estoqueMaximo: d.max ?? '',
      },
      { fornecedorId: f1.id, leadTimeDias: 5, codigoNoFornecedor: `FS-${d.codigo}` },
    )
    await vincularFornecedor(admin, {
      itemId: item.id,
      fornecedorId: f2.id,
      leadTimeDias: 3,
      codigoNoFornecedor: `UCD-${d.iso}`,
    })
    await vincularFornecedor(admin, { itemId: item.id, fornecedorId: f3.id, leadTimeDias: 10 })
    const pos = await criarPosicao(admin, {
      armario: d.pos[0],
      gaveta: d.pos[1],
      compartimento: d.pos[2],
    })
    await atribuirPosicao(admin, item.id, pos.id)

    // compras em três fornecedores, com preços diferentes (RN-05a/05b)
    await registrarMovimentacao(admin, {
      tipo: 'COMPRA',
      itemId: item.id,
      quantidade: Math.ceil(d.compra / 20),
      unidade: 'CAIXA',
      fornecedorId: f3.id,
      precoUnitario: 37.0,
      notaFiscal: '1001',
    })
    await registrarMovimentacao(admin, {
      tipo: 'COMPRA',
      itemId: item.id,
      quantidade: Math.ceil(d.compra / 20),
      unidade: 'CAIXA',
      fornecedorId: f1.id,
      precoUnitario: 38.9,
      notaFiscal: '2002',
    })
    await registrarMovimentacao(admin, {
      tipo: 'COMPRA',
      itemId: item.id,
      quantidade: 1,
      unidade: 'CAIXA',
      fornecedorId: f2.id,
      precoUnitario: 41.2,
      notaFiscal: '3003',
    }).catch(() => undefined)

    // consumo da produção
    let restante = d.consumo
    let i = 0
    while (restante > 0) {
      const q = Math.min(restante, 1 + (i % 4))
      await registrarMovimentacao(admin, {
        tipo: 'CONSUMO_PRODUCAO',
        itemId: item.id,
        quantidade: q,
        destinoId: destinos[i % destinos.length].id,
        ordemProducao: `2026-${String(400 + i).padStart(4, '0')}`,
        colaboradorId: colaboradores[i % colaboradores.length].id,
      })
      restante -= q
      i++
    }
  }
  await criarPosicao(admin, { armario: 4, gaveta: 2, compartimento: 1 })

  console.log('Dados de demonstração criados. Usuários de exemplo (senhas provisórias):')
  for (const [nome, sobrenome, setor, perfil] of [
    ['Maria', 'de Souza', 'Compras', 'GESTOR'],
    ['João', 'da Silva', 'Almoxarifado', 'ALMOXARIFE'],
    ['Pedro', 'Oliveira', 'Usinagem', 'CONSULTA'],
  ] as const) {
    const u = await criarUsuario(admin, { nome, sobrenome, setor, perfil })
    console.log(
      `   ${perfil.padEnd(10)} login: ${u.login.padEnd(14)} senha provisória: ${u.senhaProvisoria}`,
    )
  }
}

async function principal() {
  await parametros()
  const admin = await administrador()
  if (process.env.SEED_DEMO === '1') await demonstracao(admin)
}

principal()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
