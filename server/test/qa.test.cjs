const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:qa_local_only@localhost:55432/pethouse_qa'
if (!new URL(process.env.DATABASE_URL).pathname.endsWith('_qa')) throw new Error('Use apenas banco com sufixo _qa')
process.env.JWT_SECRET = 'qa-only-secret-not-for-production-0123456789'
process.env.MOCK_SERVICES = 'true'
process.env.NODE_ENV = 'test'
const app = require('../dist/app').default
const { prisma } = require('../dist/lib/prisma')
const { petSchema } = require('../dist/schemas/pet.schema')
const { hostSchema } = require('../dist/schemas/host.schema')
const { todayBrazil } = require('../dist/lib/rules')
let server, base, cepServer
before(async () => { cepServer = require('node:http').createServer((req, res) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(req.url.includes('12345678') ? { erro: true } : { localidade: 'São Paulo' })) }); await new Promise(resolve => cepServer.listen(0, resolve)); process.env.CEP_API_URL = `http://localhost:${cepServer.address().port}`; server = await new Promise(resolve => { const s = app.listen(0, () => resolve(s)) }); base = `http://localhost:${server.address().port}/api` })
after(async () => { await new Promise(resolve => server.close(resolve)); await new Promise(resolve => cepServer.close(resolve)); await prisma.$disconnect() })
async function request(path, { method = 'GET', token, body } = {}) {
  const multipart = body instanceof FormData
  const response = await fetch(base + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(!multipart && body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? multipart ? body : JSON.stringify(body) : undefined })
  const data = await response.json().catch(() => null)
  return { status: response.status, data }
}
async function account(role = 'TUTOR') {
  const email = `qa-${randomUUID()}@example.test`
  const r = await request('/auth/register', { method: 'POST', body: { name: 'Pessoa QA', email, password: 'Teste12345!', phone: '11999998888', role, acceptedTerms: true, termsVersion: '2026-10-28' } })
  assert.equal(r.status, 201, JSON.stringify(r.data))
  return { ...r.data, email }
}
const date = n => new Date(Date.parse(todayBrazil()) + n * 86400000).toISOString().slice(0, 10)
const petBody = { name: 'Pet QA', species: 'Cachorro', breed: 'SRD', sex: 'Macho', size: 'Pequeno (até 10 kg)', vaccinesUpToDate: false, usesMedication: false, foodRestriction: false, hasEscaped: false, fearOfNoise: false, staysAlone: true, sleepsAlone: true, neutered: false, behaviorDogs: 'sociavel', behaviorCats: 'indiferente', behaviorKids: 'sociavel', energyLevel: 3, foodBrand: 'Ração de teste', emergencyName: 'Contato QA', emergencyPhone: '11988887777', emergencyRelation: 'Amigo' }
const hostBody = () => ({ cep: '01310100', city: 'São Paulo', street: 'Rua de teste', number: '1', housingType: 'casa', spaceSize: 'medio', maxPets: '1', acceptedSizes: ['Pequeno'], acceptedSpecies: ['Cachorro'], cpf: '52998224725', fencedYard: false, worksOutside: false, canAdminMeds: false, specialNeedsExp: false, hasHostedBefore: false, hostingTime: 'nunca', hasChildren: false, hasOtherAnimals: false, pricePerDay: 125.50, availableDates: [date(1), date(2), date(3)], acceptedTerms: true, confirmsAccuracy: true, acceptsResponsibility: true, termsVersion: '2026-10-28' })
function form(body) { const f = new FormData(); for (const [k, v] of Object.entries(body)) f.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v)); return f }

test('Contratos rejeitam entradas inválidas e preservam false', () => {
  assert.equal(petSchema.parse({ ...petBody, vaccinesUpToDate: 'false' }).vaccinesUpToDate, false)
  for (const bad of [{ name: '   ' }, { rg: 'x'.repeat(31) }, { birthDate: '2099-01-01' }, { birthDate: '2025-02-30' }, { birthDate: 'invalid' }, { usesMedication: 'anything' }, { species: 'inventada' }]) assert.equal(petSchema.safeParse({ ...petBody, ...bad }).success, false, JSON.stringify(bad))
  assert.equal(hostSchema.safeParse({ ...hostBody(), cpf: '11111111111' }).success, false)
  assert.equal(hostSchema.safeParse({ ...hostBody(), acceptedSizes: '[' }).success, false)
  assert.equal(hostSchema.safeParse({ ...hostBody(), acceptedSpecies: [] }).success, false)
})

test('Jornadas integradas de tutor/anfitrião e segurança', async t => {
  const a = await account(), b = await account(), h = await account('CUIDADOR')
  let host, petA, petB, reservation
  await t.test('aceites persistidos e telefone normalizado', async () => {
    const u = await prisma.user.findUnique({ where: { id: a.user.id } })
    assert.equal(u.termsVersion, '2026-10-28'); assert.ok(u.termsAcceptedAt); assert.equal(u.phone, '11999998888')
    const r = await request('/auth/register', { method: 'POST', body: { name: 'QA', email: 'invalid', password: 'Teste12345!', role: 'TUTOR', phone: 'abc' } })
    assert.equal(r.status, 400)
  })
  await t.test('multipart grava false, RG e data; edição limpa opcionais', async () => {
    const r = await request('/pets', { method: 'POST', token: a.token, body: form({ ...petBody, rg: 'REG123', birthDate: '2020-02-29' }) })
    assert.equal(r.status, 201, JSON.stringify(r.data)); petA = r.data
    assert.equal(petA.vaccinesUpToDate, false)
    const updated = await request(`/pets/${petA.id}`, { method: 'PUT', token: a.token, body: form({ rg: '', birthDate: '' }) })
    assert.equal(updated.status, 200); assert.equal(updated.data.birthDate, null); assert.equal(updated.data.rg, '')
    petB = (await request('/pets', { method: 'POST', token: b.token, body: form(petBody) })).data
  })
  await t.test('pet alheio não pode ser editado', async () => {
    assert.equal((await request(`/pets/${petA.id}`, { method: 'PUT', token: b.token, body: { name: 'Alterado' } })).status, 403)
  })
  await t.test('cadastro idempotente de pet e regras condicionais', async () => {
    const requestKey = randomUUID()
    const body = { ...petBody, name: 'Pet idempotente', requestKey }
    const first = await request('/pets', { method: 'POST', token: a.token, body })
    const retry = await request('/pets', { method: 'POST', token: a.token, body })
    assert.equal(first.status, 201); assert.equal(retry.data.id, first.data.id)
    assert.equal((await request('/pets', { method: 'POST', token: a.token, body: { ...body, name: 'Alterado' } })).status, 409)
    assert.equal((await request('/pets', { method: 'POST', token: a.token, body: { ...petBody, usesMedication: true } })).status, 400)
    assert.equal((await request('/pets', { method: 'POST', token: a.token, body: { name: 'Incompleto' } })).status, 400)
  })
  await t.test('CEP inexistente é recusado no servidor', async () => {
    const result = await request('/hosts', { method: 'POST', token: h.token, body: { ...hostBody(), cep: '12345678' } })
    assert.equal(result.status, 400)
    assert.equal(result.data.error.fields.cep, 'CEP não encontrado. Confira os números.')
  })
  await t.test('upload privado persiste e não vaza na listagem', async () => {
    const body = form(hostBody())
    body.append('docPhoto', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'doc.png')
    const r = await request('/hosts', { method: 'POST', token: h.token, body })
    assert.equal(r.status, 201, JSON.stringify(r.data)); host = r.data
    assert.equal(host.fencedYard, false); assert.ok(host.docPhotoUrl.startsWith('/private-documents/'))
    const publicHost = await request(`/hosts/${host.id}`)
    assert.equal(publicHost.status, 200)
    for (const key of ['cpf', 'docPhotoUrl', 'street', 'number', 'termsAcceptedAt']) assert.equal(key in publicHost.data, false, key)
    assert.equal('email' in publicHost.data.user, false)
    const url = base.replace('/api', '') + host.docPhotoUrl
    assert.equal((await fetch(url)).status, 401)
    assert.equal((await fetch(url, { headers: { Authorization: `Bearer ${a.token}` } })).status, 403)
    assert.equal((await fetch(url, { headers: { Authorization: `Bearer ${h.token}` } })).status, 200)
  })
  await t.test('JSON quebrado e upload inválido geram 400', async () => {
    assert.equal((await request('/hosts/me', { method: 'PUT', token: h.token, body: { acceptedSizes: '[' } })).status, 400)
    const f = new FormData(); f.append('photo', new Blob(['fake'], { type: 'image/png' }), 'fake.png')
    assert.equal((await request('/pets', { method: 'POST', token: a.token, body: f })).status, 400)
    const large = new FormData(); large.append('photo', new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'image/png' }), 'large.png')
    const oversized = await request('/pets', { method: 'POST', token: a.token, body: large })
    assert.equal(oversized.status, 400); assert.equal(oversized.data.error.code, 'LIMIT_FILE_SIZE')
  })
  const booking = (petId, extra = {}) => ({ petId, hostId: host.id, startDate: date(1) + 'T12:00:00.000Z', endDate: date(3) + 'T12:00:00.000Z', price: 0.01, ...extra })
  await t.test('reserva exige papel e propriedade; datas indisponíveis recusadas', async () => {
    assert.equal((await request('/reservas', { method: 'POST', token: h.token, body: booking(petA.id) })).status, 403)
    assert.equal((await request('/reservas', { method: 'POST', token: b.token, body: booking(petA.id) })).status, 403)
    assert.equal((await request('/reservas', { method: 'POST', token: a.token, body: booking(petA.id, { endDate: date(6) + 'T12:00:00.000Z' }) })).status, 409)
  })
  await t.test('duas solicitações para última vaga: apenas uma vence; preço do servidor', async () => {
    const results = await Promise.all([request('/reservas', { method: 'POST', token: a.token, body: booking(petA.id) }), request('/reservas', { method: 'POST', token: b.token, body: booking(petB.id) })])
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409])
    reservation = results.find(r => r.status === 201).data
    assert.equal(reservation.price, 251)
  })
  await t.test('edição do anfitrião preserva noites já reservadas', async () => {
    const result = await request('/hosts/me', { method: 'PUT', token: h.token, body: { availableDates: [] } })
    assert.equal(result.status, 409)
  })
  await t.test('início antecipado é recusado; cancelamento libera vaga', async () => {
    assert.equal((await request(`/reservas/${reservation.id}/start`, { method: 'PATCH', token: h.token })).status, 400)
    const owner = reservation.tutorId === a.user.id ? a : b
    assert.equal((await request(`/reservas/${reservation.id}/cancel`, { method: 'PATCH', token: owner.token })).status, 200)
  })
  await t.test('idempotência retorna uma reserva e impede alteração de payload', async () => {
    const idempotencyKey = randomUUID()
    const first = await request('/reservas', { method: 'POST', token: a.token, body: booking(petA.id, { idempotencyKey }) })
    const second = await request('/reservas', { method: 'POST', token: a.token, body: booking(petA.id, { idempotencyKey }) })
    assert.equal(first.status, 201); assert.equal(first.data.id, second.data.id)
    assert.equal((await request('/reservas', { method: 'POST', token: a.token, body: booking(petB.id, { idempotencyKey }) })).status, 409)
    reservation = first.data
  })
  await t.test('reservas do tutor não retornam documento nem CPF do host', async () => {
    const result = await request('/reservas', { token: a.token })
    assert.equal(result.status, 200)
    for (const r of result.data) { assert.equal('cpf' in r.host, false); assert.equal('docPhotoUrl' in r.host, false) }
  })
  await t.test('mensagens validam tipo, limite e participante', async () => {
    assert.equal((await request('/messages', { method: 'POST', token: a.token, body: { reservaId: reservation.id, text: {} } })).status, 400)
    assert.equal((await request('/messages', { method: 'POST', token: a.token, body: { reservaId: reservation.id, text: 'a'.repeat(2001) } })).status, 400)
    assert.equal((await request(`/messages/${reservation.id}`, { token: b.token })).status, 403)
    assert.equal((await request('/messages', { method: 'POST', token: a.token, body: { reservaId: reservation.id, text: 'Olá anfitrião' } })).status, 201)
  })
  await t.test('paginação de mensagens não repete nem perde a fronteira', async () => {
    const sameTimestamp = new Date()
    await prisma.message.createMany({ data: Array.from({ length: 105 }, (_, i) => ({ reservaId: reservation.id, senderId: a.user.id, text: 'QA ' + i, createdAt: sameTimestamp })) })
    const recent = await request(`/messages/${reservation.id}`, { token: a.token })
    assert.equal(recent.data.length, 100)
    const older = await request(`/messages/${reservation.id}?before=${recent.data[0].id}`, { token: a.token })
    assert.equal(older.data.length, 6)
    assert.equal(new Set([...older.data, ...recent.data].map(m => m.id)).size, 106)
  })
  await t.test('avaliação só aceita reserva concluída e host correto', async () => {
    assert.equal((await request('/reviews', { method: 'POST', token: a.token, body: { hostId: host.id, rating: 5, comment: 'Teste' } })).status, 400)
    assert.equal((await request('/reviews', { method: 'POST', token: a.token, body: { hostId: host.id, reservaId: reservation.id, rating: 5, comment: 'Teste' } })).status, 400)
    await prisma.reserva.update({ where: { id: reservation.id }, data: { status: 'CONCLUIDA' } })
    assert.equal((await request('/reviews', { method: 'POST', token: a.token, body: { hostId: 'outro', reservaId: reservation.id, rating: 5, comment: 'Teste' } })).status, 403)
    const body = { hostId: host.id, reservaId: reservation.id, rating: 5, comment: 'Teste' }
    assert.equal((await request('/reviews', { method: 'POST', token: a.token, body })).status, 201)
    assert.equal((await request('/reviews', { method: 'POST', token: a.token, body })).status, 409)
  })
  await t.test('PATCH de nome mantém telefone; cartão inválido é rejeitado', async () => {
    const r = await request('/users/me', { method: 'PATCH', token: a.token, body: { name: 'Novo nome' } })
    assert.equal(r.status, 200); assert.equal(r.data.phone, '11999998888')
    assert.equal((await request('/payment-cards', { method: 'POST', token: a.token, body: { brand: 'Visa', last4: 'abcd', expiry: '99/20' } })).status, 400)
  })
  await t.test('assinatura mock explícita; produção não ativa mock', async () => {
    const r = await request('/subscriptions/subscribe', { method: 'POST', token: a.token })
    assert.equal(r.status, 200); assert.equal(r.data.mock, true)
    process.env.NODE_ENV = 'production'
    assert.equal((await request('/subscriptions/subscribe', { method: 'POST', token: b.token })).status, 503)
    process.env.NODE_ENV = 'test'
  })
  await t.test('e-mail mock, token de uso único e revogação de sessão', async () => {
    const r = await request('/auth/request-email', { method: 'POST', body: { email: a.email, purpose: 'reset' } })
    assert.equal(r.status, 200); assert.equal(r.data.mock, true)
    const token = new URL('http://qa' + r.data.previewPath).searchParams.get('token')
    const body = { token, password: 'NovaSenha123!' }
    assert.equal((await request('/auth/consume-email', { method: 'POST', body })).status, 200)
    assert.equal((await request('/auth/consume-email', { method: 'POST', body })).status, 400)
    assert.equal((await request('/users/me', { token: a.token })).status, 401)
    assert.equal((await request('/auth/login', { method: 'POST', body: { email: a.email.toUpperCase(), password: 'NovaSenha123!' } })).status, 200)
  })
})
