import pg from 'pg'
import type { Ator } from '@/server/contexto'
import { prisma } from '@/server/db'
import { hashDeSenha } from '@/server/auth/hash'
import {
  criarItem,
  salvarColaborador,
  salvarDestino,
  salvarFabricante,
  salvarFornecedor,
} from '@/server/services/cadastros'
import type { Perfil } from '@/domain/tipos'
import { URL_DONO_TESTE } from './preparar'

let contador = 0
export const unico = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}-${++contador}`

/** Cria um usuário direto no banco e devolve o Ator correspondente. */
export async function criarAtor(perfil: Perfil, senha = 'SenhaDeTeste2026'): Promise<Ator> {
  const login = unico(`teste.${perfil.toLowerCase()}`)
  const senhaHash = await hashDeSenha(senha)
  const u = await prisma.usuario.create({
    data: {
      nome: 'Teste',
      sobrenome: perfil,
      login,
      setor: 'Testes',
      perfil,
      senhaHash,
      deveTrocarSenha: false,
      // como no sistema real, toda senha definida entra no histórico
      historicoSenhas: { create: { senhaHash } },
    },
  })
  return { usuarioId: u.id, login, perfil, ip: '127.0.0.1', userAgent: 'vitest' }
}

/** CNPJ válido gerado a partir de um número (para cadastros únicos em cada teste). */
export function cnpjValidoAleatorio(): string {
  const base = String(Math.floor(Math.random() * 1e12)).padStart(12, '0')
  const dv = (s: string, pesos: number[]) => {
    const r = [...s].reduce((a, c, i) => a + Number(c) * pesos[i], 0) % 11
    return r < 2 ? 0 : 11 - r
  }
  const d1 = dv(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = dv(base + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return `${base}${d1}${d2}`
}

/** Cenário completo: fabricante, fornecedor, item (mínimo 20), destino e colaborador. */
export async function cenario(
  admin: Ator,
  opcoes: { minimo?: number; maximo?: number; embalagem?: number } = {},
) {
  const fabricante = await salvarFabricante(admin, { nome: unico('Fabricante') })
  const fornecedor = await salvarFornecedor(admin, {
    razaoSocial: unico('Fornecedor'),
    cnpj: cnpjValidoAleatorio(),
  })
  const item = await criarItem(
    admin,
    {
      codigo: unico('PST'),
      descricao: 'Pastilha de teste',
      aplicacao: 'TORNEAMENTO',
      fabricanteId: fabricante.id,
      embalagem: opcoes.embalagem ?? 10,
      estoqueMinimo: opcoes.minimo ?? 20,
      estoqueMaximo: opcoes.maximo ?? '',
    },
    { fornecedorId: fornecedor.id, leadTimeDias: 7 },
  )
  const destino = await salvarDestino(admin, {
    tipo: 'MAQUINA',
    codigo: unico('CNC'),
    nome: 'Torno CNC 03',
  })
  const colaborador = await salvarColaborador(admin, { nome: 'Carlos Pereira', setor: 'Usinagem' })
  return { fabricante, fornecedor, item, destino, colaborador }
}

/** Conexão como dono do banco, para simular quem tenta mexer direto nas tabelas. */
export async function comoDono<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: URL_DONO_TESTE })
  await c.connect()
  try {
    return await fn(c)
  } finally {
    await c.end()
  }
}

/** Conexão direta com o usuário da aplicação (simi_app). */
export async function comoAplicacao<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  try {
    return await fn(c)
  } finally {
    await c.end()
  }
}
