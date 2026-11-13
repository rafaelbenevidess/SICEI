import { Gaveta } from '@/components/Gaveta'
import {
  registroDeMovimentacao,
  type ParametrosDoRegistro,
} from '../../../movimentacoes/nova/conteudo'

/**
 * O mesmo registro de /movimentacoes/nova, aberto numa gaveta por cima da tela em que a
 * pessoa estava (rota interceptada). Abrir o endereço direto ou recarregar mostra a página.
 */
export default async function RegistrarNaGaveta({
  searchParams,
}: {
  searchParams: Promise<ParametrosDoRegistro>
}) {
  const { titulo, descricao, conteudo } = await registroDeMovimentacao(await searchParams)
  return (
    <Gaveta titulo={titulo} descricao={descricao}>
      {conteudo}
    </Gaveta>
  )
}
