import { afterEach, describe, expect, it, vi } from 'vitest'
import { anosDeDireitos, chaveDaLicenciada, licenciada, nomeDaLicenciada, PRODUTO } from './produto'

describe('Produto · Dados do SICEI e da licença', () => {
  it('sigla e nome por extenso', () => {
    expect(PRODUTO.sigla).toBe('SICEI')
    expect(PRODUTO.nome).toBe('Sistema Inteligente de Controle de Estoques Industriais')
  })

  it.each([
    [2026, 2026, '2026'],
    [2028, 2026, '2026–2028'],
    [2025, 2026, '2026'],
  ])('ano atual %i com início em %i mostra "%s"', (atual, inicial, esperado) => {
    expect(anosDeDireitos(atual, inicial)).toBe(esperado)
  })

  it.each([
    ['DDA Metalúrgica', 'DDA Metalúrgica'],
    ['  Metalúrgica Exemplo  ', 'Metalúrgica Exemplo'],
    ['', null],
    ['   ', null],
    [undefined, null],
  ])('SICEI_LICENCIADA=%j mostra %j', (valor, esperado) => {
    expect(nomeDaLicenciada(valor)).toBe(esperado)
  })

  describe('licenciada() lê SICEI_LICENCIADA', () => {
    afterEach(() => vi.unstubAllEnvs())

    it('com a variável definida devolve o nome', () => {
      vi.stubEnv('SICEI_LICENCIADA', 'DDA Metalúrgica')
      expect(licenciada()).toBe('DDA Metalúrgica')
    })

    it('com a variável vazia devolve null', () => {
      vi.stubEnv('SICEI_LICENCIADA', '')
      expect(licenciada()).toBeNull()
    })
  })
})

describe('Produto · Chave da licenciada (escolhe a logo do login)', () => {
  it.each([
    ['DDA Metalúrgica', 'dda-metalurgica'],
    ['  dda   METALÚRGICA ', 'dda-metalurgica'],
    ['Aço & Cia. Ltda', 'aco-cia-ltda'],
  ])('"%s" vira a chave "%s"', (nome, chave) => {
    expect(chaveDaLicenciada(nome)).toBe(chave)
  })
})
