import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { pode } from '@/domain/permissoes'
import { Aviso, Cartao, Pagina, Rotulo } from '@/components/ui'
import { formatarDataHora, formatarMoeda, NOME_TIPO } from '@/lib/formatar'
import { detalheMovimentacao } from '@/server/consultas/movimentacoes'
import { exigirPermissaoDaPagina } from '@/server/web/sessao-atual'
import { FormEstorno } from './FormEstorno'

export const metadata: Metadata = { title: 'Movimentação' }

export default async function PaginaMovimentacao({ params }: { params: Promise<{ id: string }> }) {
  const u = await exigirPermissaoDaPagina('historico:ver')
  const { id } = await params
  const m = await detalheMovimentacao(id)
  if (!m) notFound()
  const podeEstornar =
    pode(u.perfil, 'movimentacao:estornar') && m.tipo !== 'ESTORNO' && !m.estornadaPor
  return (
    <Pagina
      titulo={`${NOME_TIPO[m.tipo]} · ${m.item.codigo}`}
      descricao="Registro inalterável (RN-09, RN-12)."
    >
      {m.estornadaPor && (
        <Aviso tipo="alerta">
          Estornada em {formatarDataHora(m.estornadaPor.criadoEm)} por{' '}
          {m.estornadaPor.usuario.login}: “{m.estornadaPor.motivo}”.{' '}
          <Link href={`/movimentacoes/${m.estornadaPor.id}`} className="underline">
            Ver estorno
          </Link>
        </Aviso>
      )}
      <Cartao>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Rotulo nome="Item">
            <Link href={`/itens/${m.item.id}`} className="underline">
              {m.item.codigo} · {m.item.descricao}
            </Link>
          </Rotulo>
          <Rotulo nome="Quantidade">{m.quantidade}</Rotulo>
          <Rotulo nome="Saldo">
            {m.saldoAnterior} → {m.saldoPosterior}
          </Rotulo>
          <Rotulo nome="Data e hora (servidor)">{formatarDataHora(m.criadoEm)}</Rotulo>
          <Rotulo nome="Usuário">
            {m.usuario.nome} {m.usuario.sobrenome} ({m.usuario.login})
          </Rotulo>
          <Rotulo nome="Origem">
            IP {m.ip ?? '—'} · {m.userAgent ?? '—'}
          </Rotulo>
          {m.fornecedor && (
            <Rotulo nome="Fornecedor">
              {m.fornecedor.nomeFantasia ?? m.fornecedor.razaoSocial}
            </Rotulo>
          )}
          {m.precoUnitario && pode(u.perfil, 'precos:ver') && (
            <Rotulo nome="Preço unitário">{formatarMoeda(m.precoUnitario)}</Rotulo>
          )}
          {m.notaFiscal && <Rotulo nome="Nota fiscal">{m.notaFiscal}</Rotulo>}
          {m.destino && <Rotulo nome="Destino">{m.destino.nome}</Rotulo>}
          {m.ordemProducao && <Rotulo nome="Ordem de produção">{m.ordemProducao}</Rotulo>}
          {m.colaborador && <Rotulo nome="Colaborador">{m.colaborador.nome}</Rotulo>}
          {m.motivo && (
            <Rotulo nome={m.tipo === 'ESTORNO' ? 'Justificativa' : 'Motivo'}>{m.motivo}</Rotulo>
          )}
          {m.observacao && <Rotulo nome="Observação">{m.observacao}</Rotulo>}
          {m.estorna && (
            <Rotulo nome="Estorna">
              <Link href={`/movimentacoes/${m.estorna.id}`} className="underline">
                {NOME_TIPO[m.estorna.tipo]} de {formatarDataHora(m.estorna.criadoEm)}
              </Link>
            </Rotulo>
          )}
        </dl>
      </Cartao>
      {podeEstornar && (
        <Cartao titulo="Estornar (RF-09)">
          <FormEstorno movimentacaoId={m.id} />
        </Cartao>
      )}
    </Pagina>
  )
}
