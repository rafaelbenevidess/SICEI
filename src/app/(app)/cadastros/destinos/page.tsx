import type { Metadata } from 'next'
import { pode } from '@/domain/permissoes'
import { Cartao, Pagina, Tabela, Vazio } from '@/components/ui'
import { NOME_TIPO_DESTINO } from '@/lib/formatar'
import { listarDestinos } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { BotaoSituacao, FormDestino } from '../formularios'

export const metadata: Metadata = { title: 'Destinos' }

export default async function Destinos() {
  const u = await exigirPermissaoDaPagina('cadastros:ver')
  const editar = pode(u.perfil, 'cadastros:editar')
  const lista = await listarDestinos()
  return (
    <Pagina
      titulo="Destinos"
      descricao="Para onde vai cada saída: máquina, setor ou centro de custo (RN-11)."
    >
      {editar && (
        <Cartao titulo="Novo destino">
          <FormDestino />
        </Cartao>
      )}
      {lista.length === 0 ? (
        <Vazio>Nenhum destino.</Vazio>
      ) : (
        <Tabela rotulo="Destinos">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Situação</th>
              {editar && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((d) => (
              <tr key={d.id}>
                <td className="font-mono text-xs">{d.codigo}</td>
                <td>{d.nome}</td>
                <td>{NOME_TIPO_DESTINO[d.tipo]}</td>
                <td>{d.ativo ? 'Ativo' : 'Inativo'}</td>
                {editar && (
                  <td className="flex flex-wrap gap-2">
                    <details>
                      <summary className="cursor-pointer text-sm underline">Editar</summary>
                      <div className="mt-2 w-80">
                        <FormDestino id={d.id} valores={d} />
                      </div>
                    </details>
                    <BotaoSituacao entidade="destino" id={d.id} ativo={d.ativo} />
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
