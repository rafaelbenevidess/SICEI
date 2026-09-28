// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { PainelAnalitico, type DadosDoPainel } from './PainelAnalitico'

afterEach(cleanup)

/** 7 dias (21 a 27/09) e o período anterior (14 a 20/09), com dois itens. */
const dados: DadosDoPainel = {
  deIso: '2026-09-21',
  ateIso: '2026-09-27',
  anterior: { deIso: '2026-09-14', ateIso: '2026-09-20' },
  dimensao: 'Item',
  porDia: [
    { dia: '2026-09-22', chave: 'PST-001', nome: 'Pastilha CNMG', quantidade: 30 },
    { dia: '2026-09-25', chave: 'PST-001', nome: 'Pastilha CNMG', quantidade: 18 },
    { dia: '2026-09-24', chave: 'PST-004', nome: 'Pastilha APMT', quantidade: 12 },
    { dia: '2026-09-15', chave: 'PST-001', nome: 'Pastilha CNMG', quantidade: 40 },
  ],
  porHora: [
    { diaSemana: 2, hora: 7, chave: 'PST-001', quantidade: 30 },
    { diaSemana: 5, hora: 14, chave: 'PST-001', quantidade: 18 },
    { diaSemana: 4, hora: 9, chave: 'PST-004', quantidade: 12 },
  ],
  fluxo: [
    { dia: '2026-09-21', entradas: 100, saidas: 0 },
    { dia: '2026-09-22', entradas: 0, saidas: 30 },
  ],
  situacao: { OK: 3, ATENCAO: 1, CRITICO: 1, ZERADO: 2 },
}

const numero = (rotulo: RegExp) => screen.getByRole('region', { name: rotulo })

describe('RF-17a · Painel de análise dos relatórios', () => {
  it('mostra o total do período (30 + 18 + 12 = 60) e a variação sobre o anterior (40 → +50%)', () => {
    render(<PainelAnalitico dados={dados} />)
    const consumo = numero(/^Consumo no período/)
    expect(within(consumo).getByText('60 un.')).toBeInTheDocument()
    expect(within(consumo).getByText(/\+50.*40 un\./)).toBeInTheDocument()
  })

  it('média por dia de 60 un. em 7 dias é 8,6 un.', () => {
    render(<PainelAnalitico dados={dados} />)
    expect(within(numero(/^Média por dia/)).getByText('8,6 un.')).toBeInTheDocument()
  })

  it('o maior consumo num só dia é 30 un., em 22/09', () => {
    render(<PainelAnalitico dados={dados} />)
    const pico = numero(/^Maior consumo/)
    expect(within(pico).getByText('30 un.')).toBeInTheDocument()
    expect(within(pico).getByText('em 22/09')).toBeInTheDocument()
  })

  it('itens em alerta somam atenção, crítico e zerado (1 + 1 + 2 = 4)', () => {
    render(<PainelAnalitico dados={dados} />)
    expect(within(numero(/^Itens em alerta/)).getByText('4')).toBeInTheDocument()
  })

  it('o ranking vem do maior para o menor: PST-001 (48) antes de PST-004 (12)', () => {
    render(<PainelAnalitico dados={dados} />)
    const botoes = within(numero(/^Consumo por item/)).getAllByRole('button')
    expect(botoes.map((b) => b.textContent)).toEqual([
      expect.stringContaining('PST-001'),
      expect.stringContaining('PST-004'),
    ])
  })

  it('clicar em PST-004 filtra o painel: aviso de filtro e consumo de 12 un.', async () => {
    const usuario = userEvent.setup()
    render(<PainelAnalitico dados={dados} />)
    const barra = within(numero(/^Consumo por item/)).getByRole('button', { name: /PST-004/ })
    await usuario.click(barra)
    expect(barra).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Filtrando por PST-004')
    expect(within(numero(/^Consumo no período · PST-004/)).getByText('12 un.')).toBeInTheDocument()
  })

  it('"Tirar o filtro" volta ao total de todos os itens', async () => {
    const usuario = userEvent.setup()
    render(<PainelAnalitico dados={dados} />)
    await usuario.click(screen.getByRole('button', { name: /PST-004/ }))
    await usuario.click(screen.getByRole('button', { name: /Tirar o filtro/ }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(within(numero(/^Consumo no período$/)).getByText('60 un.')).toBeInTheDocument()
  })

  it('clicar de novo na mesma barra também tira o filtro', async () => {
    const usuario = userEvent.setup()
    render(<PainelAnalitico dados={dados} />)
    const barra = screen.getByRole('button', { name: /PST-001/ })
    await usuario.click(barra)
    await usuario.click(barra)
    expect(barra).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('cada gráfico tem a tabela com os mesmos números ("Ver dados em tabela")', () => {
    render(<PainelAnalitico dados={dados} />)
    expect(screen.getAllByText('Ver dados em tabela')).toHaveLength(3)
  })

  it('sem movimentação no período, mostra o aviso em vez dos gráficos', () => {
    render(
      <PainelAnalitico dados={{ ...dados, porDia: [], porHora: [], fluxo: [], situacao: {} }} />,
    )
    expect(screen.getByText(/Nenhuma movimentação neste período/)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
