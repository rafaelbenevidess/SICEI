import type { ReactNode } from 'react'
import { Cartao } from '@/components/ui'
import {
  dadosDoNovoItem,
  listarFabricantes,
  listarFornecedores,
  opcaoDeFornecedor,
} from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { FormItem } from '../FormItem'

/**
 * Cadastro de item (RF-03), usado pela página /itens/novo e pela gaveta que abre por cima
 * da lista. A permissão é conferida aqui, então vale para os dois caminhos.
 */
export async function cadastroDeItem(): Promise<{
  titulo: string
  descricao: string
  conteudo: ReactNode
}> {
  await exigirPermissaoDaPagina('cadastros:editar')
  const [fabricantes, fornecedores, extras] = await Promise.all([
    listarFabricantes(),
    listarFornecedores(),
    dadosDoNovoItem(),
  ])
  return {
    titulo: 'Novo item',
    descricao:
      'Cadastro de pastilha (RF-03). Todo item nasce com o fabricante e o fornecedor de onde é comprado; os dois podem ser cadastrados aqui mesmo.',
    conteudo: (
      <Cartao>
        <FormItem
          fabricantes={fabricantes
            .filter((f) => f.ativo)
            .map((f) => ({ valor: f.id, rotulo: f.nome }))}
          fornecedores={fornecedores.filter((f) => f.ativo).map(opcaoDeFornecedor)}
          codigosExistentes={extras.codigos}
          cnpjsExistentes={extras.cnpjsExistentes}
        />
      </Cartao>
    ),
  }
}
