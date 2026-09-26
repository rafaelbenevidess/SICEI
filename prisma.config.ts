import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// As migrations rodam com o usuário dono do banco (DIRECT_URL).
// A aplicação usa DATABASE_URL, com o usuário simi_app, que não pode alterar o histórico (doc 03, seção 5.2).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // sem DIRECT_URL (ex.: prisma generate na CI) usa um endereço vazio; generate não conecta no banco
    url: process.env.DIRECT_URL ?? '',
  },
})
