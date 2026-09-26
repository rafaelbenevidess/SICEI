import type { Metadata } from 'next'
import { pode } from '@/domain/permissoes'
import { Cartao, Pagina, Tabela, Vazio } from '@/components/ui'
import { listarFabricantes } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { BotaoSituacao, FormFabricante } from '../formularios'

export const metadata: Metadata = { title: 'Fabricantes' }

export default async function Fabricantes() {
  const u = await exigirPermissaoDaPagina('cadastros:ver')
  const editar = pode(u.perfil, 'cadastros:editar')
  const lista = await listarFabricantes()
  return (
    <Pagina
      titulo="Fabricantes"
      descricao="Nome único, sem diferenciar maiúsculas (RN-04). Com histórico, só inativa (RN-02)."
    >
      {editar && (
        <Cartao titulo="Novo fabricante">
          <FormFabricante />
        </Cartao>
      )}
      {lista.length === 0 ? (
        <Vazio>Nenhum fabricante.</Vazio>
      ) : (
        <Tabela rotulo="Fabricantes">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="text-right">Itens</th>
              <th>Situação</th>
              {editar && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((f) => (
              <tr key={f.id}>
                <td>{f.nome}</td>
                <td className="text-right">{f._count.itens}</td>
                <td>{f.ativo ? 'Ativo' : 'Inativo'}</td>
                {editar && (
                  <td className="flex flex-wrap gap-2">
                    <details>
                      <summary className="cursor-pointer text-sm underline">Editar</summary>
                      <div className="mt-2 w-72">
                        <FormFabricante id={f.id} nome={f.nome} />
                      </div>
                    </details>
                    <BotaoSituacao entidade="fabricante" id={f.id} ativo={f.ativo} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </Pagina>
  )
}
