import type { Metadata } from 'next'
import Link from 'next/link'
import { pode } from '@/domain/permissoes'
import { Cartao, LinkBotao, Pagina, Tabela, Vazio } from '@/components/ui'
import { listarPosicoes } from '@/server/consultas/cadastros'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { BotaoSituacao, FormPosicao } from '../formularios'

export const metadata: Metadata = { title: 'Posições' }

export default async function Posicoes() {
  const u = await exigirPermissaoDaPagina('cadastros:ver')
  const editar = pode(u.perfil, 'cadastros:editar')
  const lista = await listarPosicoes()
  const ocupadas = lista.filter((p) => p.item).map((p) => p.codigo)
  return (
    <Pagina
      titulo="Posições"
      descricao="Armário → Gaveta → Compartimento. Um item por compartimento (RN-25)."
      acoes={
        pode(u.perfil, 'etiquetas:imprimir') &&
        ocupadas.length > 0 && (
          <LinkBotao href={`/cadastros/posicoes/etiquetas?codigos=${ocupadas.join(',')}`}>
            Imprimir todas as etiquetas
          </LinkBotao>
        )
      }
    >
      {editar && (
        <Cartao titulo="Nova posição">
          <FormPosicao />
        </Cartao>
      )}
      {lista.length === 0 ? (
        <Vazio>Nenhuma posição cadastrada.</Vazio>
      ) : (
        <Tabela rotulo="Posições">
          <thead>
            <tr>
              <th>Código</th>
              <th>Item guardado</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id}>
                <td className="font-mono">{p.codigo}</td>
                <td>
                  {p.item ? (
                    <Link href={`/itens/${p.item.id}`} className="underline">
                      {p.item.codigo} · {p.item.descricao}
                    </Link>
                  ) : (
                    <span className="text-slate-500">livre</span>
                  )}
                </td>
                <td>{p.ativo ? 'Ativa' : 'Inativa'}</td>
                <td className="flex flex-wrap gap-2">
                  {p.item && pode(u.perfil, 'etiquetas:imprimir') && (
                    <Link
                      href={`/cadastros/posicoes/etiquetas?codigos=${p.codigo}`}
                      className="text-sm underline"
                    >
                      Etiqueta
                    </Link>
                  )}
                  {editar && <BotaoSituacao entidade="posicao" id={p.id} ativo={p.ativo} />}
                </td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </Pagina>
  )
}
