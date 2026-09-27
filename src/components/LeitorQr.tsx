'use client'

import { Camera, CameraOff, CircleCheck, ScanLine } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { codigoDoQr } from '@/domain/posicao'
import { mensagemDoErroDeCamera, tamanhoDeAnalise } from '@/lib/camera'
import { classeBotao } from './ui'

/** API de leitura nativa (Chrome no Android). Ainda não faz parte dos tipos do TypeScript. */
interface LeitorNativo {
  detect(fonte: CanvasImageSource): Promise<{ rawValue: string }[]>
}
interface ConstrutorLeitorNativo {
  new (opcoes: { formats: string[] }): LeitorNativo
  getSupportedFormats(): Promise<string[]>
}

type Decodificar = (video: HTMLVideoElement) => Promise<string[]>

/**
 * Leitor usado neste aparelho: o nativo do navegador quando existe (rápido, Android), senão o
 * jsQR, em JavaScript puro, que funciona em qualquer navegador com câmera (iPhone incluído).
 * O jsQR só é baixado quando precisa.
 */
async function criarDecodificador(): Promise<Decodificar> {
  const Nativo = (globalThis as { BarcodeDetector?: ConstrutorLeitorNativo }).BarcodeDetector
  if (Nativo) {
    try {
      if ((await Nativo.getSupportedFormats()).includes('qr_code')) {
        const leitor = new Nativo({ formats: ['qr_code'] })
        return async (video) => (await leitor.detect(video)).map((r) => r.rawValue)
      }
    } catch {
      // cai para o jsQR
    }
  }
  const jsQR = (await import('jsqr')).default
  const tela = document.createElement('canvas')
  const ctx = tela.getContext('2d', { willReadFrequently: true })
  return async (video) => {
    const { largura, altura } = tamanhoDeAnalise(video.videoWidth, video.videoHeight)
    if (!ctx || largura === 0) return []
    tela.width = largura
    tela.height = altura
    ctx.drawImage(video, 0, 0, largura, altura)
    const imagem = ctx.getImageData(0, 0, largura, altura)
    const r = jsQR(imagem.data, largura, altura, { inversionAttempts: 'dontInvert' })
    return r ? [r.data] : []
  }
}

type Estado = 'parado' | 'abrindo' | 'lendo' | 'lido' | 'erro'

const INTERVALO_MS = 200

/**
 * RN-26: lê a etiqueta com a câmera traseira, dentro do próprio SICEI, e abre a posição.
 * A imagem é analisada só no aparelho; nada da câmera vai para o servidor.
 */
export function LeitorQr({ autoIniciar = false }: { autoIniciar?: boolean }) {
  const router = useRouter()
  // o efeito de abrir a câmera não pode depender do roteador: se rodasse de novo, desligaria a câmera
  const roteador = useRef(router)
  useEffect(() => {
    roteador.current = router
  }, [router])
  const video = useRef<HTMLVideoElement>(null)
  const fluxo = useRef<MediaStream | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ativo = useRef(false)
  // cada abertura ganha um número; uma abertura antiga que termine depois é descartada
  const sessao = useRef(0)
  const [estado, setEstado] = useState<Estado>('parado')
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [lido, setLido] = useState<string | null>(null)

  const parar = useCallback(() => {
    sessao.current += 1
    ativo.current = false
    if (temporizador.current) clearTimeout(temporizador.current)
    fluxo.current?.getTracks().forEach((t) => t.stop())
    fluxo.current = null
    if (video.current) video.current.srcObject = null
  }, [])

  const iniciar = useCallback(async () => {
    parar()
    setErro(null)
    setAviso(null)
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setErro(mensagemDoErroDeCamera('ConexaoInsegura'))
      setEstado('erro')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro(mensagemDoErroDeCamera('SemSuporte'))
      setEstado('erro')
      return
    }
    setEstado('abrindo')
    const minha = sessao.current
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      if (minha !== sessao.current || !video.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      fluxo.current = stream
      video.current.srcObject = stream
      await video.current.play()
      const decodificar = await criarDecodificador()
      if (minha !== sessao.current) return
      ativo.current = true
      setEstado('lendo')

      const analisar = async () => {
        if (!ativo.current || !video.current) return
        try {
          if (video.current.readyState >= 2) {
            for (const texto of await decodificar(video.current)) {
              const codigo = codigoDoQr(texto)
              if (codigo) {
                parar()
                navigator.vibrate?.(80)
                setLido(codigo)
                setEstado('lido')
                roteador.current.push(`/p/${encodeURIComponent(codigo)}`)
                return
              }
              setAviso('Este QR não é uma etiqueta do SICEI. Aponte para a etiqueta da gaveta.')
            }
          }
        } catch {
          // um quadro ruim não interrompe a leitura
        }
        if (ativo.current) temporizador.current = setTimeout(analisar, INTERVALO_MS)
      }
      analisar()
    } catch (e) {
      if (minha !== sessao.current) return
      parar()
      setErro(mensagemDoErroDeCamera((e as { name?: string })?.name))
      setEstado('erro')
    }
  }, [parar])

  useEffect(() => {
    // abre sozinho ao entrar na tela; o estado muda dentro da promessa, fora deste efeito
    if (autoIniciar) void Promise.resolve().then(iniciar)
    return parar
  }, [autoIniciar, iniciar, parar])

  const mostrandoVideo = estado === 'abrindo' || estado === 'lendo'

  return (
    <section
      aria-label="Leitor de QR"
      className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-cartao"
    >
      <div className="relative aspect-[4/5] max-h-[62dvh] w-full overflow-hidden bg-[#0d1117] sm:aspect-video">
        <video
          ref={video}
          muted
          playsInline
          autoPlay
          aria-label="Imagem da câmera"
          className={`absolute inset-0 size-full object-cover ${mostrandoVideo ? '' : 'invisible'}`}
        />
        {mostrandoVideo && (
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            {/* moldura: escurece em volta e marca o quadrado onde a etiqueta deve ficar */}
            <div className="relative aspect-square w-[62%] max-w-[300px] rounded-2xl shadow-[0_0_0_9999px_rgb(0_0_0/0.45)]">
              {[
                'top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl',
                'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl',
                'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl',
                'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl',
              ].map((c) => (
                <span key={c} className={`absolute size-9 border-white ${c}`} />
              ))}
              <span className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-accent" />
            </div>
          </div>
        )}
        {!mostrandoVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-white">
            {estado === 'lido' ? (
              <>
                <CircleCheck aria-hidden className="size-14 text-[#4ade80]" />
                <p className="text-lg font-semibold">
                  Posição <span className="font-mono">{lido}</span>
                </p>
                <p className="text-sm text-white/75">Abrindo o item…</p>
              </>
            ) : estado === 'erro' ? (
              <>
                <CameraOff aria-hidden className="size-12 text-white/80" />
                <button
                  type="button"
                  onClick={iniciar}
                  className={`${classeBotao('primario')} h-12 px-6 text-[15px]`}
                >
                  <Camera aria-hidden />
                  Tentar de novo
                </button>
              </>
            ) : (
              <>
                <ScanLine aria-hidden className="size-12 text-white/80" />
                <button
                  type="button"
                  onClick={iniciar}
                  className={`${classeBotao('primario')} h-12 px-6 text-[15px]`}
                >
                  <Camera aria-hidden />
                  Abrir câmera
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p
          role={estado === 'erro' ? 'alert' : 'status'}
          className={`min-w-0 flex-1 basis-56 text-[13px] ${estado === 'erro' ? 'text-crit-ink' : aviso ? 'text-warn-ink' : 'text-ink-2'}`}
        >
          {estado === 'erro'
            ? erro
            : estado === 'abrindo'
              ? 'Abrindo a câmera… Se o navegador perguntar, permita o acesso.'
              : estado === 'lendo'
                ? (aviso ?? 'Aponte para a etiqueta da gaveta e segure o celular parado.')
                : estado === 'lido'
                  ? `Etiqueta ${lido} lida.`
                  : 'A leitura acontece no próprio celular; nenhuma imagem sai do aparelho.'}
        </p>
        {mostrandoVideo && (
          <button
            type="button"
            onClick={() => {
              parar()
              setEstado('parado')
            }}
            className={classeBotao('secundario', true)}
          >
            Fechar câmera
          </button>
        )}
      </div>
    </section>
  )
}
