// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LeitorQr } from './LeitorQr'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

const parar = vi.fn()
const fluxoFalso = { getTracks: () => [{ stop: parar }] } as unknown as MediaStream

function camera(getUserMedia: () => Promise<MediaStream>) {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn(getUserMedia) },
    configurable: true,
  })
}

/** Leitor nativo falso que devolve, a cada quadro, o próximo texto da lista. */
function leitorNativo(textos: string[]) {
  let i = 0
  vi.stubGlobal(
    'BarcodeDetector',
    class {
      static getSupportedFormats = async () => ['qr_code']
      detect = async () => {
        const t = textos[Math.min(i++, textos.length - 1)]
        return t ? [{ rawValue: t }] : []
      }
    },
  )
}

beforeEach(() => {
  push.mockReset()
  parar.mockReset()
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(4)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true })
})

describe('RN-26 · Leitor de QR na tela Ler QR', () => {
  it('etiqueta do SICEI: desliga a câmera e abre a posição lida', async () => {
    camera(async () => fluxoFalso)
    leitorNativo(['https://sicei-ddametalurgica.vercel.app/p/a01-g03-c04'])
    render(<LeitorQr autoIniciar />)
    await waitFor(() => expect(push).toHaveBeenCalledWith('/p/A01-G03-C04'))
    expect(parar).toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent('Etiqueta A01-G03-C04 lida.')
  })

  it('QR que não é etiqueta: avisa e continua lendo até achar a etiqueta', async () => {
    camera(async () => fluxoFalso)
    leitorNativo(['NF-e 3526091234', 'NF-e 3526091234', 'A02-G01-C07'])
    render(<LeitorQr autoIniciar />)
    await waitFor(() => expect(screen.getByText(/não é uma etiqueta do SICEI/)).toBeInTheDocument())
    await waitFor(() => expect(push).toHaveBeenCalledWith('/p/A02-G01-C07'))
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('sem autoIniciar: espera o toque em "Abrir câmera"', async () => {
    const user = userEvent.setup()
    camera(async () => fluxoFalso)
    leitorNativo(['A01-G01-C01'])
    render(<LeitorQr />)
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Abrir câmera' }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/p/A01-G01-C01'))
  })

  it('permissão negada: explica como liberar e oferece tentar de novo', async () => {
    camera(async () => {
      throw new DOMException('negado', 'NotAllowedError')
    })
    render(<LeitorQr autoIniciar />)
    expect(await screen.findByRole('alert')).toHaveTextContent('acesso à câmera foi negado')
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it('navegador sem acesso à câmera: orienta a digitar o código', async () => {
    render(<LeitorQr autoIniciar />)
    expect(await screen.findByRole('alert')).toHaveTextContent('digite o código da etiqueta')
  })

  it('"Fechar câmera" desliga a câmera', async () => {
    const user = userEvent.setup()
    camera(async () => fluxoFalso)
    leitorNativo([''])
    render(<LeitorQr autoIniciar />)
    await user.click(await screen.findByRole('button', { name: 'Fechar câmera' }))
    expect(parar).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Abrir câmera' })).toBeInTheDocument()
  })
})
