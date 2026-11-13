import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Cartao } from '@/components/ui'
import { listarFabricantes } from '@/server/consultas/cadastros'
import { itemParaEdicao } from '@/server/consultas/estoque'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { FormItem } from '../../FormItem'

/**
 * Edição de item (RF-03), usada pela página /itens/[id]/editar e pela gaveta que abre por
 * cima da tela do item ou da lista de cadastros. A permissão é conferida aqui.
 */
export async function edicaoDeItem(id: string): Promise<{ titulo: string; conteudo: ReactNode }> {
  await exigirPermissaoDaPagina('cadastros:editar')
  const [dados, fabricantes] = await Promise.all([itemParaEdicao(id), listarFabricantes()])
  if (!dados) notFound()
  const { item, codigoTravado } = dados
  return {
    titulo: `Editar ${item.codigo}`,
    conteudo: (
      <Cartao>
        <FormItem
          valores={item}
          codigoTravado={codigoTravado}
          fabricantes={fabricantes
            .filter((f) => f.ativo || f.id === item.fabricanteId)
            .map((f) => ({ valor: f.id, rotulo: f.nome }))}
        />
      </Cartao>
    ),
  }
}
