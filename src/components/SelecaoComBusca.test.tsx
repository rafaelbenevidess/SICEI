// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { SelecaoComBusca, type OpcaoComBusca } from './formulario'

afterEach(cleanup)

const FORNECEDORES: OpcaoComBusca[] = [
  {
    valor: 'f1',
    rotulo: 'Metalcorte',
    detalhe: '11.222.333/0001-81',
    busca: ['11222333000181', 'Metalcorte Ferramentas Ltda'],
  },
  {
    valor: 'f2',
    rotulo: 'Usinagem Paulista',
    detalhe: '45.678.901/0001-23',
    busca: ['45678901000123', 'Usinagem Paulista Comércio Ltda'],
  },
]

const POSICOES: OpcaoComBusca[] = [
  { valor: 'p1', rotulo: 'A01-G03-C04' },
  { valor: 'p2', rotulo: 'A02-G01-C01' },
]

function Formulario(props: Partial<Parameters<typeof SelecaoComBusca>[0]>) {
  return (
    <form aria-label="teste">
      <SelecaoComBusca nome="fornecedorId" rotulo="Fornecedor" opcoes={FORNECEDORES} {...props} />
      <button type="reset">Limpar</button>
    </form>
  )
}

const enviado = () =>
  new FormData(screen.getByRole('form', { name: 'teste' }) as HTMLFormElement).get('fornecedorId')

describe('RF-11 · Campo de escolha com busca', () => {
  it('filtra enquanto digita e mostra o CNPJ embaixo do nome', async () => {
    render(<Formulario />)
    const campo = screen.getByRole('combobox', { name: 'Fornecedor' })
    await userEvent.type(campo, 'metal')
    const opcoes = screen.getAllByRole('option')
    expect(opcoes).toHaveLength(1)
    expect(opcoes[0]).toHaveTextContent('Metalcorte')
    expect(opcoes[0]).toHaveTextContent('11.222.333/0001-81')
  })

  it('o CNPJ digitado só com números acha o fornecedor, e Enter escolhe', async () => {
    render(<Formulario />)
    const campo = screen.getByRole('combobox', { name: 'Fornecedor' })
    await userEvent.type(campo, '45678901{Enter}')
    expect(campo).toHaveValue('Usinagem Paulista')
    expect(enviado()).toBe('f2')
  })

  it('setas escolhem sem o mouse', async () => {
    render(<Formulario />)
    const campo = screen.getByRole('combobox', { name: 'Fornecedor' })
    await userEvent.click(campo)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(enviado()).toBe('f2')
  })

  it('clicar na opção escolhe e fecha a lista', async () => {
    render(<Formulario />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Fornecedor' }))
    await userEvent.click(screen.getByRole('option', { name: /Metalcorte/ }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(enviado()).toBe('f1')
  })

  it('ao sair do campo, o texto que reconhece uma opção só vira a escolha', async () => {
    render(<Formulario opcoes={POSICOES} rotulo="Posição" nome="fornecedorId" />)
    const campo = screen.getByRole('combobox', { name: 'Posição' })
    await userEvent.type(campo, 'a1g3c4')
    await userEvent.tab()
    expect(campo).toHaveValue('A01-G03-C04')
    expect(enviado()).toBe('p1')
  })

  it('texto que não acha nada avisa e, ao sair, volta para a escolha anterior', async () => {
    render(<Formulario padrao="f1" />)
    const campo = screen.getByRole('combobox', { name: 'Fornecedor' })
    await userEvent.clear(campo)
    await userEvent.type(campo, 'zzz')
    expect(screen.getByText('Nada com “zzz”.')).toBeInTheDocument()
    await userEvent.tab()
    expect(campo).toHaveValue('Metalcorte')
    expect(enviado()).toBe('f1')
  })

  it('a opção vazia deixa o campo sem valor de propósito', async () => {
    render(
      <Formulario opcoes={POSICOES} rotulo="Posição" padrao="p1" opcaoVazia="Retirar da posição" />,
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'Posição' }))
    await userEvent.click(screen.getByRole('option', { name: 'Retirar da posição' }))
    expect(screen.getByRole('combobox', { name: 'Posição' })).toHaveValue('Retirar da posição')
    expect(enviado()).toBe('')
  })

  it('limpar o formulário volta para a escolha inicial', async () => {
    render(<Formulario />)
    const campo = screen.getByRole('combobox', { name: 'Fornecedor' })
    await userEvent.type(campo, 'metal{Enter}')
    expect(enviado()).toBe('f1')
    await userEvent.click(screen.getByRole('button', { name: 'Limpar' }))
    expect(campo).toHaveValue('')
    expect(enviado()).toBe('')
  })
})
