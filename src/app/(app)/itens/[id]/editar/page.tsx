import type { Metadata } from 'next'
import { Pagina } from '@/components/ui'
import { edicaoDeItem } from './conteudo'

export const metadata: Metadata = { title: 'Editar item' }

export default async function EditarItem({ params }: { params: Promise<{ id: string }> }) {
  const { titulo, conteudo } = await edicaoDeItem((await params).id)
  return <Pagina titulo={titulo}>{conteudo}</Pagina>
}
