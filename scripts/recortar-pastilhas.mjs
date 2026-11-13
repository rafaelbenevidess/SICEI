// Recorta o fundo das fotos de pastilha de CC/imagens e publica em public/pastilhas.
//
//   npm run pastilhas
//
// Cada arquivo leva o código do item ou a designação ISO no nome: "PST-001.png",
// "CNMG 120408.jpg". O fundo precisa ser liso, de uma cor só (ver CC/prompts/pastilhas.md).
// O script descobre a cor do fundo pela borda da imagem, apaga o que está ligado à borda,
// suaviza o contorno, apara as sobras e grava um WebP com transparência. No fim reescreve
// src/lib/fotos-pastilhas.json, que diz à tela quais itens têm foto.
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

const ORIGEM = 'CC/imagens'
const DESTINO = 'public/pastilhas'
const MANIFESTO = 'src/lib/fotos-pastilhas.json'
const LADO_MAXIMO = 1400
const LARGURA_FINAL = 900
/** distância de cor (0 a 441) até a qual um ponto ainda é fundo */
const TOLERANCIA = Number(process.env.TOLERANCIA ?? 46)

/** A mesma regra de `chaveDaFoto` em src/domain/pastilha.ts. */
const chave = (texto) => texto.toUpperCase().replace(/[^A-Z0-9]/g, '')

function mediana(valores) {
  const v = [...valores].sort((a, b) => a - b)
  return v[Math.floor(v.length / 2)]
}

/** Cor do fundo: a mediana dos pontos da moldura de fora da imagem. */
function corDoFundo(px, largura, altura) {
  const faixa = Math.max(2, Math.round(Math.min(largura, altura) * 0.02))
  const r = []
  const g = []
  const b = []
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if (x >= faixa && x < largura - faixa && y >= faixa && y < altura - faixa) continue
      const i = (y * largura + x) * 4
      r.push(px[i])
      g.push(px[i + 1])
      b.push(px[i + 2])
    }
  }
  return [mediana(r), mediana(g), mediana(b)]
}

/** Marca como fundo tudo que tem a cor do fundo e está ligado à borda. */
function fundoLigadoABorda(px, largura, altura, fundo, tolerancia) {
  const ehFundo = new Uint8Array(largura * altura)
  const perto = (p) => {
    const i = p * 4
    return Math.hypot(px[i] - fundo[0], px[i + 1] - fundo[1], px[i + 2] - fundo[2]) <= tolerancia
  }
  const pilha = []
  const visitar = (p) => {
    if (!ehFundo[p] && perto(p)) {
      ehFundo[p] = 1
      pilha.push(p)
    }
  }
  for (let x = 0; x < largura; x++) {
    visitar(x)
    visitar((altura - 1) * largura + x)
  }
  for (let y = 0; y < altura; y++) {
    visitar(y * largura)
    visitar(y * largura + largura - 1)
  }
  while (pilha.length) {
    const p = pilha.pop()
    const x = p % largura
    if (x > 0) visitar(p - 1)
    if (x < largura - 1) visitar(p + 1)
    if (p >= largura) visitar(p - largura)
    if (p < largura * (altura - 1)) visitar(p + largura)
  }
  return { ehFundo, perto }
}

async function recortar(arquivo) {
  const { data, info } = await sharp(arquivo)
    .rotate()
    .resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: largura, height: altura } = info
  const fundo = corDoFundo(data, largura, altura)
  const { ehFundo, perto } = fundoLigadoABorda(data, largura, altura, fundo, TOLERANCIA)

  // fundo de cor viva (verde ou magenta de recorte): o que aparece pelo furo da pastilha
  // também é fundo, mesmo sem estar ligado à borda
  const [maior, menor] = [Math.max(...fundo), Math.min(...fundo)]
  const corViva = maior - menor > 90
  if (corViva) {
    for (let p = 0; p < largura * altura; p++) if (!ehFundo[p] && perto(p)) ehFundo[p] = 1
  }

  // fundo neutro (branco, cinza): o que aparece pelo furo é uma área grande, fechada, quase
  // da cor exata do fundo. Brilho pequeno na peça não entra, porque é pequeno
  if (!corViva) {
    const exato = (p) => {
      const i = p * 4
      return Math.hypot(data[i] - fundo[0], data[i + 1] - fundo[1], data[i + 2] - fundo[2]) <= 14
    }
    const visto = new Uint8Array(largura * altura)
    const minimo = largura * altura * 0.004
    for (let inicio = 0; inicio < largura * altura; inicio++) {
      if (visto[inicio] || ehFundo[inicio] || !exato(inicio)) continue
      const area = [inicio]
      visto[inicio] = 1
      for (let k = 0; k < area.length; k++) {
        const p = area[k]
        const x = p % largura
        for (const q of [p - 1, p + 1, p - largura, p + largura]) {
          if (q < 0 || q >= largura * altura) continue
          if ((q === p - 1 && x === 0) || (q === p + 1 && x === largura - 1)) continue
          if (!visto[q] && !ehFundo[q] && exato(q)) {
            visto[q] = 1
            area.push(q)
          }
        }
      }
      if (area.length >= minimo) for (const p of area) ehFundo[p] = 1
    }
  }

  // máscara: come um ponto do contorno (tira o halo da cor do fundo) e suaviza a borda
  const mascara = Buffer.alloc(largura * altura)
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const p = y * largura + x
      const naBorda =
        ehFundo[p] ||
        (x > 0 && ehFundo[p - 1]) ||
        (x < largura - 1 && ehFundo[p + 1]) ||
        (y > 0 && ehFundo[p - largura]) ||
        (y < altura - 1 && ehFundo[p + largura])
      mascara[p] = naBorda ? 0 : 255
    }
  }
  const suave = await sharp(mascara, { raw: { width: largura, height: altura, channels: 1 } })
    .blur(0.8)
    .raw()
    .toBuffer({ resolveWithObject: true })
  // o sharp pode devolver a máscara com mais de um canal: fica só o primeiro
  const passo = suave.info.channels
  const alfa = new Uint8Array(largura * altura)
  for (let p = 0; p < alfa.length; p++) alfa[p] = suave.data[p * passo]

  const opacos = alfa.reduce((n, a) => n + (a > 128 ? 1 : 0), 0)
  const parte = opacos / (largura * altura)
  if (parte < 0.03 || parte > 0.92) {
    throw new Error(
      `o recorte ficou com ${Math.round(parte * 100)}% da imagem: o fundo não é liso ou tem a cor da peça`,
    )
  }

  // caixa que contém a peça, com uma folga pequena
  let [x0, y0, x1, y1] = [largura, altura, 0, 0]
  for (let p = 0; p < largura * altura; p++) {
    if (alfa[p] > 8) {
      const [x, y] = [p % largura, Math.floor(p / largura)]
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  const folga = 6
  x0 = Math.max(0, x0 - folga)
  y0 = Math.max(0, y0 - folga)
  x1 = Math.min(largura - 1, x1 + folga)
  y1 = Math.min(altura - 1, y1 + folga)

  for (let p = 0; p < largura * altura; p++) {
    data[p * 4 + 3] = alfa[p]
    // na borda, tira o excesso da cor do fundo que sobra no ponto meio transparente
    if (corViva && alfa[p] < 250) {
      const i = p * 4
      const media = (data[i] + data[i + 1] + data[i + 2]) / 3
      data[i] = data[i + 1] = data[i + 2] = Math.round(media)
    }
  }
  return sharp(data, { raw: { width: largura, height: altura, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize({ width: LARGURA_FINAL, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toBuffer({ resolveWithObject: true })
}

const arquivos = existsSync(ORIGEM)
  ? readdirSync(ORIGEM).filter((a) => /\.(png|jpe?g|webp)$/i.test(a))
  : []
rmSync(DESTINO, { recursive: true, force: true })
mkdirSync(DESTINO, { recursive: true })
const manifesto = {}
let falhas = 0
for (const arquivo of arquivos.sort()) {
  const nome = chave(basename(arquivo, extname(arquivo)))
  if (!nome) {
    console.error(`✗ ${arquivo}: o nome precisa ser o código do item ou a ISO`)
    falhas++
    continue
  }
  try {
    const { data, info } = await recortar(join(ORIGEM, arquivo))
    writeFileSync(join(DESTINO, `${nome}.webp`), data)
    manifesto[nome] = {
      arquivo: `/pastilhas/${nome}.webp`,
      largura: info.width,
      altura: info.height,
    }
    console.log(`✓ ${arquivo} → ${DESTINO}/${nome}.webp (${info.width}×${info.height})`)
  } catch (e) {
    console.error(`✗ ${arquivo}: ${e.message}`)
    falhas++
  }
}
writeFileSync(MANIFESTO, `${JSON.stringify(manifesto, null, 2)}\n`)
console.log(
  arquivos.length === 0
    ? `Nenhuma imagem em ${ORIGEM}. A tela continua com os desenhos em vetor.`
    : `${Object.keys(manifesto).length} de ${arquivos.length} imagens publicadas. Manifesto em ${MANIFESTO}.`,
)
process.exit(falhas ? 1 : 0)
