import type { Metadata } from 'next'
import { NOME_DO_PERFIL } from '@/domain/permissoes'
import { Cartao, Pagina, Tabela } from '@/components/ui'
import { formatarDataHora } from '@/lib/formatar'
import { listarUsuarios } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { AcoesUsuario, FormNovoUsuario } from './formularios'

export const metadata: Metadata = { title: 'Usuários' }

export default async function Usuarios() {
  const eu = await exigirPermissaoDaPagina('usuarios:gerenciar')
  const lista = await listarUsuarios()
  return (
    <Pagina
      titulo="Usuários"
      descricao="Contas geridas só pela empresa. Login e senha gerados pelo sistema; nenhum e-mail (RN-21)."
    >
      <Cartao titulo="Novo usuário">
        <FormNovoUsuario />
      </Cartao>
      <Tabela rotulo="Usuários">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Login</th>
            <th>Perfil</th>
            <th>Situação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((u) => (
            <tr key={u.id} className="align-top">
              <td>
                {u.nome} {u.sobrenome}
                <span className="block text-xs text-slate-500">{u.setor}</span>
              </td>
              <td className="font-mono text-xs">{u.login}</td>
              <td>{NOME_DO_PERFIL[u.perfil]}</td>
              <td className="text-sm">
                {!u.ativo
                  ? 'Inativo'
                  : u.bloqueadoEm
                    ? `Bloqueado em ${formatarDataHora(u.bloqueadoEm)}`
                    : u.deveTrocarSenha
                      ? 'Aguardando troca de senha'
                      : 'Ativo'}
              </td>
              <td>
                {u.id === eu.id ? (
                  <span className="text-xs text-slate-500">(você)</span>
                ) : (
                  <AcoesUsuario
                    id={u.id}
                    ativo={u.ativo}
                    bloqueado={u.bloqueadoEm !== null}
                    perfil={u.perfil}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Tabela>
    </Pagina>
  )
}
