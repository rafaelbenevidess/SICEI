import type { Metadata } from 'next'
import { pode } from '@/domain/permissoes'
import { Cartao, Pagina, Tabela, Vazio } from '@/components/ui'
import { listarColaboradores } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { BotaoSituacao, FormColaborador } from '../formularios'

export const metadata: Metadata = { title: 'Colaboradores' }

export default async function Colaboradores() {
  const u = await exigirPermissaoDaPagina('cadastros:ver')
  const editar = pode(u.perfil, 'cadastros:editar')
  const lista = await listarColaboradores()
  return (
    <Pagina
      titulo="Colaboradores"
      descricao="Quem retira ou devolve pastilhas no balcão. Não precisam de login (RF-27)."
    >
      {editar && (
        <Cartao titulo="Novo colaborador">
          <FormColaborador />
        </Cartao>
      )}
      {lista.length === 0 ? (
        <Vazio>Nenhum colaborador.</Vazio>
      ) : (
        <Tabela rotulo="Colaboradores">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Matrícula</th>
              <th>Setor</th>
              <th>Situação</th>
              {editar && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{c.matricula ?? '—'}</td>
                <td>{c.setor}</td>
                <td>{c.ativo ? 'Ativo' : 'Inativo'}</td>
                {editar && (
                  <td className="flex flex-wrap gap-2">
                    <details>
                      <summary className="cursor-pointer text-sm underline">Editar</summary>
                      <div className="mt-2 w-80">
                        <FormColaborador id={c.id} valores={c} />
                      </div>
                    </details>
                    <BotaoSituacao entidade="colaborador" id={c.id} ativo={c.ativo} />
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
