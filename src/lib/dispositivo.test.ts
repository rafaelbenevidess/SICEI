import { describe, expect, it } from 'vitest'
import { descreverDispositivo } from './dispositivo'

describe('RN-09 · Dispositivo de origem em texto curto', () => {
  it.each([
    [
      'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
      'Celular · Chrome Android',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      'Celular · Safari iOS',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0',
      'Computador · Edge',
    ],
    [
      'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
      'Computador · Firefox',
    ],
    ['curl/8.5.0', 'Computador'],
    ['seed', 'Carga inicial'],
    [null, '—'],
  ])('%s → %s', (ua, esperado) => {
    expect(descreverDispositivo(ua)).toBe(esperado)
  })
})
