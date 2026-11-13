import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { pode } from '@/domain/permissoes'
import { Cartao } from '@/components/ui'
import { nomeDaPastilha } from '@/lib/formatar'
import { dadosDoRegistro, listarItens } from '@/server/consultas/estoque'
import { exigirUsuario } from '@/server/web/sessao-atual'
import { EscolhaDeItem } from './EscolhaDeItem'
import { FormRegistrar } from './FormRegistrar'

export interface ParametrosDoRegistro {
  modo?: string
  item?: string
  q?: string
}

/**
 * RF-07 e RF-08: o registro de entrada ou saída, pronto para ser mostrado na página
 * (/movimentacoes/nova) ou na gaveta que abre por cima da tela atual. A permissão é
 * conferida aqui, então vale nos dois lugares.
 */
export async function registroDeMovimentacao(
  f: ParametrosDoRegistro,
): Promise<{ titulo: string; descricao: string; conteudo: ReactNode }> {
  const u = await exigirUsuario()
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
    return {
      titulo,
      descricao,
      conteudo: (
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
      ),
    }
  }

  const { item } = dados
  return {
    titulo,
    descricao,
    conteudo: (
      <FormRegistrar
        key={`${modo}-${item.id}`}
        modo={modo}
        login={u.login}
        podeCadastrarFornecedor={pode(u.perfil, 'cadastros:editar')}
        item={{
          id: item.id,
          codigo: item.codigo,
          nome: nomeDaPastilha(item),
          iso: item.iso,
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
    ),
  }
}
