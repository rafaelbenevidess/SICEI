/**
 * Recuperação do Administrador (doc 06, seção 7).
 * Se o único Administrador for bloqueado (5 falhas seguidas, RN-22), ninguém consegue
 * desbloqueá-lo pelo sistema. Quem tem acesso ao banco roda:
 *
 *   npm run admin:recuperar -- <login>
 *
 * O script gera uma nova senha provisória, desbloqueia a conta, derruba as sessões e
 * registra tudo no log de auditoria, como uma redefinição feita pelo sistema.
 */
import { gerarSenhaProvisoria } from '../src/domain/senha'
import { registrarAuditoria } from '../src/server/audit/registrar'
import { hashDeSenha } from '../src/server/auth/hash'
import { prisma } from '../src/server/db'

async function principal() {
  const login = process.argv[2]?.trim().toLowerCase()
  if (!login) throw new Error('Informe o login: npm run admin:recuperar -- admin')
  const u = await prisma.usuario.findUnique({ where: { login } })
  if (!u || u.perfil !== 'ADMIN')
    throw new Error(`Não existe Administrador com o login "${login}".`)
  const senha = gerarSenhaProvisoria()
  const senhaHash = await hashDeSenha(senha)
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: u.id },
      data: { senhaHash, deveTrocarSenha: true, falhasLogin: 0, bloqueadoEm: null, ativo: true },
    })
    await tx.historicoSenha.create({ data: { usuarioId: u.id, senhaHash } })
    await tx.sessao.deleteMany({ where: { usuarioId: u.id } })
    await registrarAuditoria(tx, {
      acao: 'SENHA_REDEFINIDA',
      entidade: 'usuario',
      entidadeId: u.id,
      antes: { bloqueado: u.bloqueadoEm !== null, ativo: u.ativo },
      depois: { deveTrocarSenha: true, bloqueado: false, origem: 'script de recuperação' },
      usuarioId: null,
      ip: null,
      userAgent: 'script de recuperação',
    })
  })
  console.log(`Administrador ${login} desbloqueado. Senha provisória: ${senha}`)
}

principal()
  .catch((e) => {
    console.error((e as Error).message)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
