import { Gaveta } from '@/components/Gaveta'
import { cadastroDeItem } from '../../../itens/novo/conteudo'

/**
 * O cadastro de /itens/novo aberto numa gaveta por cima da lista de itens ou dos cadastros
 * (rota interceptada). Abrir o endereço direto ou recarregar mostra a página.
 */
export default async function NovoItemNaGaveta() {
  const { titulo, descricao, conteudo } = await cadastroDeItem()
  return (
    <Gaveta titulo={titulo} descricao={descricao}>
      {conteudo}
    </Gaveta>
  )
}
