import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Search } from 'lucide-react'
import { pode } from '@/domain/permissoes'
import { BadgeStatus, Cartao, ChipCodigo, ChipPosicao, Pagina, Vazio } from '@/components/ui'
import { nomeDaPastilha } from '@/lib/formatar'
import { dadosDoRegistro, listarItens } from '@/server/consultas/estoque'
import { exigirUsuario } from '@/server/web/sessao-atual'
import { FormRegistrar } from './FormRegistrar'

export const metadata: Metadata = { title: 'Registrar movimentação' }

/** RF-07 e RF-08: registrar entrada ou saída, com prévia do resultado antes de confirmar. */
export default async function RegistrarMovimentacao({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; item?: string; q?: string }>
}) {
  const u = await exigirUsuario()
  const f = await searchParams
  const podeEntrada = pode(u.perfil, 'movimentacao:entrada')
  const podeSaida = pode(u.perfil, 'movimentacao:saida')
  const modo = f.modo === 'entrada' ? 'entrada' : 'saida'
  if ((modo === 'entrada' && !podeEntrada) || (modo === 'saida' && !podeSaida)) {
    redirect('/sem-permissao')
  }
  const titulo = modo === 'entrada' ? 'Registrar entrada' : 'Registrar saída'
  const descricao =
    modo === 'entrada'
      ? 'Compra de fornecedor ou devolução da produção. O saldo sobe na hora.'
      : 'Consumo da produção ou perda. O saldo nunca fica negativo, nem com duas saídas ao mesmo tempo.'

  const dados = f.item ? await dadosDoRegistro(f.item, u.perfil) : null
  if (!dados || !dados.item.ativo) {
    const itens = await listarItens({ q: f.q })
    return (
      <Pagina titulo={titulo} descricao={descricao}>
        <Cartao titulo="Escolha o item" semPadding>
          <form role="search" className="relative px-6 pb-4">
            <input type="hidden" name="modo" value={modo} />
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-9 size-4 -translate-y-[calc(50%+8px)] text-ink-3"
            />
            <label htmlFor="busca-item" className="sr-only">
              Buscar item
            </label>
            <input
              id="busca-item"
              name="q"
              type="search"
              defaultValue={f.q}
              autoFocus
              placeholder="Código, ISO, classe ou posição"
              className="h-11 w-full max-w-[520px] rounded-lg border border-line-2 bg-surface pr-3 pl-9 text-base text-ink placeholder:text-ink-3 sm:text-sm"
            />
          </form>
          {itens.length === 0 ? (
            <div className="px-6 pb-6">
              <Vazio>Nenhum item encontrado.</Vazio>
            </div>
          ) : (
            <ul>
              {itens.slice(0, 50).map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/movimentacoes/nova?modo=${modo}&item=${i.id}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-t border-line px-6 py-3 text-ink no-underline hover:bg-surface-2"
                  >
                    <ChipCodigo forte>{i.codigo}</ChipCodigo>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{nomeDaPastilha(i)}</span>
                      <span className="block truncate text-[13px] text-ink-3">
                        {i.fabricante.nome} · saldo {i.saldo}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="max-sm:hidden">
                        <ChipPosicao>{i.posicao?.codigo}</ChipPosicao>
                      </span>
                      <BadgeStatus status={i.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </Pagina>
    )
  }

  const { item } = dados
  return (
    <Pagina titulo={titulo} descricao={descricao}>
      <FormRegistrar
        key={`${modo}-${item.id}`}
        modo={modo}
        login={u.login}
        podeCadastrarFornecedor={pode(u.perfil, 'cadastros:editar')}
        item={{
          id: item.id,
          codigo: item.codigo,
          nome: nomeDaPastilha(item),
          fabricante: item.fabricante.nome,
          posicao: item.posicao?.codigo ?? null,
          saldo: item.saldo,
          minimo: item.estoqueMinimo,
          pontoReposicao: item.pontoReposicao,
          embalagem: item.embalagem,
          status: item.status,
        }}
        fornecedores={dados.fornecedores}
        destinos={dados.destinos}
        colaboradores={dados.colaboradores}
        ultimosPrecos={dados.ultimosPrecos}
        cnpjsExistentes={dados.cnpjsExistentes}
      />
    </Pagina>
  )
}
