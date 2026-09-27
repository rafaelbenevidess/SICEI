import 'server-only'
import { exigirPermissao } from '@/domain/permissoes'
import { validar } from '@/domain/schemas/comum'
import { schemaImpressaoEtiquetas } from '@/domain/schemas/cadastros'
import { registrarAuditoria } from '../audit/registrar'
import type { Ator } from '../contexto'
import { prisma } from '../db'
import { ErroDeNegocio } from '../erros'

/**
 * RN-26: as etiquetas escolhidas foram mandadas para a impressora. A pendência das posições
 * some e a impressão fica no log, com as posições e os itens.
 */
export async function registrarImpressaoDeEtiquetas(
  ator: Ator,
  entrada: unknown,
): Promise<{ impressas: string[] }> {
  exigirPermissao(ator.perfil, 'etiquetas:imprimir')
  const v = validar(schemaImpressaoEtiquetas, entrada)
  if (!v.ok) throw new ErroDeNegocio(Object.values(v.erros).join(' ') || 'Posições inválidas.')
  return prisma.$transaction(async (tx) => {
    const posicoes = await tx.posicao.findMany({
      where: { codigo: { in: v.dados.codigos }, itemId: { not: null } },
      select: { id: true, codigo: true, item: { select: { codigo: true } } },
      orderBy: { codigo: 'asc' },
    })
    if (posicoes.length === 0) throw new ErroDeNegocio('Nenhuma das posições tem item guardado.')
    await tx.posicao.updateMany({
      where: { id: { in: posicoes.map((p) => p.id) } },
      data: { etiquetaPendente: false },
    })
    await registrarAuditoria(tx, {
      acao: 'ETIQUETA_IMPRESSA',
      entidade: 'posicao',
      entidadeId: posicoes.length === 1 ? posicoes[0].id : null,
      depois: {
        etiquetas: posicoes.length,
        posicoes: posicoes.map((p) => `${p.codigo} (${p.item?.codigo})`),
      },
      usuarioId: ator.usuarioId,
      ip: ator.ip,
      userAgent: ator.userAgent,
    })
    return { impressas: posicoes.map((p) => p.codigo) }
  })
}
