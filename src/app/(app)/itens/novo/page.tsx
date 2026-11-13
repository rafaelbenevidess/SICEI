import type { Metadata } from 'next'
import { Pagina } from '@/components/ui'
import { cadastroDeItem } from './conteudo'

export const metadata: Metadata = { title: 'Novo item' }

export default async function NovoItem() {
  const { titulo, descricao, conteudo } = await cadastroDeItem()
  return (
    <Pagina titulo={titulo} descricao={descricao}>
      {conteudo}
    </Pagina>
  )
}
