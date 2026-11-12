// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BarraDeComparacao, MedidorDeTracos, PontosPorDia } from './medidores'
import { GlifoDaPastilha, Pastilha } from './Pastilha'
import { Gauge, Segmentado } from './ui'

afterEach(cleanup)

const dias = (totais: number[]) =>
  totais.map((total, i) => ({
    dia: `2026-11-${String(i + 1).padStart(2, '0')}`,
    rotulo: `${String(i + 1).padStart(2, '0')}/11`,
    total,
    hoje: i === totais.length - 1,
  }))

describe('Interface · Desenho da pastilha', () => {
  it('descreve o formato lido da ISO para quem usa leitor de tela', () => {
    render(<Pastilha iso="CNMG 120408" gravacao="P25" />)
    expect(screen.getByRole('img', { name: 'Pastilha: losango 80°' })).toBeInTheDocument()
    expect(screen.getByText('P25')).toBeInTheDocument()
  })

  it('pastilha sem furo (SNMN) não desenha o furo; com furo (SNMG), desenha', () => {
    const { container: semFuro } = render(<Pastilha iso="SNMN 120408" />)
    expect(semFuro.querySelectorAll('circle')).toHaveLength(0)
    cleanup()
    const { container: comFuro } = render(<Pastilha iso="SNMG 120408" />)
    expect(comFuro.querySelectorAll('circle').length).toBeGreaterThan(0)
  })

  it('formato estreito (losango 35°) não recebe gravação: não caberia na face', () => {
    render(<Pastilha iso="VBMT 160404" gravacao="P25" />)
    expect(screen.queryByText('P25')).not.toBeInTheDocument()
  })

  it('item sem ISO usa o desenho genérico, sem quebrar', () => {
    render(<Pastilha iso={null} />)
    expect(
      screen.getByRole('img', { name: 'Pastilha: formato não identificado' }),
    ).toBeInTheDocument()
  })

  it('duas pastilhas na mesma tela não dividem os degradês (ids diferentes)', () => {
    const { container } = render(
      <>
        <Pastilha iso="CNMG 120408" />
        <Pastilha iso="TNMG 160404" />
      </>,
    )
    const ids = [...container.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('o glifo da lista é decorativo e traz o nome do formato no título', () => {
    const { container } = render(<GlifoDaPastilha iso="WNMG 080408" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg.querySelector('title')).toHaveTextContent('Trigonal')
    expect(svg.querySelectorAll('circle')).toHaveLength(1)
  })
})

describe('RF-16 · Medidores do painel', () => {
  it('o arco acende a metade dos traços em 50% e traz a frase para leitor de tela', () => {
    const { container } = render(
      <MedidorDeTracos percentual={50} rotulo="50% dos itens acima do ponto de reposição">
        <span>50%</span>
      </MedidorDeTracos>,
    )
    expect(
      screen.getByRole('img', { name: '50% dos itens acima do ponto de reposição' }),
    ).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(container.querySelectorAll('line')).toHaveLength(41)
    expect(container.querySelectorAll('line.acende')).toHaveLength(21)
  })

  it('sem percentual (nenhum item) nenhum traço acende', () => {
    const { container } = render(
      <MedidorDeTracos percentual={null} rotulo="Nenhum item cadastrado">
        <span>—</span>
      </MedidorDeTracos>,
    )
    expect(container.querySelectorAll('line.acende')).toHaveLength(0)
  })

  it('a barra de comparação mostra a hachura só quando falta chegar à referência', () => {
    const { container: abaixo } = render(
      <BarraDeComparacao valor={50} referencia={92.6} rotulo="54 de 100" />,
    )
    expect(screen.getByRole('img', { name: '54 de 100' })).toBeInTheDocument()
    expect(abaixo.querySelector('.hachura')).toHaveStyle({ left: '50%', right: '7.4%' })
    cleanup()
    const { container: acima } = render(
      <BarraDeComparacao valor={92.6} referencia={46.3} rotulo="150 de 75" />,
    )
    expect(acima.querySelector('.hachura')).toBeNull()
  })

  it('pontos por dia: uma coluna por dia do mês, total no rótulo e etiqueta de hoje', () => {
    render(<PontosPorDia dias={dias([0, 3, 6, 4])} diasNoMes={30} />)
    expect(
      screen.getByRole('img', { name: 'Consumo por dia: 13 un. no mês até agora' }),
    ).toBeInTheDocument()
    expect(screen.getByText('hoje · 4 un.')).toBeInTheDocument()
    expect(screen.getByText('Cada ponto vale 1 unidade')).toBeInTheDocument()
    expect(screen.getByTitle('02/11: 3 un.')).toBeInTheDocument()
    expect(screen.getByRole('img').children).toHaveLength(30)
  })

  it('pontos por dia: consumo alto muda o valor do ponto e avisa na legenda', () => {
    render(<PontosPorDia dias={dias([0, 133])} diasNoMes={30} />)
    expect(screen.getByText('Cada ponto vale 20 unidades')).toBeInTheDocument()
  })
})

describe('Componentes-base da versão 2', () => {
  it('a barra de nível hachura o trecho que falta até o alvo', () => {
    const { container } = render(
      <Gauge saldo={10} minimo={5} pontoReposicao={8} alvo={40} status="OK" />,
    )
    expect(container.querySelector('.hachura')).not.toBeNull()
  })

  it('saldo no alvo ou acima dele não tem hachura', () => {
    const { container } = render(
      <Gauge saldo={50} minimo={5} pontoReposicao={8} alvo={40} status="OK" />,
    )
    expect(container.querySelector('.hachura')).toBeNull()
  })

  it('controle segmentado marca a opção ativa com aria-current', () => {
    render(
      <Segmentado
        rotulo="Filtro"
        opcoes={[
          { href: '/a', rotulo: 'Todos', contagem: 6, ativo: true },
          { href: '/b', rotulo: 'Em alerta', contagem: 3, ativo: false },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: /Todos/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Em alerta/ })).not.toHaveAttribute('aria-current')
  })
})
