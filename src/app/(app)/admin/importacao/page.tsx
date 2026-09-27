import type { Metadata } from 'next'
import { Pagina } from '@/components/ui'
import { modeloCsv } from '@/server/services/importacao'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { Importacao } from './Importacao'

export const metadata: Metadata = { title: 'Importação' }

/** RF-25: importação da planilha atual. */
export default async function PaginaImportacao() {
  await exigirPermissaoDaPagina('importacao:executar')
  return (
    <Pagina
      titulo="Importação da planilha"
      descricao="Carga inicial de itens e saldos. O saldo entra como ajuste “saldo inicial da implantação”. Nada é gravado antes da prévia."
    >
      <Importacao modelo={modeloCsv()} />
    </Pagina>
  )
}
