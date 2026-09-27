import type { Metadata } from 'next'
import { NOME_DO_PERFIL } from '@/domain/permissoes'
import { Avatar, Cartao, Pagina, Selo, Tabela } from '@/components/ui'
import { formatarDiaHora } from '@/lib/formatar'
import { listarUsuarios } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { AcoesUsuario, FormNovoUsuario } from './formularios'

export const metadata: Metadata = { title: 'Usuários' }

/** RF-02: contas geridas pelo Administrador, com login e senha gerados (RN-21). */
export default async function Usuarios() {
  const eu = await exigirPermissaoDaPagina('usuarios:gerenciar')
  const lista = await listarUsuarios()
  return (
    <Pagina
      titulo="Usuários"
      descricao="Contas geridas só pela empresa. Login e senha gerados pelo sistema; nenhum e-mail."
    >
      <div className="grid items-start gap-6 min-[100rem]:grid-cols-[380px_minmax(0,1fr)]">
        <Cartao titulo="Novo usuário">
          {/* inclui inativos: login nunca é reaproveitado (RN-21b) */}
          <FormNovoUsuario logins={lista.map((u) => u.login)} />
        </Cartao>
        <Tabela rotulo="Usuários" larguraMinima={940}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Login</th>
              <th>Perfil</th>
              <th>Situação</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id} className={u.ativo ? '' : 'opacity-60'}>
                <td>
                  <span className="flex items-center gap-3">
                    <Avatar nome={`${u.nome} ${u.sobrenome}`} />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {u.nome} {u.sobrenome}
                      </span>
                      <span className="text-[13px] text-ink-3">{u.setor}</span>
                    </span>
                  </span>
                </td>
                <td className="font-mono text-[13px]">{u.login}</td>
                <td>{NOME_DO_PERFIL[u.perfil]}</td>
                <td>
                  {!u.ativo ? (
                    <Selo>Inativo</Selo>
                  ) : u.bloqueadoEm ? (
                    <Selo tom="crit">Bloqueado em {formatarDiaHora(u.bloqueadoEm)}</Selo>
                  ) : u.deveTrocarSenha ? (
                    <Selo tom="warn">Aguardando troca de senha</Selo>
                  ) : (
                    <Selo tom="ok">Ativo</Selo>
                  )}
                </td>
                <td>
                  {u.id === eu.id ? (
                    <span className="block text-right text-[13px] text-ink-3">Você</span>
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
      </div>
    </Pagina>
  )
}
