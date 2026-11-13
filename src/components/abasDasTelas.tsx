import {
  ArrowLeftRight,
  ChartLine,
  Factory,
  FileChartColumn,
  Grid3x3,
  HardHat,
  MapPin,
  Package,
  QrCode,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Abas } from './ui'

/**
 * Abas das telas que reúnem vários endereços (doc 03, seção 10.10). A mesma barra aparece
 * em todos eles, então trocar de aba nunca tira a pessoa da tela: muda só o conteúdo.
 */

const comIcone = (Icone: typeof Package, texto: string): ReactNode => (
  <>
    <Icone aria-hidden className="size-4" /> {texto}
  </>
)

export type AbaDeRelatorio = 'consumo' | 'movimentacao' | 'reposicao' | 'analise'

/** Relatórios: consumo, movimentação, sugestão de compra e análise. O período segue junto. */
export function AbasDeRelatorios({
  ativa,
  de,
  ate,
}: {
  ativa: AbaDeRelatorio
  de?: string
  ate?: string
}) {
  const periodo = de && ate ? `&de=${de}&ate=${ate}` : ''
  return (
    <Abas
      rotulo="Tipo de relatório"
      opcoes={[
        {
          href: `/relatorios?tipo=consumo${periodo}`,
          rotulo: comIcone(FileChartColumn, 'Consumo'),
          ativo: ativa === 'consumo',
        },
        {
          href: `/relatorios?tipo=movimentacao${periodo}`,
          rotulo: comIcone(ArrowLeftRight, 'Movimentação'),
          ativo: ativa === 'movimentacao',
        },
        {
          href: '/relatorios?tipo=reposicao',
          rotulo: comIcone(ShoppingCart, 'Sugestão de compra'),
          ativo: ativa === 'reposicao',
        },
        {
          href: `/analise${periodo ? `?${periodo.slice(1)}` : ''}`,
          rotulo: comIcone(ChartLine, 'Análise'),
          ativo: ativa === 'analise',
        },
      ]}
    />
  )
}

export const ABAS_DE_CADASTRO = [
  'itens',
  'fabricantes',
  'fornecedores',
  'destinos',
  'colaboradores',
  'posicoes',
] as const
export type AbaDeCadastro = (typeof ABAS_DE_CADASTRO)[number] | 'etiquetas'

const CADASTROS: Record<(typeof ABAS_DE_CADASTRO)[number], [typeof Package, string]> = {
  itens: [Package, 'Itens'],
  fabricantes: [Factory, 'Fabricantes'],
  fornecedores: [Truck, 'Fornecedores'],
  destinos: [MapPin, 'Destinos'],
  colaboradores: [HardHat, 'Colaboradores'],
  posicoes: [Grid3x3, 'Posições'],
}

/** Cadastros: as seis listas e, para quem imprime etiquetas, as Etiquetas QR. */
export function AbasDeCadastros({
  ativa,
  contagens,
  comEtiquetas,
  etiquetasPendentes,
}: {
  ativa: AbaDeCadastro
  contagens?: Partial<Record<(typeof ABAS_DE_CADASTRO)[number], number>>
  comEtiquetas: boolean
  etiquetasPendentes?: number
}) {
  return (
    <Abas
      rotulo="Tipo de cadastro"
      opcoes={[
        ...ABAS_DE_CADASTRO.map((aba) => ({
          href: `/cadastros?aba=${aba}`,
          rotulo: comIcone(...CADASTROS[aba]),
          contagem: contagens?.[aba],
          ativo: ativa === aba,
        })),
        ...(comEtiquetas
          ? [
              {
                href: '/cadastros/posicoes/etiquetas',
                rotulo: comIcone(QrCode, 'Etiquetas QR'),
                contagem: etiquetasPendentes || undefined,
                ativo: ativa === 'etiquetas',
              },
            ]
          : []),
      ]}
    />
  )
}
