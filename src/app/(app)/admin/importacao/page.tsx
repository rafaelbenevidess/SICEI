import type { Metadata } from 'next'
import { Cartao, Pagina } from '@/components/ui'
import { modeloCsv } from '@/server/services/importacao'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { Importacao } from './Importacao'

export const metadata: Metadata = { title: 'Importação' }

export default async function PaginaImportacao() {
  await exigirPermissaoDaPagina('importacao:executar')
  return (
    <Pagina
      titulo="Importação da planilha"
      descricao="Carga inicial de itens e saldos (RF-25). O saldo entra como ajuste “saldo inicial da implantação”."
    >
      <Cartao>
        <Importacao modelo={modeloCsv()} />
      </Cartao>
    </Pagina>
  )
}
