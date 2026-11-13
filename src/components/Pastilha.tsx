import Image from 'next/image'
import { useId, type CSSProperties } from 'react'
import {
  caminhoSvg,
  contornoDaPastilha,
  formaDaPastilha,
  fotoDaPastilha,
  raioInscrito,
  verticesDaPastilha,
  vistaDaPastilha,
  type FotoDaPastilha,
} from '@/domain/pastilha'
import { FOTOS_DAS_PASTILHAS } from '@/lib/fotosDasPastilhas'

/**
 * A pastilha do item. Se existe foto recortada para o código ou para a ISO dele
 * (public/pastilhas, gerada por `npm run pastilhas`), mostra a foto. Senão desenha a
 * pastilha em vetor a partir da designação ISO (domain/pastilha.ts): losango, trigonal,
 * triangular, quadrada… com ou sem furo, seguindo o tema pelas variáveis --pastilha-*.
 */
export function Pastilha({
  iso,
  codigo,
  gravacao,
  className,
  fotos = FOTOS_DAS_PASTILHAS,
}: {
  iso?: string | null
  /** código do item (PST-001): a foto com esse nome vence a foto da ISO */
  codigo?: string | null
  /** texto gravado na face do desenho, como nas pastilhas de verdade (a classe: "P25") */
  gravacao?: string | null
  className?: string
  fotos?: Record<string, FotoDaPastilha>
}) {
  const foto = fotoDaPastilha({ codigo, iso }, fotos)
  if (foto) {
    return (
      <Image
        src={foto.arquivo}
        width={foto.largura}
        height={foto.altura}
        sizes="(min-width: 768px) 360px, 80vw"
        alt={`Pastilha: ${formaDaPastilha(iso).nome.toLowerCase()}`}
        className={`object-contain drop-shadow-[0_18px_14px_rgb(16_24_40/0.22)] ${className ?? ''}`}
      />
    )
  }
  return <DesenhoDaPastilha iso={iso} gravacao={gravacao} className={className} />
}

function DesenhoDaPastilha({
  iso,
  gravacao,
  className,
}: {
  iso?: string | null
  gravacao?: string | null
  className?: string
}) {
  const id = useId()
  const forma = formaDaPastilha(iso)
  const v = vistaDaPastilha(forma)
  const face = caminhoSvg(v.face)
  const [cos, , senNegativo] = v.matriz
  const sen = -senNegativo
  const { x, y, largura, altura } = v.caixa
  const comGravacao = gravacao && v.inscrito >= 0.45
  return (
    <svg
      viewBox={`${x} ${y} ${largura} ${altura}`}
      role="img"
      aria-label={`Pastilha: ${forma.nome.toLowerCase()}`}
      className={className}
    >
      <defs>
        <linearGradient
          id={`${id}-face`}
          gradientUnits="userSpaceOnUse"
          x1={-0.9}
          y1={-0.7}
          x2={0.9}
          y2={0.8}
        >
          <stop offset="0" style={{ stopColor: 'var(--pastilha-luz)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pastilha-meio)' }} />
        </linearGradient>
        <radialGradient id={`${id}-chao`}>
          <stop offset="0" style={{ stopColor: 'var(--ink)', stopOpacity: 0.26 }} />
          <stop offset="0.6" style={{ stopColor: 'var(--ink)', stopOpacity: 0.08 }} />
          <stop offset="1" style={{ stopColor: 'var(--ink)', stopOpacity: 0 }} />
        </radialGradient>
        {/* dentro do furo: a parede do fundo aparece em cima, a abertura escura embaixo */}
        <linearGradient
          id={`${id}-furo`}
          gradientUnits="userSpaceOnUse"
          x1={-sen * (v.furo ?? 0)}
          y1={-cos * (v.furo ?? 0)}
          x2={sen * (v.furo ?? 0)}
          y2={cos * (v.furo ?? 0)}
        >
          <stop offset="0" style={{ stopColor: 'var(--pastilha-meio)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--pastilha-sombra)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pastilha-gravacao)' }} />
        </linearGradient>
      </defs>
      <ellipse
        cx={v.sombra.x}
        cy={v.sombra.y}
        rx={v.sombra.rx}
        ry={v.sombra.ry}
        fill={`url(#${id}-chao)`}
      />
      {v.paredes.map((p, i) => {
        const cor = `color-mix(in oklch, var(--pastilha-meio) ${Math.round(p.luz * 100)}%, var(--pastilha-sombra))`
        return (
          <path
            key={i}
            d={caminhoSvg(p.pontos)}
            strokeWidth={0.012}
            strokeLinejoin="round"
            style={{ fill: cor, stroke: cor }}
          />
        )
      })}
      <g transform={`matrix(${v.matriz.join(' ')})`}>
        <path
          d={face}
          fill={`url(#${id}-face)`}
          strokeWidth={0.022}
          strokeLinejoin="round"
          style={{ stroke: 'var(--pastilha-luz)' }}
        />
        {/* quebra-cavaco: um sulco que acompanha a aresta e o platô do meio */}
        <path
          d={face}
          transform="scale(0.82)"
          fill="none"
          strokeWidth={0.05}
          strokeLinejoin="round"
          style={{ stroke: 'var(--pastilha-sombra)', opacity: 0.32 }}
        />
        <path
          d={face}
          transform="scale(0.775)"
          fill="none"
          strokeWidth={0.02}
          strokeLinejoin="round"
          style={{ stroke: 'var(--pastilha-luz)', opacity: 0.85 }}
        />
        <path
          d={face}
          transform="scale(0.6)"
          style={{ fill: 'var(--pastilha-luz)', opacity: 0.3 }}
        />
        {v.furo !== null && (
          <>
            <circle
              r={v.furo * 1.32}
              strokeWidth={0.02}
              style={{
                fill: 'var(--pastilha-meio)',
                stroke: 'var(--pastilha-luz)',
                opacity: 0.9,
              }}
            />
            <circle r={v.furo} fill={`url(#${id}-furo)`} />
          </>
        )}
        {comGravacao && (
          <text
            x={0}
            y={v.inscrito * (v.furo === null ? 0.08 : 0.74)}
            textAnchor="middle"
            fontSize={v.inscrito * 0.2}
            className="font-mono font-semibold"
            style={{ fill: 'var(--pastilha-gravacao)', opacity: 0.62 }}
          >
            {gravacao}
          </text>
        )}
      </g>
    </svg>
  )
}

/**
 * A mesma pastilha vista de cima, em traço: para listas e tabelas, onde o desenho em
 * perspectiva ficaria pequeno demais para ler.
 */
export function GlifoDaPastilha({
  iso,
  className = 'size-7',
  style,
}: {
  iso?: string | null
  className?: string
  style?: CSSProperties
}) {
  const forma = formaDaPastilha(iso)
  const vertices = verticesDaPastilha(forma)
  const inscrito = raioInscrito(vertices)
  const contorno = contornoDaPastilha(vertices, 0.16 * inscrito, 4).map(
    ([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000] as const,
  )
  return (
    <svg
      viewBox="-1.12 -1.12 2.24 2.24"
      aria-hidden
      className={`shrink-0 ${className}`}
      style={style}
    >
      <title>{forma.nome}</title>
      <path
        d={caminhoSvg(contorno)}
        strokeWidth={0.13}
        strokeLinejoin="round"
        style={{
          fill: 'color-mix(in oklch, currentColor 12%, transparent)',
          stroke: 'currentColor',
        }}
      />
      {forma.temFuro && (
        <circle
          r={Math.round(0.4 * inscrito * 1000) / 1000}
          fill="none"
          strokeWidth={0.11}
          style={{ stroke: 'currentColor' }}
        />
      )}
    </svg>
  )
}
