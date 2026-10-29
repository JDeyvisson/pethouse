import { test, expect, Page, APIRequestContext } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
const { todayBrazil } = createRequire(import.meta.url)('../server/dist/lib/rules.js') as { todayBrazil: () => string }

const api = 'http://127.0.0.1:3301/api'
async function makeAccount(request: APIRequestContext, role = 'TUTOR') {
  const email = `browser-${randomUUID()}@example.test`
  const response = await request.post(api + '/auth/register', { data: { name: 'Pessoa Teste', email, phone: '11999998888', password: 'Teste12345!', role, acceptedTerms: true, termsVersion: '2026-10-28' } })
  expect(response.status()).toBe(201)
  return { ...(await response.json()), email }
}
async function login(page: Page, account: Awaited<ReturnType<typeof makeAccount>>) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(account.email)
  await page.getByLabel('Senha', { exact: true }).fill('Teste12345!')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page).toHaveURL(/\/home$/)
}
async function radio(page: Page, name: string, value: string) {
  await page.locator(`input[type=radio][name="${name}"][value="${value}"]`).check({ force: true })
}
async function assertNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://viacep.com.br/**', route => route.fulfill({ json: route.request().url().includes('12345678') ? { erro: true } : { logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP' } }))
})

test('visitante, termos, telefone e cadastro de tutor', async ({ page }) => {
  await page.goto('/meus-pets')
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.goto('/cadastrar')
  await page.getByLabel('Nome completo', { exact: true }).fill('Pessoa Teste')
  await page.getByLabel('Email', { exact: true }).fill('invalido')
  await page.getByLabel('Telefone', { exact: true }).fill('119999988887777777777777')
  expect((await page.getByLabel('Telefone', { exact: true }).inputValue()).replace(/\D/g, '').length).toBeLessThanOrEqual(11)
  await page.getByLabel('Senha', { exact: true }).fill('Teste12345!')
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Teste12345!')
  const terms = page.getByRole('link', { name: 'Termos de Uso', exact: true })
  const popup = page.waitForEvent('popup')
  await terms.click()
  const legal = await popup
  await expect(legal.getByRole('heading', { name: 'Termos de Uso', exact: true })).toBeVisible()
  await legal.close()
  await expect(page.getByRole('checkbox')).not.toBeChecked()
  await page.getByRole('checkbox').check({ force: true })
  await page.getByRole('button', { name: /Próximo/ }).click()
  await expect(page.getByText('Confira nome, e-mail, telefone, senhas e aceite dos termos.')).toBeVisible()
  await page.getByLabel('Email', { exact: true }).fill(`ui-${randomUUID()}@example.test`)
  await page.getByRole('button', { name: /Próximo/ }).click()
  await page.getByRole('button', { name: 'Pular endereço' }).click()
  await page.getByRole('button', { name: 'Pular e concluir sem cartão' }).click()
  await expect(page).toHaveURL(/\/home$/)
  await assertNoOverflow(page)
})

test('pet: criação, persistência, limite de RG e retorno de erro', async ({ page, request }) => {
  const account = await makeAccount(request)
  await login(page, account)
  await page.goto('/meus-pets/novo')
  await page.getByLabel('Nome do Pet').fill('Thor QA')
  await page.getByLabel('RG do Pet').fill('X'.repeat(60))
  await expect(page.getByLabel('RG do Pet')).toHaveValue('X'.repeat(30))
  await page.getByLabel('Data de Nascimento').fill('2099-01-01')
  await page.locator('#especie').selectOption('Cachorro')
  await page.locator('#raca').fill('SRD')
  await page.locator('#sexo').selectOption('Macho')
  await page.locator('#porte').selectOption('Pequeno (até 10 kg)')
  for (const name of ['vacinasEmDia', 'usaMedicamento', 'restricaoAlimentar', 'jaFugiu', 'medoBarulho', 'ficaSozinho', 'dormeSozinho', 'castrado']) await radio(page, name, 'nao')
  for (const name of ['comportamentoCaes', 'comportamentoGatos', 'comportamentoCriancas']) await radio(page, name, 'sociavel')
  await radio(page, 'nivelEnergia', '3')
  await page.locator('#racaoConsome').fill('Ração teste')
  await page.locator('#nomeContato').fill('Contato QA')
  await page.locator('#telefoneContato').fill('11988887777')
  await page.locator('#parentesco').fill('Amigo')
  await page.getByRole('button', { name: 'Cadastrar pet', exact: true }).click()
  await expect(page.getByText('Informe uma data real, não futura')).toBeVisible()
  await page.getByLabel('Data de Nascimento').fill('2020-02-29')
  await page.route('**/api/pets', async route => {
    if (route.request().method() === 'POST') await route.fulfill({ status: 500, json: { error: { message: 'Falha simulada de QA' } } })
    else await route.continue()
  })
  await page.getByRole('button', { name: 'Cadastrar pet', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Falha simulada de QA' }).first()).toBeVisible()
  await expect(page.getByLabel('Nome do Pet')).toHaveValue('Thor QA')
  await page.unroute('**/api/pets')
  await page.getByRole('button', { name: 'Cadastrar pet', exact: true }).click()
  await expect(page).toHaveURL(/\/meus-pets$/)
  const pets = await request.get(api + '/pets', { headers: { Authorization: `Bearer ${account.token}` } })
  const pet = (await pets.json())[0]
  expect(pet.vaccinesUpToDate).toBe(false)
  expect(pet.neutered).toBe(false)
  await page.goto(`/editar-pet/${pet.id}`)
  await expect(page.getByLabel('Nome do Pet')).toHaveValue('Thor QA')
  await page.getByLabel('RG do Pet').fill('')
  await page.getByLabel('Data de Nascimento').fill('')
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click()
  await expect(page).toHaveURL(/\/meus-pets$/)
  const saved = await request.get(api + `/pets/${pet.id}`, { headers: { Authorization: `Bearer ${account.token}` } })
  expect((await saved.json()).birthDate).toBe(null)
})

test('anfitrião: CPF, CEP, termos, preenchimento e persistência', async ({ page, request }) => {
  const account = await makeAccount(request, 'CUIDADOR')
  await login(page, account)
  await page.goto('/cadastro-anfitriao')
  await page.getByLabel('CEP', { exact: false }).fill('12345678')
  await expect(page.getByText('CEP não encontrado. Confira os números.')).toBeVisible()
  await page.getByLabel('CEP', { exact: false }).fill('01310100')
  await expect(page.getByRole('textbox', { name: /^Cidade/ })).toHaveValue('São Paulo')
  await page.getByRole('textbox', { name: /^Número/ }).fill('1')
  for (const [name, value] of Object.entries({ tipoMoradia: 'casa', tamanhoEspaco: 'medio', capacidadeMaxima: '1', tempoCuidado: 'nunca', quintalFechado: 'nao', outrosAnimais: 'nao', criancas: 'nao', trabalhaFora: 'nao', adminMedicamentos: 'nao', experienciaEspeciais: 'nao', cuidouAntes: 'nao' })) await radio(page, name, value)
  await page.getByText('Pequeno', { exact: true }).last().click()
  await page.getByText('Cachorro', { exact: true }).click()
  await page.getByLabel('CPF', { exact: false }).fill('11111111111')
  for (const checkbox of await page.locator('input[type=checkbox]').all()) {
    const label = await checkbox.locator('..').textContent()
    if (label?.includes('Li e aceito') || label?.includes('Declaro') || label?.includes('Aceito a responsabilidade')) await checkbox.check({ force: true })
  }
  await page.getByRole('button', { name: 'Enviar cadastro' }).click()
  await expect(page.getByText('CPF inválido', { exact: true })).toBeVisible()
  await page.getByLabel('CPF', { exact: false }).fill('52998224725')
  await page.getByRole('button', { name: 'Enviar cadastro' }).click()
  await expect(page).toHaveURL(/\/home$/)
  const result = await request.get(api + '/hosts/me', { headers: { Authorization: `Bearer ${account.token}` } })
  expect(result.status()).toBe(200)
  expect((await result.json()).fencedYard).toBe(false)
})

test('login e páginas legais: acessibilidade e telas estreitas', async ({ page }, info) => {
  for (const path of ['/login', '/cadastrar', '/termos', '/privacidade', '/conta', '/ajuda']) {
    await page.goto(path)
    await assertNoOverflow(page)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => ({ id: v.id, targets: v.nodes.map(n => [n.target, n.failureSummary]) }))).toEqual([])
  }
  await page.goto('/cadastrar')
  await page.screenshot({ path: `docs/qa-evidence/cadastro-${info.project.name}.png`, fullPage: true })
})

test('reserva, assinatura e e-mail demonstrativos; sessão inválida', async ({ page, request }) => {
  const tutor = await makeAccount(request)
  const hostAccount = await makeAccount(request, 'CUIDADOR')
  const day = (n: number) => new Date(Date.parse(todayBrazil()) + n * 86400000).toISOString().slice(0, 10)
  const hostResponse = await request.post(api + '/hosts', { headers: { Authorization: `Bearer ${hostAccount.token}` }, data: {
    cep: '01310100', city: 'São Paulo', street: 'Avenida Paulista', number: '1', housingType: 'casa', spaceSize: 'medio', maxPets: '1',
    acceptedSizes: ['Pequeno'], acceptedSpecies: ['Cachorro'], cpf: '52998224725', fencedYard: false, hasOtherAnimals: false, hasChildren: false,
    worksOutside: false, canAdminMeds: false, specialNeedsExp: false, hasHostedBefore: false, hostingTime: 'nunca', pricePerDay: 100,
    availableDates: [day(1), day(2)], acceptedTerms: true, confirmsAccuracy: true, acceptsResponsibility: true, termsVersion: '2026-10-28',
  } })
  expect(hostResponse.status()).toBe(201)
  const host = await hostResponse.json()
  const petResponse = await request.post(api + '/pets', { headers: { Authorization: `Bearer ${tutor.token}` }, data: {
    name: 'Pet reserva QA', species: 'Cachorro', breed: 'SRD', sex: 'Macho', size: 'Pequeno (até 10 kg)', vaccinesUpToDate: false,
    usesMedication: false, foodRestriction: false, hasEscaped: false, fearOfNoise: false, staysAlone: false, sleepsAlone: false, neutered: false,
    foodBrand: 'Ração teste', behaviorDogs: 'sociavel', behaviorCats: 'sociavel', behaviorKids: 'sociavel', energyLevel: 3,
    emergencyName: 'Contato QA', emergencyPhone: '11988887777', emergencyRelation: 'Amigo',
  } })
  expect(petResponse.status()).toBe(201)
  const pet = await petResponse.json()
  await login(page, tutor)
  await page.goto(`/perfil-sitter/${host.id}`)
  await page.getByRole('button', { name: 'Reservar', exact: true }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Pet', { exact: true }).selectOption(pet.id)
  await dialog.getByLabel('Check-in', { exact: true }).fill(day(1))
  await dialog.getByLabel('Check-out', { exact: true }).fill(day(1))
  await dialog.getByRole('button', { name: 'Confirmar reserva demonstrativa' }).click()
  await expect(dialog.getByRole('alert')).toContainText('1 a 365 noites')
  await dialog.getByLabel('Check-out', { exact: true }).fill(day(3))
  await dialog.getByRole('button', { name: 'Confirmar reserva demonstrativa' }).click()
  await expect(dialog.getByRole('status')).toContainText('Nenhum pagamento foi realizado')
  await dialog.getByRole('button', { name: 'Ver reservas' }).click()
  await expect(page).toHaveURL(/\/reservas$/)
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Ativar demonstração' }).click()
  await expect(page.getByText(/Demonstração ativa até/)).toBeVisible()
  await page.goto('/conta?purpose=verify')
  await page.getByRole('button', { name: 'Gerar e-mail demonstrativo' }).click()
  await page.getByRole('link', { name: 'Abrir prévia do e-mail demonstrativo' }).click()
  await page.getByRole('button', { name: 'Concluir demonstração' }).click()
  await expect(page.getByRole('alert')).toContainText('A posse do e-mail não foi verificada')
  await page.evaluate(() => localStorage.setItem('ph_token', 'expired-token'))
  await page.goto('/perfil')
  await expect(page).toHaveURL(/\/login\?next=/)
})

test('formulários autenticados: acessibilidade, tema escuro e layout', async ({ page, request }, info) => {
  const tutor = await makeAccount(request)
  const host = await makeAccount(request, 'CUIDADOR')
  for (const [account, path] of [[tutor, '/meus-pets/novo'], [host, '/cadastro-anfitriao']] as const) {
    await login(page, account)
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => localStorage.setItem('ph-theme', theme), theme)
      await page.goto(path)
      await assertNoOverflow(page)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => ({ id: v.id, targets: v.nodes.map(n => [n.target, n.failureSummary]) }))).toEqual([])
    }
    await page.screenshot({ path: `docs/qa-evidence/${account.user.role.toLowerCase()}-${info.project.name}.png`, fullPage: true })
  }
})
