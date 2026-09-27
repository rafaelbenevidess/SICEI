import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

/** Prisma Client com o usuário da aplicação (simi_app), que não altera o histórico. */
function criarCliente() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

const global = globalThis as unknown as { prismaSicei?: PrismaClient }

export const prisma = global.prismaSicei ?? criarCliente()
if (process.env.NODE_ENV !== 'production') global.prismaSicei = prisma

export type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
