import type { Metadata } from 'next'
import { Cartao, Pagina } from '@/components/ui'
import {
  dadosDoNovoItem,
  listarFabricantes,
  listarFornecedores,
} from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { FormItem } from '../FormItem'

export const metadata: Metadata = { title: 'Novo item' }

export default async function NovoItem() {
  await exigirPermissaoDaPagina('cadastros:editar')
  const [fabricantes, fornecedores, extras] = await Promise.all([
    listarFabricantes(),
    listarFornecedores(),
    dadosDoNovoItem(),
  ])
  return (
    <Pagina
      titulo="Novo item"
      descricao="Cadastro de pastilha (RF-03). Todo item nasce com o fabricante e o fornecedor de onde é comprado; os dois podem ser cadastrados aqui mesmo."
    >
      <Cartao>
        <FormItem
          fabricantes={fabricantes
            .filter((f) => f.ativo)
            .map((f) => ({ valor: f.id, rotulo: f.nome }))}
          fornecedores={fornecedores
            .filter((f) => f.ativo)
            .map((f) => ({ valor: f.id, rotulo: f.nomeFantasia ?? f.razaoSocial }))}
          codigosExistentes={extras.codigos}
          cnpjsExistentes={extras.cnpjsExistentes}
        />
      </Cartao>
    </Pagina>
  )
}
