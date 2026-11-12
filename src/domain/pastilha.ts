/**
 * Geometria da pastilha a partir da designação ISO 1832 (ex.: "CNMG 120408").
 * A 1ª letra dá o formato, a 2ª o ângulo de folga (N = 0°, pastilha negativa) e a 4ª diz se
 * há furo. Com isso a tela desenha a pastilha de cada item (components/Pastilha.tsx) em vez
 * de uma figura genérica. Funções puras: nada aqui toca o banco.
 */

export type FormatoDaPastilha =
  | 'LOSANGO'
  | 'PARALELOGRAMO'
  | 'QUADRADA'
  | 'RETANGULAR'
  | 'TRIANGULAR'
  | 'TRIGONAL'
  | 'PENTAGONAL'
  | 'HEXAGONAL'
  | 'OCTOGONAL'
  | 'REDONDA'

export interface FormaDaPastilha {
  formato: FormatoDaPastilha
  /** ângulo de ponta, em graus, no losango e no paralelogramo; null nos outros formatos */
  angulo: number | null
  /** nome para a pessoa: "Losango 80°", "Triangular" */
  nome: string
  temFuro: boolean
  /** folga maior que 0°: a parede fecha em direção à base */
  positiva: boolean
  /** false quando a designação não segue a ISO 1832: o desenho é o genérico */
  reconhecida: boolean
}

export type Ponto = readonly [number, number]

const FORMATOS: Record<string, { formato: FormatoDaPastilha; angulo: number | null }> = {
  A: { formato: 'PARALELOGRAMO', angulo: 85 },
  B: { formato: 'PARALELOGRAMO', angulo: 82 },
  K: { formato: 'PARALELOGRAMO', angulo: 55 },
  C: { formato: 'LOSANGO', angulo: 80 },
  D: { formato: 'LOSANGO', angulo: 55 },
  E: { formato: 'LOSANGO', angulo: 75 },
  M: { formato: 'LOSANGO', angulo: 86 },
  V: { formato: 'LOSANGO', angulo: 35 },
  H: { formato: 'HEXAGONAL', angulo: null },
  L: { formato: 'RETANGULAR', angulo: null },
  O: { formato: 'OCTOGONAL', angulo: null },
  P: { formato: 'PENTAGONAL', angulo: null },
  R: { formato: 'REDONDA', angulo: null },
  S: { formato: 'QUADRADA', angulo: null },
  T: { formato: 'TRIANGULAR', angulo: null },
  W: { formato: 'TRIGONAL', angulo: null },
}

const NOMES: Record<FormatoDaPastilha, string> = {
  LOSANGO: 'Losango',
  PARALELOGRAMO: 'Paralelogramo',
  QUADRADA: 'Quadrada',
  RETANGULAR: 'Retangular',
  TRIANGULAR: 'Triangular',
  TRIGONAL: 'Trigonal',
  PENTAGONAL: 'Pentagonal',
  HEXAGONAL: 'Hexagonal',
  OCTOGONAL: 'Octogonal',
  REDONDA: 'Redonda',
}

/** 4ª letra da ISO 1832 que indica pastilha sem furo (fixação por grampo). */
const SEM_FURO = ['N', 'R', 'F']

const GENERICA: FormaDaPastilha = {
  formato: 'LOSANGO',
  angulo: 80,
  nome: 'Formato não identificado',
  temFuro: true,
  positiva: false,
  reconhecida: false,
}

/**
 * Lê o formato na designação ISO do item. Aceita minúsculas e falta de espaço ("cnmg120408").
 * Pastilha de rosca no padrão "16ER" (tamanho, externa/interna, mão) é triangular.
 * O que não for reconhecido cai no desenho genérico, com `reconhecida: false`.
 */
export function formaDaPastilha(iso: string | null | undefined): FormaDaPastilha {
  const texto = (iso ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (/^\d{2}[EI][RL]/.test(texto)) {
    return {
      formato: 'TRIANGULAR',
      angulo: null,
      nome: 'Triangular (rosca)',
      temFuro: true,
      positiva: true,
      reconhecida: true,
    }
  }
  const letras = /^[A-Z]{2,4}/.exec(texto)?.[0]
  const base = letras ? FORMATOS[letras[0]] : undefined
  if (!letras || !base) return GENERICA
  return {
    ...base,
    nome: base.angulo ? `${NOMES[base.formato]} ${base.angulo}°` : NOMES[base.formato],
    temFuro: letras.length < 4 || !SEM_FURO.includes(letras[3]),
    positiva: letras[1] !== 'N',
    reconhecida: true,
  }
}

const GRAUS = Math.PI / 180

function poligonoRegular(lados: number, giro: number): Ponto[] {
  return Array.from({ length: lados }, (_, i) => {
    const a = giro + (i * 2 * Math.PI) / lados
    return [Math.cos(a), Math.sin(a)] as const
  })
}

/**
 * Vértices do formato visto de cima, dentro do círculo de raio 1 e centrados na origem.
 * A pastilha redonda não tem vértices: devolve lista vazia e o contorno é o próprio círculo.
 */
export function verticesDaPastilha(forma: Pick<FormaDaPastilha, 'formato' | 'angulo'>): Ponto[] {
  const { formato } = forma
  const angulo = forma.angulo ?? 80
  switch (formato) {
    case 'LOSANGO': {
      // pontas agudas no eixo horizontal; a meia-altura sai do ângulo de ponta
      const b = Math.tan((angulo / 2) * GRAUS)
      return [
        [1, 0],
        [0, b],
        [-1, 0],
        [0, -b],
      ]
    }
    case 'PARALELOGRAMO': {
      // proporção de pastilha de fresa (comprimento ≈ 1,7 × largura), inclinada pelo ângulo
      const meiaAltura = 0.5
      const meiaBase = 0.85
      const desvio = meiaAltura / Math.tan(angulo * GRAUS)
      const pontos: Ponto[] = [
        [meiaBase + desvio, -meiaAltura],
        [meiaBase - desvio, meiaAltura],
        [-meiaBase - desvio, meiaAltura],
        [-meiaBase + desvio, -meiaAltura],
      ]
      const maior = Math.max(...pontos.map(([x, y]) => Math.hypot(x, y)))
      return pontos.map(([x, y]) => [x / maior, y / maior] as const)
    }
    case 'QUADRADA':
      return poligonoRegular(4, 45 * GRAUS)
    case 'RETANGULAR': {
      const d = Math.hypot(0.85, 0.5)
      return [
        [0.85 / d, -0.5 / d],
        [0.85 / d, 0.5 / d],
        [-0.85 / d, 0.5 / d],
        [-0.85 / d, -0.5 / d],
      ]
    }
    case 'TRIANGULAR':
      return poligonoRegular(3, -90 * GRAUS)
    case 'TRIGONAL': {
      // três pontas de 80° e, entre elas, três cantos abertos mais perto do centro
      const interno = Math.tan(40 * GRAUS) / (Math.cos(30 * GRAUS) + Math.tan(40 * GRAUS) * 0.5)
      return Array.from({ length: 6 }, (_, i) => {
        const a = (-90 + i * 60) * GRAUS
        const r = i % 2 === 0 ? 1 : interno
        return [r * Math.cos(a), r * Math.sin(a)] as const
      })
    }
    case 'PENTAGONAL':
      return poligonoRegular(5, -90 * GRAUS)
    case 'HEXAGONAL':
      return poligonoRegular(6, 0)
    case 'OCTOGONAL':
      return poligonoRegular(8, 22.5 * GRAUS)
    case 'REDONDA':
      return []
  }
}

/** Raio do maior círculo que cabe no formato (o círculo inscrito da norma), com raio externo 1. */
export function raioInscrito(vertices: Ponto[]): number {
  if (vertices.length === 0) return 1
  let menor = Infinity
  vertices.forEach(([x1, y1], i) => {
    const [x2, y2] = vertices[(i + 1) % vertices.length]
    const distancia = Math.abs(x1 * y2 - x2 * y1) / Math.hypot(x2 - x1, y2 - y1)
    menor = Math.min(menor, distancia)
  })
  return menor
}

/**
 * Contorno do formato com os cantos arredondados (o raio de ponta), como lista de pontos.
 * O raio é limitado a 45% da menor aresta vizinha, para o arco nunca passar do meio dela.
 */
export function contornoDaPastilha(vertices: Ponto[], raio = 0.1, passosPorCanto = 6): Ponto[] {
  if (vertices.length === 0) return poligonoRegular(48, 0)
  const pontos: Ponto[] = []
  vertices.forEach((v, i) => {
    const antes = vertices[(i - 1 + vertices.length) % vertices.length]
    const depois = vertices[(i + 1) % vertices.length]
    const [ax, ay] = [antes[0] - v[0], antes[1] - v[1]]
    const [dx, dy] = [depois[0] - v[0], depois[1] - v[1]]
    const [la, ld] = [Math.hypot(ax, ay), Math.hypot(dx, dy)]
    const u1 = [ax / la, ay / la]
    const u2 = [dx / ld, dy / ld]
    const meio = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))) / 2
    const recuo = Math.min(raio / Math.tan(meio), 0.45 * Math.min(la, ld))
    const r = recuo * Math.tan(meio)
    const bx = u1[0] + u2[0]
    const by = u1[1] + u2[1]
    const lb = Math.hypot(bx, by)
    const centro = [
      v[0] + (bx / lb) * (r / Math.sin(meio)),
      v[1] + (by / lb) * (r / Math.sin(meio)),
    ]
    const inicio = Math.atan2(v[1] + u1[1] * recuo - centro[1], v[0] + u1[0] * recuo - centro[0])
    const fim = Math.atan2(v[1] + u2[1] * recuo - centro[1], v[0] + u2[0] * recuo - centro[0])
    // o arco vai pelo caminho curto entre as duas tangentes
    let varredura = fim - inicio
    if (varredura > Math.PI) varredura -= 2 * Math.PI
    if (varredura < -Math.PI) varredura += 2 * Math.PI
    for (let k = 0; k <= passosPorCanto; k++) {
      const a = inicio + (varredura * k) / passosPorCanto
      pontos.push([centro[0] + r * Math.cos(a), centro[1] + r * Math.sin(a)])
    }
  })
  return pontos
}

export interface VistaDaPastilha {
  /** matriz SVG (a b c d e f) que deita o plano da face de cima na perspectiva */
  matriz: [number, number, number, number, number, number]
  /** contorno da face de cima, nas coordenadas do plano (use dentro da matriz) */
  face: Ponto[]
  /** paredes visíveis, de trás para a frente, já nas coordenadas da tela; luz de 0 a 1 */
  paredes: { pontos: [Ponto, Ponto, Ponto, Ponto]; luz: number }[]
  /** raio do furo e do círculo inscrito, nas coordenadas do plano */
  furo: number | null
  inscrito: number
  /** caixa que contém o desenho, para o viewBox */
  caixa: { x: number; y: number; largura: number; altura: number }
  /** centro da sombra no chão e os dois raios dela */
  sombra: { x: number; y: number; rx: number; ry: number }
}

const arredondar = (n: number) => Math.round(n * 1000) / 1000

/**
 * Pastilha em perspectiva: a face de cima girada e inclinada, e as paredes até a base.
 * `giro` roda a pastilha sobre a mesa; `elevacao` é a altura do olhar (90° = vista de cima).
 */
export function vistaDaPastilha(
  forma: FormaDaPastilha,
  opcoes: { giro?: number; elevacao?: number; espessura?: number } = {},
): VistaDaPastilha {
  const giro = (opcoes.giro ?? 24) * GRAUS
  const elevacao = (opcoes.elevacao ?? 38) * GRAUS
  const espessura = (opcoes.espessura ?? 0.56) * Math.cos(elevacao)
  const achatamento = Math.sin(elevacao)
  const [cos, sen] = [Math.cos(giro), Math.sin(giro)]

  const vertices = verticesDaPastilha(forma)
  const inscrito = raioInscrito(vertices)
  const face = contornoDaPastilha(vertices, 0.14 * inscrito)
  const base = forma.positiva ? 0.86 : 1

  const naTela = ([x, y]: Ponto, fator = 1, descida = 0): Ponto => [
    (x * cos - y * sen) * fator,
    (x * sen + y * cos) * fator * achatamento + descida,
  ]
  // sentido do contorno: decide para que lado fica o "fora" de cada aresta
  const area = face.reduce((s, [x, y], i) => {
    const [x2, y2] = face[(i + 1) % face.length]
    return s + (x * y2 - x2 * y)
  }, 0)
  const sentido = area >= 0 ? 1 : -1

  const paredes = face
    .map((p, i) => {
      const q = face[(i + 1) % face.length]
      // normal para fora, já girada: `frente` positivo aponta para quem olha
      const nx = (q[1] - p[1]) * sentido
      const ny = -(q[0] - p[0]) * sentido
      const tamanho = Math.hypot(nx, ny) || 1
      const lado = (nx * cos - ny * sen) / tamanho
      const frente = (nx * sen + ny * cos) / tamanho
      const quina: [Ponto, Ponto, Ponto, Ponto] = [
        naTela(p),
        naTela(q),
        naTela(q, base, espessura),
        naTela(p, base, espessura),
      ]
      // luz vindo da esquerda e da frente
      const luz = Math.max(0, Math.min(1, 0.5 + 0.5 * (-0.75 * lado + 0.55 * frente)))
      return { frente, pontos: quina, luz, fundo: (quina[0][1] + quina[1][1]) / 2 }
    })
    .filter((p) => p.frente > -0.02)
    .sort((a, b) => a.fundo - b.fundo)
    .map(({ pontos, luz }) => ({
      pontos: pontos.map(([x, y]) => [arredondar(x), arredondar(y)] as const) as [
        Ponto,
        Ponto,
        Ponto,
        Ponto,
      ],
      luz: arredondar(luz),
    }))

  const todos = [...face.map((p) => naTela(p)), ...face.map((p) => naTela(p, base, espessura))]
  const xs = todos.map((p) => p[0])
  const ys = todos.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const margem = 0.12
  const largura = x1 - x0
  return {
    matriz: [cos, sen * achatamento, -sen, cos * achatamento, 0, 0].map(arredondar) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ],
    face: face.map(([x, y]) => [arredondar(x), arredondar(y)] as const),
    paredes,
    furo: forma.temFuro ? arredondar(0.42 * inscrito) : null,
    inscrito: arredondar(inscrito),
    caixa: {
      x: arredondar(x0 - margem),
      y: arredondar(y0 - margem),
      largura: arredondar(largura + 2 * margem),
      altura: arredondar(y1 - y0 + 2 * margem + 0.16),
    },
    sombra: {
      x: arredondar((x0 + x1) / 2),
      y: arredondar(y1 - 0.02),
      rx: arredondar(largura * 0.52),
      ry: arredondar(largura * 0.52 * achatamento * 0.42),
    },
  }
}

/** Atributo `points`/`d` de SVG a partir de uma lista de pontos. */
export function caminhoSvg(pontos: readonly Ponto[]): string {
  return pontos.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join('') + 'Z'
}
