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
  await expect(form.locator('select[name=fornecedorId] option:checked')).toHaveText(
    'Fornecedor Ponta a Ponta Ltda',
  )

  await form.locator('input[name=precoUnitario]').fill('12,50')
  await form.locator('input[name=notaFiscal]').fill('NF-E2E-1')
  await form.getByRole('button', { name: /Confirmar entrada de \d+ un\./ }).click()
  await expect(page.getByRole('status', { name: 'Entrada registrada' })).toBeVisible()
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
  await page.goto('/admin/auditoria?acao=PARAMETROS')
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

test('RNF-02: telas principais sem rolagem horizontal em 1366 px', async ({ page }) => {
  await entrarComoAdmin(page)
  for (const caminho of [
    '/painel',
    '/itens',
    '/alertas',
    '/movimentacoes',
    '/relatorios',
    '/cadastros',
    '/admin/usuarios',
    '/admin/auditoria',
  ]) {
    await page.goto(caminho)
    const largura = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(largura, caminho).toBeLessThanOrEqual(1366)
  }
})
