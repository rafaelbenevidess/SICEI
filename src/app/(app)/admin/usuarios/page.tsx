import type { Metadata } from 'next'
import { ShieldCheck, UserPlus } from 'lucide-react'
import { podeAgirSobreUsuario, podeCriarComPerfil } from '@/domain/hierarquia'
import { NOME_DO_PERFIL } from '@/domain/permissoes'
import { Gaveta } from '@/components/Gaveta'
import { Avatar, LinkBotao, Pagina, Selo, Tabela } from '@/components/ui'
import { formatarDiaHora } from '@/lib/formatar'
import { listarUsuarios } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { AcoesUsuario, FormEditarUsuario, FormNovoUsuario } from './formularios'

export const metadata: Metadata = { title: 'Usuários' }

/**
 * RF-02: contas geridas pelo Administrador, com login e senha gerados (RN-21). A tabela ocupa
 * a tela; criar (?novo=1) e editar (?editar=id) abrem numa gaveta por cima dela (RNF-14).
 */
export default async function Usuarios({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; novo?: string }>
}) {
  const eu = await exigirPermissaoDaPagina('usuarios:gerenciar')
  const { editar, novo } = await searchParams
  const lista = await listarUsuarios()
  // RN-21c: o principal vem do banco, não da sessão
  const ator = {
    id: eu.id,
    perfil: eu.perfil,
    principal: lista.some((u) => u.id === eu.id && u.principal),
  }
  const podeCriarAdmin = podeCriarComPerfil(ator, 'ADMIN').ok
  const pode = (u: (typeof lista)[number], acao: Parameters<typeof podeAgirSobreUsuario>[2]) =>
    podeAgirSobreUsuario(ator, u, acao).ok
  const emEdicao = lista.find((u) => u.id === editar && pode(u, 'editar-dados'))

  return (
    <Pagina
      titulo="Usuários"
      descricao="Contas geridas só pela empresa. Login e senha gerados pelo sistema; nenhum e-mail. Cada funcionário tem um login só, ligado à matrícula."
      acoes={
        <LinkBotao href="/admin/usuarios?novo=1" icone={UserPlus} scroll={false}>
          Novo usuário
        </LinkBotao>
      }
    >
      <Tabela rotulo="Usuários" larguraMinima={900}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Matrícula</th>
            <th>Login</th>
            <th>Perfil</th>
            <th>Situação</th>
            <th className="text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((u) => (
            <tr
              key={u.id}
              className={`${u.ativo ? '' : 'opacity-60'} ${u.id === emEdicao?.id ? 'bg-accent-soft' : ''}`}
            >
              <td>
                <span className="flex items-center gap-3">
                  <Avatar nome={`${u.nome} ${u.sobrenome}`} />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                      {u.nome} {u.sobrenome}
                      {u.principal && (
                        <Selo tom="accent">
                          <ShieldCheck aria-hidden className="size-3" />
                          Principal
                        </Selo>
                      )}
                    </span>
                    <span className="text-[13px] text-ink-3">{u.setor}</span>
                  </span>
                </span>
              </td>
              <td className="font-mono text-[13px] whitespace-nowrap">
                {u.matricula ?? <span className="text-ink-3">—</span>}
              </td>
              <td className="font-mono text-[13px] whitespace-nowrap">{u.login}</td>
              <td className="whitespace-nowrap">{NOME_DO_PERFIL[u.perfil]}</td>
              <td>
                {!u.ativo ? (
                  <Selo>Inativo</Selo>
                ) : u.bloqueadoEm ? (
                  <Selo tom="crit">Bloqueado em {formatarDiaHora(u.bloqueadoEm)}</Selo>
                ) : u.deveTrocarSenha ? (
                  // ainda não trocou a senha provisória (RN-21a)
                  <span title="Ainda não trocou a senha provisória">
                    <Selo tom="warn">Senha provisória</Selo>
                  </span>
                ) : (
                  <Selo tom="ok">Ativo</Selo>
                )}
              </td>
              <td>
                <AcoesUsuario
                  id={u.id}
                  ativo={u.ativo}
                  bloqueado={u.bloqueadoEm !== null}
                  pode={{
                    redefinirSenha: u.id !== eu.id && pode(u, 'redefinir-senha'),
                    desbloquear: u.id !== eu.id && pode(u, 'desbloquear'),
                    editar: pode(u, 'editar-dados'),
                    situacao: pode(u, u.ativo ? 'inativar' : 'reativar'),
                  }}
                  aviso={
                    u.id === eu.id
                      ? 'Você'
                      : u.principal
                        ? 'Protegido'
                        : u.perfil === 'ADMIN' && !ator.principal
                          ? 'Só o principal gerencia'
                          : undefined
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Tabela>
      {emEdicao ? (
        <Gaveta
          titulo={`Editar ${emEdicao.nome} ${emEdicao.sobrenome}`}
          voltarPara="/admin/usuarios"
        >
          <div className="cartao p-6">
            <FormEditarUsuario
              key={emEdicao.id}
              versao={emEdicao.atualizadoEm.getTime()}
              usuario={emEdicao}
              podeMudarPerfil={pode(emEdicao, 'mudar-perfil')}
              podePromoverAdmin={podeCriarAdmin}
            />
          </div>
        </Gaveta>
      ) : (
        novo === '1' && (
          <Gaveta
            titulo="Novo usuário"
            descricao="O sistema gera o login e a senha provisória, mostrada uma vez só."
            voltarPara="/admin/usuarios"
          >
            <div className="cartao p-6">
              {/* inclui inativos: login nunca é reaproveitado (RN-21b) */}
              <FormNovoUsuario logins={lista.map((u) => u.login)} podeCriarAdmin={podeCriarAdmin} />
            </div>
          </Gaveta>
        )
      )}
    </Pagina>
  )
}
