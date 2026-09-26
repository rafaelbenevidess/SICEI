import { describe, expect, it } from 'vitest'
import {
  celulaCsv,
  diasAtrasIso,
  fimDoDia,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
  formatarVariacao,
  gerarCsv,
  hojeIso,
  inicioDoDia,
} from './formatar'

describe('Formatação em pt-BR, fuso de São Paulo (RN-09)', () => {
  it('data e hora em horário de Brasília', () => {
    expect(formatarDataHora(new Date('2026-09-26T15:30:00Z'))).toBe('26/09/2026 12:30')
    expect(formatarData('2026-09-26T02:00:00Z')).toBe('25/09/2026')
    expect(formatarDataHora(null)).toBe('—')
    expect(formatarData(undefined)).toBe('—')
  })
  it('moeda, número e variação', () => {
    expect(formatarMoeda(38.9)).toMatch(/R\$\s38,90/)
    expect(formatarMoeda({ toString: () => '41.2' })).toMatch(/41,20/)
    expect(formatarMoeda(null)).toBe('—')
    expect(formatarNumero(1.5)).toBe('1,5')
    expect(formatarNumero(null)).toBe('—')
    expect(formatarVariacao(4)).toBe('+4%')
    expect(formatarVariacao(-10)).toBe('−10%')
    expect(formatarVariacao(0)).toBe('0%')
    expect(formatarVariacao(null)).toBe('—')
  })
  it('intervalo de datas do filtro cobre o dia inteiro em São Paulo', () => {
    expect(inicioDoDia('2026-09-01')?.toISOString()).toBe('2026-09-01T03:00:00.000Z')
    expect(fimDoDia('2026-09-01')?.toISOString()).toBe('2026-09-02T02:59:59.999Z')
    expect(inicioDoDia('01/09/2026')).toBeNull()
    expect(fimDoDia('')).toBeNull()
  })
  it('hoje e dias atrás no fuso de São Paulo', () => {
    const agora = new Date('2026-09-26T01:00:00Z') // ainda dia 25 em SP
    expect(hojeIso(agora)).toBe('2026-09-25')
    expect(diasAtrasIso(30, agora)).toBe('2026-08-26')
  })
})

describe('RF-20 · CSV', () => {
  it('escapa ponto e vírgula, aspas e quebras de linha', () => {
    expect(celulaCsv('a;b')).toBe('"a;b"')
    expect(celulaCsv('diz "oi"')).toBe('"diz ""oi"""')
    expect(celulaCsv(null)).toBe('')
    expect(celulaCsv(10)).toBe('10')
  })
  it('gera CSV com BOM, separador ; e CRLF', () => {
    expect(gerarCsv(['a', 'b'], [[1, 'x;y']])).toBe('﻿a;b\r\n1;"x;y"')
  })
})
