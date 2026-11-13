import type { Metadata } from 'next'
import { Pagina } from '@/components/ui'
import { registroDeMovimentacao, type ParametrosDoRegistro } from './conteudo'

export const metadata: Metadata = { title: 'Registrar movimentação' }

/** RF-07 e RF-08: registrar entrada ou saída, com prévia do resultado antes de confirmar. */
export default async function RegistrarMovimentacao({
  searchParams,
}: {
  searchParams: Promise<ParametrosDoRegistro>
}) {
  const { titulo, descricao, conteudo } = await registroDeMovimentacao(await searchParams)
  return (
    <Pagina titulo={titulo} descricao={descricao}>
      {conteudo}
    </Pagina>
  )
}
