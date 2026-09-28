// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { SelecaoMultipla, type OpcaoComBusca } from './formulario'

afterEach(cleanup)

const ITENS: OpcaoComBusca[] = [
  { valor: 'PST-001', rotulo: 'PST-001', detalhe: 'Pastilha CNMG 120408', busca: ['CNMG'] },
  { valor: 'PST-002', rotulo: 'PST-002', detalhe: 'Pastilha WNMG 080408', busca: ['WNMG'] },
  { valor: 'PST-004', rotulo: 'PST-004', detalhe: 'Pastilha APMT 1604', busca: ['APMT'] },
]

function Formulario(props: Partial<Parameters<typeof SelecaoMultipla>[0]>) {
  return (
    <form aria-label="Filtros">
      <SelecaoMultipla nome="itens" rotulo="Itens" opcoes={ITENS} {...props} />
      <button type="reset">Limpar</button>
    </form>
  )
}

const enviado = () =>
  (document.querySelector('input[type=hidden][name=itens]') as HTMLInputElement).value

describe('RF-17a · Escolha de vários itens com busca', () => {
  it('"pst1" acha o PST-001; clicar marca, e a lista continua aberta para marcar outro', async () => {
    const u = userEvent.setup()
    render(<Formulario />)
    await u.type(screen.getByRole('combobox', { name: 'Itens' }), 'pst1')
    await u.click(screen.getByRole('option', { name: /PST-001/ }))
    expect(enviado()).toBe('PST-001')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /PST-001/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('busca pela descrição ("apmt") e Enter marca; envia na ordem da escolha', async () => {
    const u = userEvent.setup()
    render(<Formulario padrao={['PST-002']} />)
    await u.type(screen.getByRole('combobox'), 'apmt{Enter}')
    expect(enviado()).toBe('PST-002,PST-004')
  })

  it('o "×" da etiqueta tira o escolhido', async () => {
    const u = userEvent.setup()
    render(<Formulario padrao={['PST-001', 'PST-004']} />)
    await u.click(screen.getByRole('button', { name: 'Tirar PST-001' }))
    expect(enviado()).toBe('PST-004')
  })

  it('Backspace com o campo vazio tira o último escolhido', async () => {
    const u = userEvent.setup()
    render(<Formulario padrao={['PST-001', 'PST-004']} />)
    await u.click(screen.getByRole('combobox'))
    await u.keyboard('{Backspace}')
    expect(enviado()).toBe('PST-001')
  })

  it('clicar de novo numa opção marcada desmarca', async () => {
    const u = userEvent.setup()
    render(<Formulario padrao={['PST-001']} />)
    await u.click(screen.getByRole('combobox'))
    await u.click(screen.getByRole('option', { name: /PST-001/ }))
    expect(enviado()).toBe('')
  })

  it('no limite, as outras opções ficam indisponíveis e o aviso explica', async () => {
    const u = userEvent.setup()
    render(<Formulario padrao={['PST-001']} limite={1} />)
    await u.click(screen.getByRole('combobox'))
    expect(screen.getByText(/Limite de 1 escolhidos/)).toBeInTheDocument()
    await u.click(screen.getByRole('option', { name: /PST-002/ }))
    expect(enviado()).toBe('PST-001')
  })

  it('sem escolhidos, o campo diz que vale para todos', () => {
    render(<Formulario placeholder="Todos os itens" />)
    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Todos os itens')
    expect(screen.getByRole('combobox')).toHaveAccessibleDescription(/vale todos os itens/)
  })

  it('limpar o formulário volta aos escolhidos iniciais', async () => {
    const u = userEvent.setup()
    render(<Formulario padrao={['PST-001']} />)
    await u.click(screen.getByRole('button', { name: 'Tirar PST-001' }))
    await u.click(screen.getByRole('button', { name: 'Limpar' }))
    expect(enviado()).toBe('PST-001')
  })
})
