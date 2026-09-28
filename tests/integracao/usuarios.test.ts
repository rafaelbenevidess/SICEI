import { beforeAll, describe, expect, it } from 'vitest'
import { ErroDePermissao } from '@/domain/permissoes'
import { validarToken } from '@/server/auth/sessao'
import type { Ator } from '@/server/contexto'
import { prisma } from '@/server/db'
import {
  entrar,
  MENSAGEM_CONTA_BLOQUEADA,
  MENSAGEM_LOGIN_INVALIDO,
  MENSAGEM_MUITAS_TENTATIVAS,
  trocarSenha,
} from '@/server/services/autenticacao'
import {
  alterarPerfil,
  alterarSituacaoUsuario,
  criarUsuario,
  desbloquearUsuario,
  redefinirSenha,
} from '@/server/services/usuarios'
import { criarAtor, unico } from './apoio'

let admin: Ator
const origem = (
  ip = `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
) => ({ ip, userAgent: 'vitest' })

beforeAll(async () => {
  admin = await criarAtor('ADMIN')
})

describe('RF-02 / RN-21 · Criação de usuário com login e senha gerados', () => {
  it('gera nome.sobrenome e uma senha provisória de 12 caracteres; o banco guarda só o hash', async () => {
    const sobrenome = unico('Silva').replace(/[^a-z]/gi, '')
    const r = await criarUsuario(admin, {
      nome: 'João',
      sobrenome: `da ${sobrenome}`,
      setor: 'Almoxarifado',
      perfil: 'ALMOXARIFE',
    })
    expect(r.login).toBe(`joao.${sobrenome.toLowerCase()}`)
    expect(r.senhaProvisoria).toHaveLength(12)
    const u = await prisma.usuario.findUniqueOrThrow({ where: { id: r.id } })
    expect(u.senhaHash).toMatch(/^\$argon2id\$/)
    expect(u.senhaHash).not.toContain(r.senhaProvisoria)
    expect(u.deveTrocarSenha).toBe(true)
    const log = await prisma.auditLog.findFirstOrThrow({
      where: { acao: 'USUARIO_CRIADO', entidadeId: r.id },
    })
    expect(JSON.stringify({ ...log, seq: String(log.seq) })).not.toContain(r.senhaProvisoria)
  })

  it('critério do RF-02: homônimo recebe número, mesmo com o primeiro inativado', async () => {
    const sobrenome = unico('Lima').replace(/[^a-z]/gi, '')
    const a = await criarUsuario(admin, {
      nome: 'Ana',
      sobrenome,
      setor: 'PCP',
      perfil: 'CONSULTA',
    })
    await alterarSituacaoUsuario(admin, a.id, false)
    const b = await criarUsuario(admin, {
      nome: 'Ana',
      sobrenome,
      setor: 'PCP',
      perfil: 'CONSULTA',
    })
    expect(b.login).toBe(`${a.login}2`)
  })

  it('critério do RF-02: quem não é Admin não cria usuário', async () => {
    const gestor = await criarAtor('GESTOR')
    await expect(
      criarUsuario(gestor, { nome: 'X', sobrenome: 'Y', setor: 'Z', perfil: 'ADMIN' }),
    ).rejects.toBeInstanceOf(ErroDePermissao)
  })
})

describe('RF-01 · Login, troca obrigatória e bloqueio', () => {
  it('primeiro acesso com a senha provisória pede troca; depois da troca, entra normal', async () => {
    const sobrenome = unico('Souza').replace(/[^a-z]/gi, '')
    const u = await criarUsuario(admin, {
      nome: 'Maria',
      sobrenome,
      setor: 'Compras',
      perfil: 'GESTOR',
    })
    const s1 = await entrar({ login: u.login, senha: u.senhaProvisoria }, origem())
    expect(s1.deveTrocarSenha).toBe(true)
    await trocarSenha(
      u.id,
      {
        senhaAtual: u.senhaProvisoria,
        novaSenha: 'MinhaSenhaNova2026',
        confirmacao: 'MinhaSenhaNova2026',
      },
      origem(),
    )
    const s2 = await entrar({ login: u.login.toUpperCase(), senha: 'MinhaSenhaNova2026' }, origem())
    expect(s2.deveTrocarSenha).toBe(false)
    expect(await validarToken(s2.token)).toMatchObject({ login: u.login })
  })

  it('trocar a senha encerra as sessões em outros aparelhos, mas não a atual', async () => {
    const u = await criarAtor('GESTOR', 'SenhaCorreta2026')
    const celular = await entrar({ login: u.login, senha: 'SenhaCorreta2026' }, origem())
    const computador = await entrar({ login: u.login, senha: 'SenhaCorreta2026' }, origem())
    const atual = await validarToken(computador.token)
    await trocarSenha(
      u.usuarioId,
      {
        senhaAtual: 'SenhaCorreta2026',
        novaSenha: 'SenhaNovinha2026',
        confirmacao: 'SenhaNovinha2026',
      },
      origem(),
      atual!.sessaoId,
    )
    expect(await validarToken(celular.token)).toBeNull()
    expect(await validarToken(computador.token)).not.toBeNull()
  })

  it('RN-22: nova senha igual à atual (uma das 3 últimas) é recusada', async () => {
    const sobrenome = unico('Costa').replace(/[^a-z]/gi, '')
    const u = await criarUsuario(admin, {
      nome: 'Rui',
      sobrenome,
      setor: 'Usinagem',
      perfil: 'CONSULTA',
    })
    await expect(
      trocarSenha(
        u.id,
        {
          senhaAtual: u.senhaProvisoria,
          novaSenha: u.senhaProvisoria,
          confirmacao: u.senhaProvisoria,
        },
        origem(),
      ),
    ).rejects.toThrow('A senha não pode repetir nenhuma das 3 últimas.')
  })

  it('critério do RF-01: login inexistente e senha errada têm a mesma mensagem', async () => {
    const u = await criarAtor('CONSULTA')
    await expect(entrar({ login: 'nao.existe', senha: 'qualquercoisa' }, origem())).rejects.toThrow(
      MENSAGEM_LOGIN_INVALIDO,
    )
    await expect(entrar({ login: u.login, senha: 'senhaerrada123' }, origem())).rejects.toThrow(
      MENSAGEM_LOGIN_INVALIDO,
    )
  })

  it('RN-23: senha digitada no campo login não fica gravada no log imutável', async () => {
    const digitado = `Senha-Secreta-${Date.now()}`
    await expect(entrar({ login: digitado, senha: 'x' }, origem())).rejects.toThrow(
      MENSAGEM_LOGIN_INVALIDO,
    )
    const registro = await prisma.auditLog.findFirstOrThrow({
      where: { acao: 'LOGIN_FALHOU' },
      orderBy: { seq: 'desc' },
    })
    expect(JSON.stringify(registro.depois)).not.toContain(digitado.toLowerCase())
    expect(registro.depois).toMatchObject({ loginInexistente: true, caracteres: digitado.length })
    const tentativa = await prisma.tentativaLogin.findFirstOrThrow({ orderBy: { id: 'desc' } })
    expect(tentativa.login).toBe('(login inexistente)')
  })

  it('critério do RF-01: a 5ª falha seguida bloqueia; só o Admin desbloqueia', async () => {
    const u = await criarAtor('ALMOXARIFE', 'SenhaCorreta2026')
    for (let i = 0; i < 4; i++) {
      await expect(entrar({ login: u.login, senha: 'errada-errada' }, origem())).rejects.toThrow(
        MENSAGEM_LOGIN_INVALIDO,
      )
    }
    await expect(entrar({ login: u.login, senha: 'errada-errada' }, origem())).rejects.toThrow(
      MENSAGEM_CONTA_BLOQUEADA,
    )
    // bloqueado: nem a senha certa entra
    await expect(entrar({ login: u.login, senha: 'SenhaCorreta2026' }, origem())).rejects.toThrow(
      MENSAGEM_CONTA_BLOQUEADA,
    )
    await desbloquearUsuario(admin, u.usuarioId)
    await expect(
      entrar({ login: u.login, senha: 'SenhaCorreta2026' }, origem()),
    ).resolves.toBeTruthy()
    expect(
      await prisma.auditLog.count({
        where: { acao: 'USUARIO_BLOQUEADO', entidadeId: u.usuarioId },
      }),
    ).toBe(1)
  })

  it('RN-22: 8 falhas em paralelo não burlam o bloqueio (incremento atômico)', async () => {
    const u = await criarAtor('ALMOXARIFE', 'SenhaCorreta2026')
    await Promise.allSettled(
      Array.from({ length: 8 }, () => entrar({ login: u.login, senha: 'errada-errada' }, origem())),
    )
    const guardado = await prisma.usuario.findUniqueOrThrow({ where: { id: u.usuarioId } })
    expect(guardado.bloqueadoEm).not.toBeNull()
    expect(
      await prisma.auditLog.count({
        where: { acao: 'USUARIO_BLOQUEADO', entidadeId: u.usuarioId },
      }),
    ).toBe(1)
    await expect(entrar({ login: u.login, senha: 'SenhaCorreta2026' }, origem())).rejects.toThrow(
      MENSAGEM_CONTA_BLOQUEADA,
    )
  })

  it('RN-22: depois de A → B → C, voltar para A é recusado (3 últimas de verdade)', async () => {
    const u = await criarAtor('GESTOR', 'SenhaInicial-A1')
    // o criarAtor não grava histórico; a senha A entra como a atual
    await trocarSenha(
      u.usuarioId,
      {
        senhaAtual: 'SenhaInicial-A1',
        novaSenha: 'SenhaSegunda-B2',
        confirmacao: 'SenhaSegunda-B2',
      },
      origem(),
    )
    await trocarSenha(
      u.usuarioId,
      {
        senhaAtual: 'SenhaSegunda-B2',
        novaSenha: 'SenhaTerceira-C3',
        confirmacao: 'SenhaTerceira-C3',
      },
      origem(),
    )
    await expect(
      trocarSenha(
        u.usuarioId,
        {
          senhaAtual: 'SenhaTerceira-C3',
          novaSenha: 'SenhaInicial-A1',
          confirmacao: 'SenhaInicial-A1',
        },
        origem(),
      ),
    ).rejects.toThrow('A senha não pode repetir nenhuma das 3 últimas.')
    // depois de mais uma troca, A sai da janela das 3 últimas
    await trocarSenha(
      u.usuarioId,
      {
        senhaAtual: 'SenhaTerceira-C3',
        novaSenha: 'SenhaQuarta-D4',
        confirmacao: 'SenhaQuarta-D4',
      },
      origem(),
    )
    await expect(
      trocarSenha(
        u.usuarioId,
        {
          senhaAtual: 'SenhaQuarta-D4',
          novaSenha: 'SenhaInicial-A1',
          confirmacao: 'SenhaInicial-A1',
        },
        origem(),
      ),
    ).resolves.toBeUndefined()
  })

  it('rate limit: 20 tentativas do mesmo IP em 15 minutos barram a 21ª', async () => {
    const ip = origem().ip
    await prisma.tentativaLogin.createMany({
      data: Array.from({ length: 20 }, () => ({ ip, login: 'x', sucesso: false })),
    })
    await expect(entrar({ login: 'x', senha: 'y' }, { ip, userAgent: 'vitest' })).rejects.toThrow(
      MENSAGEM_MUITAS_TENTATIVAS,
    )
  })
})

describe('RN-21a / RN-21b · Redefinição, inativação e sessões', () => {
  it('critério do RF-02: inativar derruba a sessão aberta na hora', async () => {
    const u = await criarAtor('ALMOXARIFE', 'SenhaCorreta2026')
    const s = await entrar({ login: u.login, senha: 'SenhaCorreta2026' }, origem())
    expect(await validarToken(s.token)).not.toBeNull()
    await alterarSituacaoUsuario(admin, u.usuarioId, false)
    expect(await validarToken(s.token)).toBeNull()
    await expect(entrar({ login: u.login, senha: 'SenhaCorreta2026' }, origem())).rejects.toThrow(
      MENSAGEM_LOGIN_INVALIDO,
    )
  })

  it('redefinir a senha gera nova provisória, desbloqueia e exige troca', async () => {
    const u = await criarAtor('GESTOR')
    await prisma.usuario.update({
      where: { id: u.usuarioId },
      data: { bloqueadoEm: new Date(), falhasLogin: 5 },
    })
    const r = await redefinirSenha(admin, u.usuarioId)
    const s = await entrar({ login: u.login, senha: r.senhaProvisoria }, origem())
    expect(s.deveTrocarSenha).toBe(true)
  })

  it('Admin não inativa nem muda o próprio perfil', async () => {
    await expect(alterarSituacaoUsuario(admin, admin.usuarioId, false)).rejects.toThrow(
      'Você não pode inativar a sua própria conta.',
    )
    await expect(alterarPerfil(admin, admin.usuarioId, 'CONSULTA')).rejects.toThrow(
      'Você não pode alterar o seu próprio perfil.',
    )
  })

  it('mudar o perfil derruba as sessões do usuário', async () => {
    const u = await criarAtor('GESTOR', 'SenhaCorreta2026')
    const s = await entrar({ login: u.login, senha: 'SenhaCorreta2026' }, origem())
    await alterarPerfil(admin, u.usuarioId, 'CONSULTA')
    expect(await validarToken(s.token)).toBeNull()
  })

  it('token inválido, curto ou inexistente não abre sessão', async () => {
    expect(await validarToken(undefined)).toBeNull()
    expect(await validarToken('curto')).toBeNull()
    expect(await validarToken('x'.repeat(43))).toBeNull()
  })

  it('sessão parada além do tempo de inatividade expira', async () => {
    const u = await criarAtor('CONSULTA', 'SenhaCorreta2026')
    const s = await entrar({ login: u.login, senha: 'SenhaCorreta2026' }, origem())
    await prisma.sessao.updateMany({
      where: { usuarioId: u.usuarioId },
      data: { ultimoUso: new Date(Date.now() - 31 * 60_000) },
    })
    expect(await validarToken(s.token)).toBeNull()
  })
})
