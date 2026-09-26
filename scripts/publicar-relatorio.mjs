// Copia o relatório HTML do Vitest (.vitest) para public/relatorio-testes,
// que o Next.js publica em /relatorio-testes (RNF-13).
import { cpSync, existsSync, rmSync } from 'node:fs'

const origem = '.vitest'
const destino = 'public/relatorio-testes'

if (!existsSync(`${origem}/index.html`)) {
  console.error('Relatório do Vitest não encontrado em .vitest/index.html')
  process.exit(1)
}
rmSync(destino, { recursive: true, force: true })
cpSync(origem, destino, { recursive: true })
console.log(`Relatório de testes copiado para ${destino}`)
