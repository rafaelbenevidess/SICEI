import type { Metadata } from 'next'
import { formatarCnpj } from '@/domain/cnpj'
import { pode } from '@/domain/permissoes'
import { Cartao, Pagina, Tabela, Vazio } from '@/components/ui'
import { listarFornecedores } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { BotaoSituacao, FormFornecedor } from '../formularios'

export const metadata: Metadata = { title: 'Fornecedores' }

export default async function Fornecedores() {
  const u = await exigirPermissaoDaPagina('cadastros:ver')
  const editar = pode(u.perfil, 'cadastros:editar')
  const lista = await listarFornecedores()
  return (
    <Pagina
      titulo="Fornecedores"
      descricao="CNPJ válido e único, inclusive no formato alfanumérico (RN-04)."
    >
      {editar && (
        <Cartao titulo="Novo fornecedor">
          <FormFornecedor />
        </Cartao>
      )}
      {lista.length === 0 ? (
        <Vazio>Nenhum fornecedor.</Vazio>
      ) : (
        <Tabela rotulo="Fornecedores">
          <thead>
            <tr>
              <th>Razão social</th>
              <th>CNPJ</th>
              <th className="hidden sm:table-cell">Contato</th>
              <th className="text-right">Itens</th>
              <th>Situação</th>
              {editar && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((f) => (
              <tr key={f.id}>
                <td>
                  {f.razaoSocial}
                  {f.nomeFantasia && (
                    <span className="block text-xs text-slate-500">{f.nomeFantasia}</span>
                  )}
                </td>
                <td className="whitespace-nowrap font-mono text-xs">{formatarCnpj(f.cnpj)}</td>
                <td className="hidden sm:table-cell">
                  {[f.contato, f.telefone].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="text-right">{f._count.itens}</td>
                <td>{f.ativo ? 'Ativo' : 'Inativo'}</td>
                {editar && (
                  <td className="flex flex-wrap gap-2">
                    <details>
                      <summary className="cursor-pointer text-sm underline">Editar</summary>
                      <div className="mt-2 w-80">
                        <FormFornecedor id={f.id} valores={{ ...f, cnpj: formatarCnpj(f.cnpj) }} />
                      </div>
                    </details>
                    <BotaoSituacao entidade="fornecedor" id={f.id} ativo={f.ativo} />
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
