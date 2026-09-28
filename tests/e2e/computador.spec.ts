import { expect, test } from '@playwright/test'
import { cnpjAleatorio, entrarComoAdmin } from './apoio'

// Roda depois da suíte do celular (dependência no playwright.config.ts): o Admin já trocou
// a senha provisória lá.
test.describe.configure({ mode: 'serial' })

test('Tema escuro fica guardado ao navegar e ao recarregar', async ({ page }) => {
  await entrarComoAdmin(page)
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'claro')
  await page.getByRole('button', { name: 'Usar tema escuro' }).click()
  await expect(html).toHaveAttribute('data-theme', 'escuro')
  await page.goto('/itens')
  await expect(html).toHaveAttribute('data-theme', 'escuro')
  await page.getByRole('button', { name: 'Usar tema claro' }).click()
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'claro')
})

test('RF-07 / RN-05: compra com fornecedor cadastrado na hora, sem sair da tela', async ({
  page,
}) => {
  await entrarComoAdmin(page)
  await page.goto('/p/A01-G01-C01')
  await page.getByRole('main').getByRole('link', { name: 'Entrada', exact: true }).click()
  const form = page.locator('form[aria-label="Registrar entrada"]')
  await form.locator('input[name=quantidade]').fill('2')
  await expect(form.getByText(/2 caixas × \d+ = \d+ unidades/)).toBeVisible()

  await form.getByRole('button', { name: 'Fornecedor não está na lista?' }).click()
  const novo = form.getByRole('region', { name: 'Cadastrar fornecedor' })
  await novo.getByLabel(/Razão social/).fill('Fornecedor Ponta a Ponta Ltda')
  await novo.getByLabel(/^CNPJ/).fill('11.111.111/1111-11')
  await expect(novo.getByText('Dígito verificador inválido.')).toBeVisible()
  await novo.getByLabel(/^CNPJ/).fill(cnpjAleatorio())
  await expect(novo.getByText('CNPJ válido.')).toBeVisible()
  await novo.getByRole('button', { name: 'Salvar e vincular' }).click()
  await expect(novo).toHaveCount(0)
  await expect(form.getByRole('combobox', { name: 'Fornecedor' })).toHaveValue(
    'Fornecedor Ponta a Ponta Ltda',
  )

  await form.locator('input[name=precoUnitario]').fill('12,50')
  await form.locator('input[name=notaFiscal]').fill('NF-E2E-1')
  await form.getByRole('button', { name: /Confirmar entrada de \d+ un\./ }).click()
  await expect(page.getByRole('status', { name: 'Entrada registrada' })).toBeVisible()
})

test('RF-03: novo item com o próximo código e fabricante e fornecedor cadastrados na hora', async ({
  page,
}) => {
  await entrarComoAdmin(page)
  await page.goto('/cadastros')
  await expect(page.getByRole('table', { name: 'Itens' })).toBeVisible()
  await page.getByRole('link', { name: 'Cadastrar item' }).click()
  const codigo = page.locator('input[name=codigo]')
  await expect(codigo).toHaveValue('PST-007')
  await codigo.fill('PST-001')
  await expect(page.getByText('PST-001 já está em uso.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cadastrar item' })).toBeDisabled()
  await codigo.fill('PST-007')

  await page.locator('input[name=descricao]').fill('Pastilha criada no teste ponta a ponta')
  await page.locator('select[name=aplicacao]').selectOption('TORNEAMENTO')
  await page.locator('input[name=estoqueMinimo]').fill('4')
  await page.getByRole('button', { name: 'Fabricante não está na lista?' }).click()
  const fabricante = page.getByRole('region', { name: 'Cadastrar fabricante' })
  await fabricante.getByLabel(/Nome do fabricante/).fill('Walter E2E')
  await fabricante.getByRole('button', { name: 'Salvar e usar' }).click()
  await expect(page.getByRole('combobox', { name: 'Fabricante' })).toHaveValue('Walter E2E')

  await page.getByRole('button', { name: 'Fornecedor não está na lista?' }).click()
  const fornecedor = page.getByRole('region', { name: 'Cadastrar fornecedor' })
  await fornecedor.getByLabel(/Razão social/).fill('Distribuidora E2E Ltda')
  await fornecedor.getByLabel(/^CNPJ/).fill(cnpjAleatorio())
  await fornecedor.getByRole('button', { name: 'Salvar e usar' }).click()
  await expect(page.getByRole('combobox', { name: 'Fornecedor' })).toHaveValue(
    'Distribuidora E2E Ltda',
  )
  await page.getByRole('button', { name: 'Cadastrar item' }).click()
  await expect(page.getByRole('heading', { name: /PST-007/ })).toBeVisible()
})

test('RN-26: item em posição nova avisa da etiqueta até ela ser impressa', async ({ page }) => {
  await entrarComoAdmin(page)
  await page.goto('/cadastros')
  await page.getByRole('link', { name: 'PST-007' }).click()
  await page.getByText('Posição no almoxarifado').click()
  // RN-25 / RF-11: a posição digitada sem zeros e sem traços é reconhecida ao sair do campo
  const posicao = page.getByRole('combobox', { name: /^Posição/ })
  await posicao.fill('a4g2c1')
  await expect(page.getByRole('option', { name: /A04-G02-C01/ })).toBeVisible()
  await posicao.blur()
  await expect(posicao).toHaveValue('A04-G02-C01')
  await page.getByRole('button', { name: 'Salvar posição' }).click()
  const aviso = page.getByText('Etiqueta QR desta posição ainda não impressa')
  await expect(aviso).toBeVisible()

  await page.getByRole('link', { name: 'Imprimir etiqueta' }).click()
  await page.waitForURL(/etiquetas\?codigos=A04-G02-C01/)
  await page.getByRole('button', { name: 'Imprimir 1 etiqueta' }).click()
  await expect(page.getByText('Etiqueta de A04-G02-C01 registrada como impressa.')).toBeVisible()
  await page.goto('/p/A04-G02-C01')
  await expect(page.getByRole('heading', { name: /PST-007/ })).toBeVisible()
  await expect(aviso).toHaveCount(0)

  // RF-21: a impressão fica no log e o filtro de ação acha pelo nome
  await page.goto('/admin/auditoria')
  await page
    .getByRole('combobox', { name: 'Ação', exact: true })
    .selectOption({ label: 'Etiqueta QR impressa' })
  await page.waitForURL(/acao=ETIQUETA_IMPRESSA/)
  await expect(page.locator('tbody tr').first()).toContainText('A04-G02-C01 (PST-007)')
})

test('RF-08 / RF-11: registrar saída acha o item digitado de qualquer jeito, com autocompletar', async ({
  page,
}) => {
  await entrarComoAdmin(page)
  await page.goto('/movimentacoes/nova?modo=saida')
  const busca = page.getByRole('combobox', { name: 'Buscar item' })
  await busca.fill('pst')
  await expect(page.getByRole('option')).not.toHaveCount(0)
  await busca.fill('Pst 2')
  await expect(page.getByRole('option')).toHaveCount(1)
  await expect(page.getByText(/Código reconhecido/)).toBeVisible()
  await busca.press('Enter')
  await expect(page.locator('form[aria-label="Registrar saída"]')).toContainText('PST-002')

  // a busca da lista de itens usa a mesma regra
  await page.goto('/itens?q=a01g01c02')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody tr')).toContainText('PST-002')

  // a busca do topo sugere enquanto digita e abre o item
  const topo = page.getByRole('combobox', { name: 'Buscar itens' })
  await topo.fill('pst2')
  await page.getByRole('option', { name: /PST-002/ }).click()
  await expect(page.getByRole('heading', { name: /PST-002/ })).toBeVisible()

  // o filtro das movimentações acha a OP digitada sem traços (criada na suíte do celular)
  await page.goto('/movimentacoes?busca=ope2e1')
  await expect(page.locator('tbody tr').first()).toContainText('PST-002')
})

test('RF-26: parâmetros avisam o limite e a mudança vai para as últimas alterações', async ({
  page,
}) => {
  await entrarComoAdmin(page)
  await page.goto('/admin/parametros')
  const janela = page.locator('input[name=janelaConsumoDias]')
  const salvar = page.getByRole('button', { name: 'Salvar parâmetros' })
  await janela.fill('400')
  await expect(page.getByText('A janela precisa ficar entre 1 e 365 dias.')).toBeVisible()
  await expect(salvar).toBeDisabled()
  await janela.fill('60')
  await expect(page.getByText(/Alterações não salvas/)).toBeVisible()
  await salvar.click()
  await expect(page.getByText(/Salvo em .* por admin\./)).toBeVisible()
  await page.reload()
  const historico = page.getByRole('region', { name: 'Últimas alterações' })
  await expect(historico).toContainText('Janela do consumo médio')
  await expect(historico).toContainText('90 → 60')

  // volta ao padrão para não mudar os cálculos de quem vier depois
  await janela.fill('90')
  await salvar.click()
  await expect(page.getByText(/Salvo em .* por admin\./)).toBeVisible()
})

test('RF-21: o log mostra o antes → depois da mudança de parâmetro', async ({ page }) => {
  await entrarComoAdmin(page)
  await page.goto('/admin/auditoria?acao=PARAMETROS_ALTERADOS')
  const linha = page.locator('tbody tr').first()
  await expect(linha).toContainText('PARAMETROS_ALTERADOS')
  await expect(linha.locator('del')).toContainText('janelaConsumoDias: 60')
  await expect(linha.locator('ins')).toContainText('janelaConsumoDias: 90')
})

test('RF-25: a prévia aponta a linha com erro e só importa o arquivo corrigido', async ({
  page,
}) => {
  await entrarComoAdmin(page)
  await page.goto('/admin/importacao')
  const cabecalho =
    'codigo;descricao;iso;classe;cobertura;aplicacao;fabricante;embalagem;estoque_minimo;estoque_maximo;fornecedor_cnpj;lead_time_dias;posicao;saldo_inicial'
  const boa =
    'E2E-IMP-1;Pastilha importada;TNMG 160404;P15;CVD;TORNEAMENTO;Sandvik;10;4;;11.222.333/0001-81;5;;12'
  const ruim = 'E2E-IMP-2;Pastilha com erro;;;;FRESAMENTO;Iscar;10;2;;99.999.999/0001-99;;;5'
  const arquivo = (nome: string, linhas: string[]) => ({
    name: nome,
    mimeType: 'text/csv',
    buffer: Buffer.from([cabecalho, ...linhas].join('\n')),
  })

  await page.getByLabel('Arquivo CSV').setInputFiles(arquivo('planilha.csv', [boa, ruim]))
  const previa = page.getByRole('table', { name: 'Prévia da importação' })
  await expect(previa).toBeVisible()
  await expect(page.getByText(/1 com erro/)).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Corrija' })).toContainText('Linha 3')
  await expect(page.getByRole('button', { name: 'Importar 1 item' })).toBeDisabled()

  await page.getByLabel('Arquivo CSV').setInputFiles(arquivo('corrigida.csv', [boa]))
  await expect(page.getByText(/0 com erro/)).toBeVisible()
  await page.getByRole('button', { name: 'Importar 1 item' }).click()
  await expect(page.getByText('1 item importado')).toBeVisible()
  await page.getByRole('link', { name: 'Ver itens' }).click()
  await expect(page.getByText('E2E-IMP-1')).toBeVisible()
})

test('RF-20 / RN-23: itens e movimentações exportam CSV', async ({ page }) => {
  await entrarComoAdmin(page)
  for (const [caminho, nome] of [
    ['/itens', /^sicei-itens-\d{4}-\d{2}-\d{2}\.csv$/],
    ['/movimentacoes', /^sicei-movimentacoes-\d{4}-\d{2}-\d{2}\.csv$/],
  ] as const) {
    await page.goto(caminho)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Exportar CSV' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(nome)
  }
})

test('RF-17a: Análise no menu, com itens escolhidos lado a lado, foco pelo clique e CSV', async ({
  page,
}) => {
  await entrarComoAdmin(page)
  // o endereço antigo da aba de Relatórios leva à página nova
  await page.goto('/relatorios?tipo=analise')
  await expect(page).toHaveURL(/\/analise/)
  await page.goto('/painel')
  await page.getByRole('link', { name: 'Análise', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Análise' })).toBeVisible()

  // escolhe dois itens digitando de qualquer jeito e aplica
  const itens = page.getByRole('combobox', { name: 'Itens', exact: true })
  await itens.fill('pst1')
  await page.getByRole('option', { name: /PST-001/ }).click()
  await itens.fill('apmt')
  await page.getByRole('option', { name: /PST-004/ }).click()
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page).toHaveURL(/itens=PST-001%2CPST-004/)
  await expect(page.getByText('Filtros: Itens: PST-001, PST-004.')).toBeVisible()

  // um traço por item e o ranking só com os dois
  await expect(page.getByRole('region', { name: 'Evolução, lado a lado' })).toBeVisible()
  const ranking = page.getByRole('region', { name: 'Por item', exact: true })
  await expect(ranking.getByRole('button')).toHaveCount(2)
  await ranking.getByRole('button', { name: /PST-004/ }).click()
  await expect(page.getByRole('status')).toContainText('Em foco: PST-004')
  await page.getByRole('button', { name: 'Tirar o foco' }).click()
  await expect(page.getByRole('status')).toHaveCount(0)

  // comparar por colaborador mantém o filtro de itens
  await page.getByText('Colaborador', { exact: true }).first().click()
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('region', { name: 'Por colaborador', exact: true })).toBeVisible()
  await expect(page.getByText('Filtros: Itens: PST-001, PST-004.')).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Exportar CSV' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^sicei-analise-\d{4}-\d{2}-\d{2}\.csv$/)
})

test('RNF-02: telas principais sem rolagem horizontal em 1366 px', async ({ page }) => {
  await entrarComoAdmin(page)
  for (const caminho of [
    '/painel',
    '/itens',
    '/alertas',
    '/movimentacoes',
    '/relatorios',
    '/cadastros',
    '/cadastros?aba=fornecedores',
    '/cadastros?aba=posicoes',
    '/relatorios?tipo=reposicao',
    '/analise',
    '/admin/usuarios',
    '/admin/auditoria',
  ]) {
    await page.goto(caminho)
    const largura = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(largura, caminho).toBeLessThanOrEqual(1366)
    // nenhuma tabela rola de lado quando o conteúdo cabe na tela
    const tabelasComRolagem = await page.evaluate(() =>
      [...document.querySelectorAll('.overflow-x-auto')]
        .filter((e) => (e as HTMLElement).offsetParent && e.scrollWidth > e.clientWidth + 1)
        .map((e) => e.querySelector('table')?.getAttribute('aria-label')),
    )
    expect(tabelasComRolagem, caminho).toEqual([])
  }
})
