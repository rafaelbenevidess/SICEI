import { execSync } from 'node:child_process'
import pg from 'pg'

export const SENHA_INICIAL_ADMIN = 'SenhaInicialE2E26'
const URL_DONO =
  process.env.DIRECT_URL_E2E ??
  'postgresql://sicei_dev_owner:sicei_dev_owner_senha@localhost:5432/sicei_e2e'
const URL_APP =
  process.env.DATABASE_URL_E2E ??
  'postgresql://sicei_dev_app:sicei_dev_app_senha@localhost:5432/sicei_e2e'

/** Banco limpo, migrations e dados de demonstração antes da suíte ponta a ponta. */
export default async function preparar() {
  const c = new pg.Client({ connectionString: URL_DONO })
  await c.connect()
  await c.query('DROP SCHEMA IF EXISTS public CASCADE')
  await c.query('CREATE SCHEMA public')
  await c.end()
  const env = { ...process.env, DIRECT_URL: URL_DONO, DATABASE_URL: URL_APP }
  execSync('npx prisma migrate deploy', { env, stdio: 'pipe' })
  execSync('npx prisma db seed', {
    env: { ...env, SEED_DEMO: '1', SEED_SENHA_ADMIN: SENHA_INICIAL_ADMIN },
    stdio: 'pipe',
  })
}
