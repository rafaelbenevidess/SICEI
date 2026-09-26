import { describe, expect, it } from 'vitest'
import { validar } from './comum'
import {
  schemaColaborador,
  schemaDestino,
  schemaFabricante,
  schemaFornecedor,
  schemaItem,
  schemaLimites,
  schemaLogin,
  schemaNovoUsuario,
  schemaParametros,
  schemaPosicao,
  schemaTrocaSenha,
  schemaVinculoFornecedor,
} from './cadastros'

const itemValido = {
  codigo: 'PST-001',
  descricao: 'Pastilha CNMG 120408 P25',
  iso: 'CNMG 120408',
  classe: 'P25',
  aplicacao: 'TORNEAMENTO',
  fabricanteId: 'fab-1',
  embalagem: '10',
  estoqueMinimo: '20',
  estoqueMaximo: '',
}

describe('RF-03 · Cadastro de pastilhas', () => {
  it('item completo é aceito e o máximo vazio vira undefined', () => {
    const r = validar(schemaItem, itemValido)
    expect(r).toMatchObject({ ok: true, dados: { embalagem: 10, estoqueMinimo: 20 } })
    expect(r.ok && r.dados.estoqueMaximo).toBeUndefined()
  })
  it('critério do RF-03: sem fabricante e sem mínimo → recusado', () => {
    const r = validar(schemaItem, { ...itemValido, fabricanteId: '', estoqueMinimo: '' })
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual(['estoqueMinimo', 'fabricanteId'])
  })
  it('RN-14: máximo igual ao mínimo → recusado no campo máximo', () => {
    const r = validar(schemaItem, { ...itemValido, estoqueMaximo: '20' })
    expect(!r.ok && r.erros.estoqueMaximo).toBe('O estoque máximo precisa ser maior que o mínimo.')
  })
})

describe('RF-12 · Mínimo e máximo', () => {
  it('máximo maior que o mínimo é aceito', () => {
    expect(validar(schemaLimites, { itemId: 'i', estoqueMinimo: 20, estoqueMaximo: 100 }).ok).toBe(
      true,
    )
  })
  it('máximo menor que o mínimo é recusado', () => {
    expect(validar(schemaLimites, { itemId: 'i', estoqueMinimo: 20, estoqueMaximo: 10 }).ok).toBe(
      false,
    )
  })
})

describe('RF-04 / RF-05 · Fabricantes e fornecedores', () => {
  it('fabricante sem nome é recusado', () => {
    expect(validar(schemaFabricante, { nome: ' ' }).ok).toBe(false)
  })
  it('critério do RF-05: CNPJ inválido é recusado', () => {
    const r = validar(schemaFornecedor, {
      razaoSocial: 'Ferramentas Sul Ltda',
      cnpj: '11.222.333/0001-82',
    })
    expect(!r.ok && r.erros.cnpj).toBe('CNPJ inválido.')
  })
  it('CNPJ válido é gravado sem pontuação', () => {
    const r = validar(schemaFornecedor, {
      razaoSocial: 'Ferramentas Sul Ltda',
      cnpj: '11.222.333/0001-81',
    })
    expect(r).toMatchObject({ ok: true, dados: { cnpj: '11222333000181' } })
  })
  it('vínculo com checkbox marcado vira preferencial', () => {
    const r = validar(schemaVinculoFornecedor, {
      itemId: 'i',
      fornecedorId: 'f',
      leadTimeDias: '5',
      preferencial: 'on',
    })
    expect(r).toMatchObject({ ok: true, dados: { leadTimeDias: 5, preferencial: true } })
  })
  it('vínculo sem checkbox não é preferencial', () => {
    const r = validar(schemaVinculoFornecedor, { itemId: 'i', fornecedorId: 'f' })
    expect(r).toMatchObject({ ok: true, dados: { preferencial: false } })
  })
})

describe('RF-06 / RF-27 / RF-28 · Destinos, colaboradores e posições', () => {
  it('destino precisa de tipo válido', () => {
    expect(
      validar(schemaDestino, { tipo: 'MAQUINA', codigo: 'CNC-03', nome: 'Torno CNC 03' }).ok,
    ).toBe(true)
    expect(validar(schemaDestino, { tipo: 'OUTRO', codigo: 'X', nome: 'Y' }).ok).toBe(false)
  })
  it('colaborador sem matrícula é aceito', () => {
    expect(validar(schemaColaborador, { nome: 'Carlos Pereira', setor: 'Usinagem' }).ok).toBe(true)
  })
  it('posição fora de 1 a 99 é recusada', () => {
    expect(validar(schemaPosicao, { armario: 1, gaveta: 3, compartimento: 4 }).ok).toBe(true)
    expect(validar(schemaPosicao, { armario: 100, gaveta: 3, compartimento: 4 }).ok).toBe(false)
  })
})

describe('RF-01 / RF-02 · Usuários e senhas', () => {
  it('novo usuário precisa de nome, sobrenome, setor e perfil', () => {
    const r = validar(schemaNovoUsuario, {
      nome: 'João',
      sobrenome: '',
      setor: 'Almoxarifado',
      perfil: 'CHEFE',
    })
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual(['perfil', 'sobrenome'])
  })
  it('login exige usuário e senha', () => {
    expect(validar(schemaLogin, { login: '', senha: '' }).ok).toBe(false)
  })
  it('troca de senha exige confirmação igual', () => {
    const r = validar(schemaTrocaSenha, {
      senhaAtual: 'a',
      novaSenha: 'NovaSenha2026',
      confirmacao: 'Outra',
    })
    expect(!r.ok && r.erros.confirmacao).toBe('As senhas não conferem.')
  })
})

describe('RF-26 · Parâmetros', () => {
  it('parâmetros válidos são aceitos', () => {
    expect(
      validar(schemaParametros, {
        janelaConsumoDias: '90',
        sessaoInatividadeMinutos: '30',
        emailAvisos: 'estoque@dda.com.br',
      }).ok,
    ).toBe(true)
  })
  it('e-mail inválido e janela acima de 365 são recusados', () => {
    const r = validar(schemaParametros, {
      janelaConsumoDias: 400,
      sessaoInatividadeMinutos: 30,
      emailAvisos: 'nao-e-email',
    })
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual(['emailAvisos', 'janelaConsumoDias'])
  })
  it('e-mail em branco é aceito (aviso por e-mail desligado)', () => {
    expect(
      validar(schemaParametros, {
        janelaConsumoDias: 90,
        sessaoInatividadeMinutos: 30,
        emailAvisos: '',
      }).ok,
    ).toBe(true)
  })
})
