// Prepara o banco de teste do zero antes da suíte de integração:
// apaga o schema, recria e aplica as migrations com o usuário dono (simi_owner).
import { execSync } from 'node:child_process'
import pg from 'pg'

export const URL_DONO_TESTE =
  process.env.DIRECT_URL_TESTE ?? 'postgresql://simi_owner:simi_owner_dev@localhost:5432/simi_teste'

export default async function preparar() {
  const cliente = new pg.Client({ connectionString: URL_DONO_TESTE })
  await cliente.connect()
  await cliente.query('DROP SCHEMA IF EXISTS public CASCADE')
  await cliente.query('CREATE SCHEMA public')
  await cliente.end()
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DIRECT_URL: URL_DONO_TESTE },
    stdio: 'pipe',
  })
}
