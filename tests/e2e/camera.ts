import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'

/** Vídeo usado como câmera falsa do Chromium nos testes (formato Y4M). */
export const VIDEO_DA_CAMERA = path.resolve('tests/e2e/.gerado/camera-qr.y4m')

/**
 * Grava um vídeo Y4M de 640×480 com o QR do texto no centro, fundo branco. O Chromium repete
 * o vídeo como se fosse a câmera (--use-file-for-fake-video-capture).
 */
export function gravarVideoDoQr(texto: string, arquivo = VIDEO_DA_CAMERA) {
  const L = 640
  const A = 480
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: 'M' })
  const lado = modules.size + 8 // zona de silêncio de 4 módulos
  const escala = Math.floor((A * 0.8) / lado)
  const x0 = Math.floor((L - lado * escala) / 2)
  const y0 = Math.floor((A - lado * escala) / 2)
  const luminancia = Buffer.alloc(L * A, 235)
  for (let y = 0; y < lado * escala; y++) {
    for (let x = 0; x < lado * escala; x++) {
      const linha = Math.floor(y / escala) - 4
      const coluna = Math.floor(x / escala) - 4
      const dentro = linha >= 0 && coluna >= 0 && linha < modules.size && coluna < modules.size
      if (dentro && modules.get(linha, coluna)) luminancia[(y0 + y) * L + x0 + x] = 16
    }
  }
  const cor = Buffer.alloc((L / 2) * (A / 2) * 2, 128)
  const quadro = Buffer.concat([Buffer.from('FRAME\n'), luminancia, cor])
  mkdirSync(path.dirname(arquivo), { recursive: true })
  writeFileSync(
    arquivo,
    Buffer.concat([Buffer.from(`YUV4MPEG2 W${L} H${A} F10:1 Ip A1:1 C420jpeg\n`), quadro, quadro]),
  )
}
