import { expect, test, type Page } from '@playwright/test'
import { SENHA_INICIAL_ADMIN } from './preparar'

const SENHA_ADMIN = 'AdminE2E-2026!'

async function entrar(page: Page, login: string, senha: string) {
  await page.goto('/login')
  await page.getByLabel(/^Login/).fill(login)
  await page.getByLabel(/^Senha/).fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

async function trocarSenha(page: Page, atual: string, nova: string) {
  await page.waitForURL('**/trocar-senha')
  await page.getByLabel(/^Senha atual/).fill(atual)
  await page.getByLabel(/^Nova senha/).fill(nova)
  await page.getByLabel(/^Repita a nova senha/).fill(nova)
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
}

test.describe.configure({ mode: 'serial' })

test('RF-01: primeiro acesso exige troca de senha; senha fraca é recusada', async ({ page }) => {
  await entrar(page, 'admin', 'errada-errada')
  await expect(page.locator('form [role=alert]')).toHaveText('Login ou senha inválidos.')
  await entrar(page, 'admin', SENHA_INICIAL_ADMIN)
  await page.waitForURL('**/trocar-senha')
  await page.goto('/painel') // não dá para fugir da troca
  await page.waitForURL('**/trocar-senha')
  await trocarSenha(page, SENHA_INICIAL_ADMIN, 'curta')
  await expect(page.locator('form [role=alert]')).toContainText('pelo menos 10 caracteres')
  await page.getByLabel(/^Nova senha/).fill(SENHA_ADMIN)
  await page.getByLabel(/^Repita a nova senha/).fill(SENHA_ADMIN)
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await page.waitForURL('**/painel')
  await expect(page.getByRole('heading', { name: 'Painel' })).toBeVisible()
})

test('RF-16 / RNF-02: painel no celular sem rolagem horizontal', async ({ page }) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await expect(page.getByRole('heading', { name: 'Alertas abertos' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test('RF-08 / RF-09: saída acima do saldo é recusada, saída válida baixa o saldo e o estorno devolve', async ({
  page,
}) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  // o QR da gaveta leva direto ao item (RN-26)
  await page.goto('/p/A01-G01-C02')
  await expect(page.getByRole('heading', { name: /PST-002/ })).toBeVisible()
  const form = page.locator('form[aria-label="Saída para a produção"]')
  await form.getByLabel(/^Quantidade/).fill('9999')
  await form.getByLabel(/^Destino/).selectOption({ index: 1 })
  await form.getByLabel(/^Quem retirou/).selectOption({ index: 1 })
  await form.getByLabel(/^Ordem de produção/).fill('OP-E2E-1')
  await form.getByRole('button', { name: /Registrar saída/ }).click()
  await expect(form.locator('[role=alert]')).toContainText('Saldo disponível:')
  await form.getByLabel(/^Quantidade/).fill('2')
  await form.getByRole('button', { name: /Registrar saída/ }).click()
  await expect(page.getByText(/Consumo da produção de 2 registrada/)).toBeVisible()

  await page.goto('/movimentacoes?op=OP-E2E-1')
  await page.locator('tbody a').first().click()
  await page.getByLabel(/^Justificativa do estorno/).fill('Lançamento de teste ponta a ponta')
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Estornar movimentação' }).click()
  await expect(page.getByText(/Estornada em/)).toBeVisible()
})

test('RF-02 / RN-21: Admin cria usuário; login gerado; perfil Consulta não vê preços nem registra saída', async ({
  page,
  browser,
}) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await page.goto('/admin/usuarios')
  const form = page.locator('form[aria-label="Novo usuário"]')
  await form.getByLabel(/^Nome/).fill('Pedro')
  await form.getByLabel(/^Sobrenome/).fill('da Consulta')
  await form.getByLabel(/^Setor/).fill('Usinagem')
  await form.getByLabel(/^Perfil/).selectOption('CONSULTA')
  await form.getByRole('button', { name: 'Criar usuário e gerar senha' }).click()
  await expect(form.getByText('Login:')).toContainText('pedro.consulta')
  const senha = (await form.locator('code').nth(1).innerText()).trim()
  expect(senha).toHaveLength(12)

  const outra = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await entrar(outra, 'pedro.consulta', senha)
  await trocarSenha(outra, senha, 'PedroConsulta2026')
  await outra.waitForURL('**/painel')
  await outra.goto('/p/A01-G01-C02')
  await expect(outra.getByText('O seu perfil não vê preços.')).toBeVisible()
  await expect(outra.getByText(/último preço/)).toHaveCount(0)
  await expect(outra.getByRole('heading', { name: 'Registrar movimentação' })).toHaveCount(0)
  await outra.goto('/admin/usuarios')
  await outra.waitForURL('**/sem-permissao')
  await outra.close()
})

test('RF-21: verificação de integridade confere o log, as movimentações e os saldos', async ({
  page,
}) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await page.goto('/admin/auditoria')
  await page.getByRole('button', { name: 'Verificar agora' }).click()
  await expect(page.getByText(/Cadeia íntegra: \d+ registros conferidos/)).toBeVisible()
  await expect(page.getByText('Todas as movimentações batem com o log.')).toBeVisible()
  await expect(page.getByText('Nenhuma divergência de saldo.')).toBeVisible()
})

test('RF-20: relatório de reposição exporta CSV', async ({ page }) => {
  await entrar(page, 'admin', SENHA_ADMIN)
  await page.waitForURL('**/painel')
  await page.goto('/relatorios?tipo=reposicao')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Exportar CSV' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^simi-reposicao-\d{4}-\d{2}-\d{2}\.csv$/)
})

test('RNF-13: laboratório público roda todos os casos no navegador', async ({ page }) => {
  await page.goto('/testes')
  await page.getByRole('button', { name: 'Executar todos' }).click()
  await expect(page.getByText(/(\d+) de \1 passaram/)).toBeVisible()
})

test('Rotina diária recusa chamada sem o segredo e aceita com ele', async ({ request }) => {
  expect((await request.get('/api/cron/diario')).status()).toBe(401)
  const ok = await request.get('/api/cron/diario', {
    headers: { Authorization: 'Bearer e2e-segredo' },
  })
  expect(ok.status()).toBe(200)
  expect(await ok.json()).toMatchObject({ itens: 6 })
})

test('Cabeçalhos de segurança presentes', async ({ request }) => {
  const r = await request.get('/login')
  expect(r.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(r.headers()['x-frame-options']).toBe('DENY')
  expect(r.headers()['x-content-type-options']).toBe('nosniff')
  expect(r.headers()['x-powered-by']).toBeUndefined()
})
