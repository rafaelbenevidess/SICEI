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
  dimensao: { singular: 'Item', plural: 'Itens' },
  apresentar: 'codigo',
  medida: { titulo: 'Consumo na produção', curto: 'Consumo', pico: 'Maior consumo' },
  escolhidos: [],
  notaDoFluxo: 'Todos os itens.',
  alertasFiltrados: false,
  porDia: [
    { dia: '2026-09-22', chave: 'PST-001', nome: 'Pastilha CNMG', quantidade: 30, vezes: 3 },
    { dia: '2026-09-25', chave: 'PST-001', nome: 'Pastilha CNMG', quantidade: 18, vezes: 2 },
    { dia: '2026-09-24', chave: 'PST-004', nome: 'Pastilha APMT', quantidade: 12, vezes: 1 },
    { dia: '2026-09-15', chave: 'PST-001', nome: 'Pastilha CNMG', quantidade: 40, vezes: 4 },
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

const regiao = (rotulo: RegExp) => screen.getByRole('region', { name: rotulo })

describe('RF-17a · Painel de análise', () => {
  it('mostra o total do período (30 + 18 + 12 = 60) e a variação sobre o anterior (40 → +50%)', () => {
    render(<PainelAnalitico dados={dados} />)
    const consumo = regiao(/^Consumo no período/)
    expect(within(consumo).getByText('60 un.')).toBeInTheDocument()
    expect(within(consumo).getByText(/\+50.*40 un\./)).toBeInTheDocument()
  })

  it('média por dia de 60 un. em 7 dias é 8,6 un.', () => {
    render(<PainelAnalitico dados={dados} />)
    expect(within(regiao(/^Média por dia/)).getByText('8,6 un.')).toBeInTheDocument()
  })

  it('o maior consumo num só dia é 30 un., em 22/09', () => {
    render(<PainelAnalitico dados={dados} />)
    const pico = regiao(/^Maior consumo/)
    expect(within(pico).getByText('30 un.')).toBeInTheDocument()
    expect(within(pico).getByText('em 22/09')).toBeInTheDocument()
  })

  it('itens em alerta somam atenção, crítico e zerado (1 + 1 + 2 = 4)', () => {
    render(<PainelAnalitico dados={dados} />)
    expect(within(regiao(/^Itens em alerta/)).getByText('4')).toBeInTheDocument()
  })

  it('a medida muda os títulos: "Perdas no período"', () => {
    render(
      <PainelAnalitico
        dados={{
          ...dados,
          medida: { titulo: 'Perdas e quebras', curto: 'Perdas', pico: 'Mais perdas' },
        }}
      />,
    )
    expect(regiao(/^Perdas no período/)).toBeInTheDocument()
    expect(regiao(/^Mais perdas num só dia/)).toBeInTheDocument()
  })

  it('o ranking vem do maior para o menor: PST-001 (48) antes de PST-004 (12)', () => {
    render(<PainelAnalitico dados={dados} />)
    const botoes = within(regiao(/^Por item/)).getAllByRole('button')
    expect(botoes.map((b) => b.textContent)).toEqual([
      expect.stringContaining('PST-001'),
      expect.stringContaining('PST-004'),
    ])
  })

  it('clicar em PST-004 põe o item em foco: aviso e consumo de 12 un.', async () => {
    const usuario = userEvent.setup()
    render(<PainelAnalitico dados={dados} />)
    const barra = within(regiao(/^Por item/)).getByRole('button', { name: /PST-004/ })
    await usuario.click(barra)
    expect(barra).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Em foco: PST-004')
    expect(within(regiao(/^Consumo no período · PST-004/)).getByText('12 un.')).toBeInTheDocument()
  })

  it('"Tirar o foco" volta ao total de todos os itens', async () => {
    const usuario = userEvent.setup()
    render(<PainelAnalitico dados={dados} />)
    await usuario.click(screen.getByRole('button', { name: /PST-004/ }))
    await usuario.click(screen.getByRole('button', { name: /Tirar o foco/ }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(within(regiao(/^Consumo no período$/)).getByText('60 un.')).toBeInTheDocument()
  })

  it('clicar de novo na mesma barra também tira o foco', async () => {
    const usuario = userEvent.setup()
    render(<PainelAnalitico dados={dados} />)
    const barra = screen.getByRole('button', { name: /PST-001/ })
    await usuario.click(barra)
    await usuario.click(barra)
    expect(barra).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('com 2 itens escolhidos, a evolução mostra um traço de cada, lado a lado', () => {
    render(
      <PainelAnalitico
        dados={{
          ...dados,
          escolhidos: [
            { chave: 'PST-004', nome: 'Pastilha APMT' },
            { chave: 'PST-001', nome: 'Pastilha CNMG' },
          ],
        }}
      />,
    )
    const evolucao = regiao(/^Evolução, lado a lado/)
    expect(within(evolucao).getByRole('img', { name: /Comparação de PST-004, PST-001/ }))
    expect(within(evolucao).getByRole('list')).toHaveTextContent('PST-004PST-001')
  })

  it('escolhido sem consumo no período aparece com zero no ranking e no detalhe', () => {
    render(
      <PainelAnalitico
        dados={{
          ...dados,
          escolhidos: [
            { chave: 'PST-001', nome: 'Pastilha CNMG' },
            { chave: 'PST-009', nome: 'Pastilha nova' },
          ],
        }}
      />,
    )
    expect(within(regiao(/^Por item/)).getByRole('button', { name: /PST-009/ })).toHaveTextContent(
      '0 un.',
    )
    const linha = within(regiao(/^Detalhe por item/))
      .getAllByRole('row')
      .find((r) => r.textContent?.includes('PST-009'))!
    expect(within(linha).getAllByRole('cell')[1]).toHaveTextContent('0')
  })

  it('a tabela de detalhe compara cada item com o anterior: PST-001 48 contra 40 (+20%), 5 retiradas', () => {
    render(<PainelAnalitico dados={dados} />)
    const linha = within(regiao(/^Detalhe por item/))
      .getAllByRole('row')
      .find((r) => r.textContent?.includes('PST-001'))!
    const celulas = within(linha)
      .getAllByRole('cell')
      .map((c) => c.textContent)
    expect(celulas.slice(1)).toEqual(['48', '40', '+20%', '6,9', '80%', '5'])
  })

  it('colaborador aparece pelo nome, com a matrícula embaixo', () => {
    render(
      <PainelAnalitico
        dados={{
          ...dados,
          dimensao: { singular: 'Colaborador', plural: 'Colaboradores' },
          apresentar: 'pessoa',
          porDia: [
            { dia: '2026-09-22', chave: '1045', nome: 'Juliana Martins', quantidade: 5, vezes: 1 },
          ],
        }}
      />,
    )
    const barra = within(regiao(/^Por colaborador/)).getByRole('button')
    expect(barra).toHaveTextContent('Juliana Martins')
    expect(barra).toHaveTextContent('Matrícula 1045')
  })

  it('cada gráfico tem a tabela com os mesmos números ("Ver dados em tabela")', () => {
    render(<PainelAnalitico dados={dados} />)
    expect(screen.getAllByText('Ver dados em tabela')).toHaveLength(3)
  })

  it('nada encontrado com os filtros mostra o aviso em vez dos gráficos', () => {
    render(
      <PainelAnalitico dados={{ ...dados, porDia: [], porHora: [], fluxo: [], situacao: {} }} />,
    )
    expect(screen.getByText(/Nada encontrado com estes filtros/)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  describe('seis itens (o caso do print): nenhum fica cinza', () => {
    const seis = ['PST-001', 'PST-002', 'PST-003', 'PST-004', 'PST-005', 'PST-006']
    const comSeis: DadosDoPainel = {
      ...dados,
      porDia: seis.map((chave, i) => ({
        dia: '2026-09-25',
        chave,
        nome: `Pastilha ${i + 1}`,
        quantidade: 60 - i * 10,
        vezes: 1,
      })),
    }
    const coresDasBarras = () =>
      within(regiao(/^Por item/))
        .getAllByRole('button')
        .map((b) => (b.querySelector('[style*="background"]') as HTMLElement).style.background)

    it('sem escolha, cada um dos 6 tem cor própria no ranking e na composição, sem "Outros"', () => {
      render(<PainelAnalitico dados={comSeis} />)
      expect(coresDasBarras()).toEqual(seis.map((_, i) => `var(--serie-${i + 1})`))
      expect(within(regiao(/^Composição/)).getByRole('list')).not.toHaveTextContent('Outros')
    })

    it('escolhendo os 6, a evolução mostra um traço de cada, nas cores da ordem da escolha', () => {
      const escolhidos = [...seis].reverse().map((chave) => ({ chave, nome: chave }))
      render(<PainelAnalitico dados={{ ...comSeis, escolhidos }} />)
      expect(regiao(/^Evolução, lado a lado/)).toBeInTheDocument()
      // o ranking vem do maior (PST-001) para o menor, mas a cor segue a ordem da escolha
      expect(coresDasBarras()).toEqual(seis.map((_, i) => `var(--serie-${6 - i})`))
    })
  })
})
