import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Cartao, Pagina } from '@/components/ui'
import { listarFabricantes } from '@/server/consultas/cadastros'
import { itemParaEdicao } from '@/server/consultas/estoque'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { FormItem } from '../../FormItem'

export const metadata: Metadata = { title: 'Editar item' }

export default async function EditarItem({ params }: { params: Promise<{ id: string }> }) {
  await exigirPermissaoDaPagina('cadastros:editar')
  const { id } = await params
  const [dados, fabricantes] = await Promise.all([itemParaEdicao(id), listarFabricantes()])
  if (!dados) notFound()
  const { item, codigoTravado } = dados
  return (
    <Pagina titulo={`Editar ${item.codigo}`}>
      <Cartao>
        <FormItem
          valores={item}
          codigoTravado={codigoTravado}
          fabricantes={fabricantes
            .filter((f) => f.ativo || f.id === item.fabricanteId)
            .map((f) => ({ valor: f.id, rotulo: f.nome }))}
        />
      </Cartao>
    </Pagina>
  )
}
