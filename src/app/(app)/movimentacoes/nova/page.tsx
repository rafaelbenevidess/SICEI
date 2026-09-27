import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { pode } from '@/domain/permissoes'
import { Cartao, Pagina } from '@/components/ui'
import { nomeDaPastilha } from '@/lib/formatar'
import { dadosDoRegistro, listarItens } from '@/server/consultas/estoque'
import { exigirUsuario } from '@/server/web/sessao-atual'
import { EscolhaDeItem } from './EscolhaDeItem'
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
    const itens = await listarItens({})
    return (
      <Pagina titulo={titulo} descricao={descricao}>
        <Cartao titulo="Escolha o item" semPadding>
          <EscolhaDeItem
            modo={modo}
            inicial={f.q ?? ''}
            itens={itens.map((i) => ({
              id: i.id,
              codigo: i.codigo,
              nome: nomeDaPastilha(i),
              descricao: i.descricao,
              iso: i.iso,
              classe: i.classe,
              fabricante: i.fabricante.nome,
              saldo: i.saldo,
              posicao: i.posicao?.codigo ?? null,
              status: i.status,
            }))}
          />
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
