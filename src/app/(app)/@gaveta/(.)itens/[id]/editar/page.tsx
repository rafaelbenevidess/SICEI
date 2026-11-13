import { Gaveta } from '@/components/Gaveta'
import { edicaoDeItem } from '../../../../itens/[id]/editar/conteudo'

/**
 * A edição de /itens/[id]/editar aberta numa gaveta por cima da tela do item ou dos
 * cadastros (rota interceptada). Abrir o endereço direto ou recarregar mostra a página.
 */
export default async function EditarItemNaGaveta({ params }: { params: Promise<{ id: string }> }) {
  const { titulo, conteudo } = await edicaoDeItem((await params).id)
  return <Gaveta titulo={titulo}>{conteudo}</Gaveta>
}
