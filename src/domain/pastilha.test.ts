import { describe, expect, it } from 'vitest'
import {
  caminhoSvg,
  chaveDaFoto,
  contornoDaPastilha,
  formaDaPastilha,
  fotoDaPastilha,
  raioInscrito,
  verticesDaPastilha,
  vistaDaPastilha,
  type FormatoDaPastilha,
  type Ponto,
} from './pastilha'
import {
  casosChaveDaFoto,
  casosFormaDaPastilha,
  casosFotoDaPastilha,
  FOTOS_DE_EXEMPLO,
} from './pastilha.casos'

/** Ângulo, em graus, entre as duas arestas que saem de um vértice. */
function anguloNoVertice(v: Ponto, a: Ponto, b: Ponto): number {
  const [ax, ay, bx, by] = [a[0] - v[0], a[1] - v[1], b[0] - v[0], b[1] - v[1]]
  const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by))
  return (Math.acos(cos) * 180) / Math.PI
}

const FORMATOS: { formato: FormatoDaPastilha; angulo: number | null; vertices: number }[] = [
  { formato: 'LOSANGO', angulo: 80, vertices: 4 },
  { formato: 'LOSANGO', angulo: 35, vertices: 4 },
  { formato: 'PARALELOGRAMO', angulo: 85, vertices: 4 },
  { formato: 'QUADRADA', angulo: null, vertices: 4 },
  { formato: 'RETANGULAR', angulo: null, vertices: 4 },
  { formato: 'TRIANGULAR', angulo: null, vertices: 3 },
  { formato: 'TRIGONAL', angulo: null, vertices: 6 },
  { formato: 'PENTAGONAL', angulo: null, vertices: 5 },
  { formato: 'HEXAGONAL', angulo: null, vertices: 6 },
  { formato: 'OCTOGONAL', angulo: null, vertices: 8 },
  { formato: 'REDONDA', angulo: null, vertices: 0 },
]

describe('Interface · Formato da pastilha pela designação ISO 1832', () => {
  it.each(casosFormaDaPastilha)('$descricao', ({ entrada, esperado }) => {
    expect(formaDaPastilha(entrada)).toMatchObject(esperado)
  })
  it('texto vazio ou só com espaços → genérico', () => {
    expect(formaDaPastilha('').reconhecida).toBe(false)
    expect(formaDaPastilha('   ').reconhecida).toBe(false)
    expect(formaDaPastilha(undefined).reconhecida).toBe(false)
  })
  it('uma letra só não basta para reconhecer o formato', () => {
    expect(formaDaPastilha('C 12').reconhecida).toBe(false)
  })
})

describe('Interface · Geometria da pastilha', () => {
  it.each(FORMATOS)('$formato $angulo: $vertices vértices no círculo de raio 1', (f) => {
    const v = verticesDaPastilha(f)
    expect(v).toHaveLength(f.vertices)
    for (const [x, y] of v) expect(Math.hypot(x, y)).toBeLessThanOrEqual(1 + 1e-9)
    // o ponto mais distante encosta no círculo: o desenho usa todo o espaço
    if (v.length) expect(Math.max(...v.map(([x, y]) => Math.hypot(x, y)))).toBeCloseTo(1, 6)
  })

  it('o ângulo de ponta do losango é o da norma', () => {
    for (const angulo of [35, 55, 75, 80, 86]) {
      const [ponta, cima, , baixo] = verticesDaPastilha({ formato: 'LOSANGO', angulo })
      expect(anguloNoVertice(ponta, cima, baixo)).toBeCloseTo(angulo, 6)
    }
  })

  it('as três pontas do trigonal têm 80°', () => {
    const v = verticesDaPastilha({ formato: 'TRIGONAL', angulo: null })
    for (const i of [0, 2, 4]) {
      expect(anguloNoVertice(v[i], v[(i + 1) % 6], v[(i + 5) % 6])).toBeCloseTo(80, 6)
    }
  })

  it('raio inscrito: 0,5 no triângulo, cos 45° no quadrado, 1 na redonda', () => {
    expect(raioInscrito(verticesDaPastilha({ formato: 'TRIANGULAR', angulo: null }))).toBeCloseTo(
      0.5,
    )
    expect(raioInscrito(verticesDaPastilha({ formato: 'QUADRADA', angulo: null }))).toBeCloseTo(
      Math.SQRT1_2,
    )
    expect(raioInscrito([])).toBe(1)
  })

  it.each(FORMATOS)('$formato $angulo: o contorno arredondado não sai do formato', (f) => {
    const vertices = verticesDaPastilha(f)
    const contorno = contornoDaPastilha(vertices, 0.1, 6)
    expect(contorno.length).toBe(f.vertices ? f.vertices * 7 : 48)
    const inscrito = raioInscrito(vertices)
    for (const [x, y] of contorno) {
      const r = Math.hypot(x, y)
      expect(r).toBeLessThanOrEqual(1 + 1e-9)
      // nenhum ponto cai para dentro do círculo inscrito
      expect(r).toBeGreaterThanOrEqual(inscrito - 1e-9)
    }
  })

  it('raio de ponta exagerado é limitado: o arco não passa do meio da aresta', () => {
    const vertices = verticesDaPastilha({ formato: 'QUADRADA', angulo: null })
    const contorno = contornoDaPastilha(vertices, 5, 4)
    for (const [x, y] of contorno) expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true)
    for (const [x, y] of contorno) {
      expect(Math.hypot(x, y)).toBeGreaterThanOrEqual(raioInscrito(vertices) - 1e-9)
    }
  })
})

describe('Interface · Pastilha em perspectiva', () => {
  it.each(casosFormaDaPastilha)('$descricao: desenho completo e dentro da caixa', ({ entrada }) => {
    const forma = formaDaPastilha(entrada)
    const v = vistaDaPastilha(forma)
    expect(v.paredes.length).toBeGreaterThan(0)
    expect(v.furo === null).toBe(!forma.temFuro)
    const { x, y, largura, altura } = v.caixa
    for (const parede of v.paredes) {
      expect(parede.luz).toBeGreaterThanOrEqual(0)
      expect(parede.luz).toBeLessThanOrEqual(1)
      for (const [px, py] of parede.pontos) {
        expect(px).toBeGreaterThanOrEqual(x)
        expect(px).toBeLessThanOrEqual(x + largura)
        expect(py).toBeGreaterThanOrEqual(y)
        expect(py).toBeLessThanOrEqual(y + altura)
      }
    }
  })

  it('paredes vêm de trás para a frente, para a da frente cobrir a de trás', () => {
    const { paredes } = vistaDaPastilha(formaDaPastilha('CNMG 120408'))
    const fundos = paredes.map((p) => (p.pontos[0][1] + p.pontos[1][1]) / 2)
    expect([...fundos].sort((a, b) => a - b)).toEqual(fundos)
  })

  it('pastilha positiva tem a base menor que a face; a negativa, igual', () => {
    const largura = (iso: string) => {
      const bases = vistaDaPastilha(formaDaPastilha(iso), { giro: 0 }).paredes.flatMap((p) => [
        p.pontos[2][0],
        p.pontos[3][0],
      ])
      const topos = vistaDaPastilha(formaDaPastilha(iso), { giro: 0 }).paredes.flatMap((p) => [
        p.pontos[0][0],
        p.pontos[1][0],
      ])
      return (Math.max(...bases) - Math.min(...bases)) / (Math.max(...topos) - Math.min(...topos))
    }
    expect(largura('SPMG 07T308')).toBeCloseTo(0.86, 2)
    expect(largura('SNMG 120408')).toBeCloseTo(1, 2)
  })

  it('vista de cima (elevação 90°) não mostra parede com altura', () => {
    const { paredes, matriz } = vistaDaPastilha(formaDaPastilha('SNMG 120408'), {
      elevacao: 90,
      giro: 0,
    })
    expect(matriz).toEqual([1, 0, -0, 1, 0, 0])
    for (const p of paredes) expect(p.pontos[2][1] - p.pontos[1][1]).toBeCloseTo(0, 6)
  })

  it('caminhoSvg fecha o contorno', () => {
    expect(
      caminhoSvg([
        [0, 0],
        [1, 0],
        [1, 1],
      ]),
    ).toBe('M0 0L1 0L1 1Z')
  })
})

describe('Interface · Foto da pastilha no lugar do desenho', () => {
  it.each(casosChaveDaFoto)('$descricao', ({ entrada, esperado }) => {
    expect(chaveDaFoto(entrada)).toBe(esperado)
  })
  it.each(casosFotoDaPastilha)('$descricao', ({ entrada, esperado }) => {
    expect(fotoDaPastilha(entrada, FOTOS_DE_EXEMPLO)?.arquivo ?? null).toBe(esperado)
  })
  it('sem nenhuma foto publicada, todo item fica com o desenho', () => {
    expect(fotoDaPastilha({ codigo: 'PST-001', iso: 'CNMG 120408' }, {})).toBeNull()
  })
  it('nome de propriedade herdada não vira foto', () => {
    expect(fotoDaPastilha({ codigo: 'constructor', iso: 'toString' }, {})).toBeNull()
  })
})
