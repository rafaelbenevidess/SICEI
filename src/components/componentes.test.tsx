// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BotaoEnviar, Campo, CampoSenha, DadosDaAcao, FormAcao, Selecao } from './formulario'
import { Marca } from './Marca'
import { Paginacao } from './Paginacao'
import { Rodape } from './Rodape'
import { temLogo } from './licenciadas/LogoDaLicenciada'
import { TelaDeAcesso } from './TelaDeAcesso'
import { Aviso, BadgeStatus, rotulosDoNivel, Vazio } from './ui'

afterEach(cleanup)

describe('RNF-10 · Status não depende só da cor', () => {
  it.each([
    ['OK', 'OK'],
    ['ATENCAO', 'Atenção'],
    ['CRITICO', 'Crítico'],
    ['ZERADO', 'Zerado'],
  ])('%s aparece escrito como "%s"', (status, texto) => {
    render(<BadgeStatus status={status} />)
    expect(screen.getByText(texto)).toBeInTheDocument()
  })
})

describe('Componentes de apoio', () => {
  it('Aviso de erro usa role=alert e os demais role=status', () => {
    render(
      <>
        <Aviso tipo="erro">falhou</Aviso>
        <Aviso tipo="ok">deu certo</Aviso>
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('falhou')
    expect(screen.getByRole('status')).toHaveTextContent('deu certo')
  })
  it('Vazio mostra a mensagem', () => {
    render(<Vazio>Nenhum item.</Vazio>)
    expect(screen.getByText('Nenhum item.')).toBeInTheDocument()
  })
  it('Paginação mantém os filtros e some quando há uma página só', () => {
    const { rerender } = render(
      <Paginacao
        pagina={2}
        paginas={3}
        caminho="/movimentacoes"
        filtros={{ item: 'PST-001', tipo: undefined }}
      />,
    )
    expect(screen.getByRole('link', { name: '← Anterior' })).toHaveAttribute(
      'href',
      '/movimentacoes?item=PST-001&pagina=1',
    )
    expect(screen.getByRole('link', { name: 'Próxima →' })).toHaveAttribute(
      'href',
      '/movimentacoes?item=PST-001&pagina=3',
    )
    rerender(<Paginacao pagina={1} paginas={1} caminho="/x" filtros={{}} />)
    expect(screen.queryByRole('navigation')).toBeNull()
  })
})

describe('Formulários ligados a Server Actions', () => {
  it('mostra o erro geral e o erro do campo, com aria-invalid, e mantém o que foi digitado', async () => {
    const user = userEvent.setup()
    const acao = async () => ({
      ok: false,
      erro: 'Confira os campos destacados.',
      erros: { quantidade: 'Saldo disponível: 3' },
      instante: 1,
    })
    render(
      <FormAcao acao={acao} rotulo="Saída">
        <Campo nome="quantidade" rotulo="Quantidade" obrigatorio />
        <Selecao
          nome="destinoId"
          rotulo="Destino"
          opcoes={[{ valor: 'd1', rotulo: 'CNC 03' }]}
          vazio="Escolha…"
        />
        <BotaoEnviar>Registrar</BotaoEnviar>
      </FormAcao>,
    )
    const campo = screen.getByLabelText(/Quantidade/)
    await user.type(campo, '5')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Confira os campos destacados.')
    expect(screen.getByText('Saldo disponível: 3')).toBeInTheDocument()
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveValue('5')
  })

  it('com senha provisória, mostra os dados devolvidos sem toast e limpa o formulário', async () => {
    const user = userEvent.setup()
    const acao = async () => ({
      ok: true,
      mensagem: 'Usuário criado.',
      dados: { login: 'ana.santos', senha: 'Ab3xYz9Kq2Mn' },
      instante: 2,
    })
    render(
      <FormAcao acao={acao} limparAoConcluir rotulo="Novo usuário">
        <Campo nome="nome" rotulo="Nome" />
        <BotaoEnviar>Criar</BotaoEnviar>
        <DadosDaAcao render={(d) => <p>login gerado: {d.login}</p>} />
      </FormAcao>,
    )
    await user.type(screen.getByLabelText('Nome'), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Criar' }))
    expect(await screen.findByText('login gerado: ana.santos')).toBeInTheDocument()
    expect(screen.queryByText('Usuário criado.')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('')
  })

  it('sucesso sem senha: mostra o toast com a mensagem', async () => {
    const user = userEvent.setup()
    const acao = async () => ({ ok: true, mensagem: 'Saída registrada.', instante: 3 })
    render(
      <FormAcao acao={acao} rotulo="Saída">
        <BotaoEnviar>Registrar</BotaoEnviar>
      </FormAcao>,
    )
    await user.click(screen.getByRole('button', { name: 'Registrar' }))
    expect(await screen.findByText('Saída registrada.')).toBeInTheDocument()
  })

  it('dois formulários com o mesmo campo não repetem o id (acessibilidade)', () => {
    const acao = async () => ({})
    render(
      <>
        <FormAcao acao={acao}>
          <Campo nome="quantidade" rotulo="Quantidade A" />
        </FormAcao>
        <FormAcao acao={acao}>
          <Campo nome="quantidade" rotulo="Quantidade B" />
        </FormAcao>
      </>,
    )
    expect(screen.getByLabelText('Quantidade A').id).not.toBe(
      screen.getByLabelText('Quantidade B').id,
    )
  })
})

describe('Marca · Ícone em vetor e nome em texto', () => {
  it('o nome SICEI é texto (não imagem) e a licenciada aparece embaixo', () => {
    const { container } = render(<Marca licenciada="DDA Metalúrgica" />)
    expect(screen.getByText('SICEI')).toBeInTheDocument()
    expect(screen.getByText('DDA Metalúrgica')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    // o ícone é SVG decorativo: leitor de tela lê só o nome
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
  it('a licenciada aparece em maiúsculas, encaixada na altura do ícone', () => {
    render(<Marca licenciada="DDA Usinagem Industrial" />)
    const nome = screen.getByText('DDA Usinagem Industrial')
    expect(nome).toHaveClass('uppercase')
    expect(nome.parentElement).toHaveClass('h-9')
  })
  it('sem licenciada, só o nome', () => {
    render(<Marca />)
    expect(screen.getByText('SICEI')).toBeInTheDocument()
    expect(screen.queryByText('DDA Metalúrgica')).not.toBeInTheDocument()
  })
})

describe('Login · Logo da licenciada', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('no login da DDA, a logo aparece acima do formulário e no painel', () => {
    vi.stubEnv('SICEI_LICENCIADA', 'DDA Metalúrgica')
    const { container } = render(<TelaDeAcesso comLogoDaLicenciada>formulário</TelaDeAcesso>)
    // acima do formulário, com nome para o leitor de tela; no painel, decorativa
    expect(screen.getByRole('img', { name: 'DDA Metalúrgica' })).toBeInTheDocument()
    expect(container.querySelectorAll('svg text')).toHaveLength(2)
    expect(container.querySelector('img')).toBeNull()
  })

  it('nas outras telas de acesso (troca de senha, acesso negado) a logo não aparece', () => {
    vi.stubEnv('SICEI_LICENCIADA', 'DDA Metalúrgica')
    render(<TelaDeAcesso>formulário</TelaDeAcesso>)
    expect(screen.queryByText('Usinagem Industrial')).not.toBeInTheDocument()
  })

  it.each([
    ['DDA Usinagem Industrial', true],
    ['DDA Metalúrgica', true],
    ['dda metalurgica', true],
    ['Metalúrgica Exemplo', false],
    [null, false],
  ])('licenciada %j tem logo: %s', (nome, esperado) => {
    expect(temLogo(nome)).toBe(esperado)
  })

  it('empresa sem logo cadastrada: login só com a marca do SICEI', () => {
    vi.stubEnv('SICEI_LICENCIADA', 'Metalúrgica Exemplo')
    render(<TelaDeAcesso comLogoDaLicenciada>formulário</TelaDeAcesso>)
    expect(screen.queryByText('Usinagem Industrial')).not.toBeInTheDocument()
    expect(screen.getAllByText('SICEI').length).toBeGreaterThan(0)
  })
})

describe('Rodapé · Titular do SICEI e cliente licenciada', () => {
  it('mostra o titular, a licenciada e o contato comercial com link de e-mail', () => {
    render(<Rodape anoAtual={2026} licenciada="DDA Metalúrgica" />)
    expect(screen.getByText(/SICEI © 2026 Benevides Soluções Industriais/)).toBeInTheDocument()
    expect(screen.getByText(/Licenciado para DDA Metalúrgica/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'comercial@sicei.exemplo.com.br' })).toHaveAttribute(
      'href',
      'mailto:comercial@sicei.exemplo.com.br',
    )
  })

  it('sem licenciada configurada, não mostra "Licenciado para"', () => {
    render(<Rodape anoAtual={2026} licenciada={null} />)
    expect(screen.queryByText(/Licenciado para/)).not.toBeInTheDocument()
    expect(screen.getByText(/Contato comercial/)).toBeInTheDocument()
  })
})

describe('Barra de nível · Rótulos sem sobreposição', () => {
  it('marcadores longe ficam centralizados; perto, cada um vai para um lado', () => {
    const r = rotulosDoNivel([
      { pos: 15, nome: 'mínimo' },
      { pos: 17, nome: 'reposição' },
      { pos: 80, nome: 'alvo' },
    ])
    expect(r.map((m) => m.ancora)).toEqual(['fim', 'inicio', 'meio'])
  })

  it('marcadores a 10–25% de distância: o segundo desce para a linha de baixo', () => {
    const r = rotulosDoNivel([
      { pos: 43, nome: 'mínimo' },
      { pos: 46, nome: 'reposição' },
      { pos: 64, nome: 'alvo' },
    ])
    expect(r.map((m) => m.linha)).toEqual([0, 0, 1])
  })

  it('marcadores longe uns dos outros ficam todos na mesma linha', () => {
    const r = rotulosDoNivel([
      { pos: 10, nome: 'mínimo' },
      { pos: 40, nome: 'reposição' },
      { pos: 80, nome: 'alvo' },
    ])
    expect(r.map((m) => m.linha)).toEqual([0, 0, 0])
  })

  it('nas pontas o rótulo encosta para dentro da barra', () => {
    const r = rotulosDoNivel([
      { pos: 2, nome: 'mínimo' },
      { pos: 50, nome: 'reposição' },
      { pos: 98, nome: 'alvo' },
    ])
    expect(r.map((m) => m.ancora)).toEqual(['inicio', 'meio', 'fim'])
  })
})

describe('RN-21 · Campo de senha', () => {
  it('começa escondido; o botão mostra e esconde de novo', async () => {
    const user = userEvent.setup()
    render(
      <FormAcao acao={async () => ({})}>
        <CampoSenha nome="senha" rotulo="Senha" />
      </FormAcao>,
    )
    const campo = screen.getByLabelText('Senha')
    expect(campo).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar a senha' }))
    expect(campo).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Esconder a senha' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Esconder a senha' }))
    expect(campo).toHaveAttribute('type', 'password')
  })
})
