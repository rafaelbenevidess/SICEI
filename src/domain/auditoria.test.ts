import { describe, expect, it } from 'vitest'
import {
  calcularHash,
  encadear,
  HASH_INICIAL,
  jsonCanonico,
  sha256Hex,
  verificarCadeia,
} from './auditoria'
import { registrosDeExemplo } from './auditoria.casos'

describe('RN-09a · JSON canônico', () => {
  it('a ordem das chaves não muda o texto', () => {
    expect(jsonCanonico({ b: 1, a: { d: 2, c: 3 } })).toBe(
      jsonCanonico({ a: { c: 3, d: 2 }, b: 1 }),
    )
  })
  it('datas viram ISO, undefined some e bigint vira texto', () => {
    expect(
      jsonCanonico({ d: new Date('2026-09-26T12:00:00Z'), u: undefined, n: 10n, l: [1, null] }),
    ).toBe('{"d":"2026-09-26T12:00:00.000Z","l":[1,null],"n":"10"}')
  })
  it('undefined solto vira null', () => {
    expect(jsonCanonico(undefined)).toBe('null')
  })
})

describe('RN-09a · Hash SHA-256', () => {
  it('SHA-256 de "abc" confere com o valor de referência', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
  it('o hash depende do anterior, da sequência e dos dados', async () => {
    const base = await calcularHash(HASH_INICIAL, 1, { a: 1 })
    expect(await calcularHash(HASH_INICIAL, 2, { a: 1 })).not.toBe(base)
    expect(await calcularHash(HASH_INICIAL, 1, { a: 2 })).not.toBe(base)
    expect(await calcularHash('f'.repeat(64), 1, { a: 1 })).not.toBe(base)
  })
})

describe('RN-09a · Verificação da cadeia do log', () => {
  it('cadeia sem alteração é íntegra', async () => {
    const cadeia = await encadear(registrosDeExemplo)
    expect(await verificarCadeia(cadeia)).toEqual({ integra: true, verificados: 5 })
  })
  it('o primeiro registro aponta para 64 zeros e cada um aponta para o anterior', async () => {
    const cadeia = await encadear(registrosDeExemplo)
    expect(cadeia[0].prevHash).toBe(HASH_INICIAL)
    for (let i = 1; i < cadeia.length; i++) expect(cadeia[i].prevHash).toBe(cadeia[i - 1].hash)
  })
  it('alterar a quantidade do registro 2 de 4 para 40 é detectado no registro 2', async () => {
    const cadeia = await encadear(registrosDeExemplo)
    cadeia[1] = { ...cadeia[1], dados: { ...(cadeia[1].dados as object), quantidade: 40 } }
    expect(await verificarCadeia(cadeia)).toEqual({
      integra: false,
      seq: 2,
      motivo: 'O conteúdo do registro foi alterado depois de gravado.',
    })
  })
  it('recalcular o hash do registro alterado não esconde a fraude: quebra no seguinte', async () => {
    const cadeia = await encadear(registrosDeExemplo)
    const dados = { ...(cadeia[1].dados as object), quantidade: 40 }
    cadeia[1] = { ...cadeia[1], dados, hash: await calcularHash(cadeia[1].prevHash, 2, dados) }
    const r = await verificarCadeia(cadeia)
    expect(r).toMatchObject({ integra: false, seq: 3 })
  })
  it('apagar um registro do meio é detectado', async () => {
    const cadeia = await encadear(registrosDeExemplo)
    cadeia.splice(2, 1)
    expect(await verificarCadeia(cadeia)).toMatchObject({ integra: false, seq: 4 })
  })
  it('cadeia vazia é íntegra', async () => {
    expect(await verificarCadeia([])).toEqual({ integra: true, verificados: 0 })
  })
})
