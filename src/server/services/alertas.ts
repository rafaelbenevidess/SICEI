import 'server-only'
import { exigirPermissao } from '@/domain/permissoes'
import { registrarAuditoria } from '../audit/registrar'
import type { Ator } from '../contexto'
import { prisma } from '../db'
import { ErroDeNegocio, exigirUuid, naoEncontrado } from '../erros'

/** RN-18: o Gestor marca o alerta como ciente; ele continua aberto até o saldo normalizar. */
export async function marcarCiente(ator: Ator, alertaId: string): Promise<void> {
  exigirPermissao(ator.perfil, 'alertas:ciente')
  exigirUuid(alertaId, 'Alerta')
  await prisma.$transaction(async (tx) => {
    const alerta = await tx.alerta.findUnique({ where: { id: alertaId } })
    if (!alerta) throw naoEncontrado('Alerta')
    if (alerta.fechadoEm) throw new ErroDeNegocio('Este alerta já foi fechado.')
    const agora = new Date()
    await tx.alerta.update({
      where: { id: alertaId },
      data: { cientePorId: ator.usuarioId, cienteEm: agora },
    })
    await registrarAuditoria(tx, {
      acao: 'ALERTA_CIENTE',
      entidade: 'alerta',
      entidadeId: alertaId,
      depois: { itemId: alerta.itemId, nivel: alerta.nivel },
      usuarioId: ator.usuarioId,
      ip: ator.ip,
      userAgent: ator.userAgent,
    })
  })
}
