import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { urlBanco } from './src/lib/url'

// As migrations rodam com o usuário dono do banco (DIRECT_URL).
// A aplicação usa DATABASE_URL, com o usuário sicei_<empresa>_app, que não pode alterar o histórico (doc 03, seção 5.2).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // react-server: o seed importa módulos marcados com "server-only"
    seed: 'tsx --conditions=react-server prisma/seed.ts',
  },
  datasource: {
    // sem DIRECT_URL (ex.: prisma generate na CI) usa um endereço vazio; generate não conecta no banco
    url: urlBanco(process.env.DIRECT_URL) ?? '',
  },
})
