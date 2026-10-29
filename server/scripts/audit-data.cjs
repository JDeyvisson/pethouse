// Read-only data audit. DATABASE_URL must be supplied explicitly by the operator.
// Does not load .env, change records or print names, email addresses or documents.
if (!process.env.DATABASE_URL) throw new Error('Informe DATABASE_URL explicitamente para o banco autorizado')
const { PrismaClient } = require('@prisma/client')
const { validCpf, validPhone, validBirthDate } = require('../dist/lib/rules')
const prisma = new PrismaClient()
async function main() {
  const [users, hosts, pets, reservas] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true, phone: true, termsAcceptedAt: true } }),
    prisma.hostProfile.findMany({ select: { id: true, cpf: true, docPhotoUrl: true, termsAcceptedAt: true, maxPets: true } }),
    prisma.pet.findMany({ select: { id: true, name: true, rg: true, birthDate: true, createdAt: true } }),
    prisma.reserva.findMany({ select: { id: true, tutorId: true, pet: { select: { ownerId: true } }, price: true, startDate: true, endDate: true } }),
  ])
  const normalizedEmails = new Map()
  for (const user of users) {
    const key = user.email.trim().toLowerCase()
    normalizedEmails.set(key, [...(normalizedEmails.get(key) ?? []), user.id])
  }
  console.log(JSON.stringify({
    mode: 'READ_ONLY',
    usersWithoutAcceptance: users.filter(u => !u.termsAcceptedAt).map(u => u.id),
    invalidPhones: users.filter(u => u.phone && !validPhone(u.phone)).map(u => u.id),
    duplicateEmailGroups: [...normalizedEmails.values()].filter(ids => ids.length > 1),
    hostsWithoutAcceptance: hosts.filter(h => !h.termsAcceptedAt).map(h => h.id),
    invalidCpf: hosts.filter(h => !h.cpf || !validCpf(h.cpf)).map(h => h.id),
    legacyDocuments: hosts.filter(h => h.docPhotoUrl?.startsWith('/uploads/')).map(h => h.id),
    invalidPets: pets.filter(p => !p.name.trim() || p.name.length > 80 || (p.rg?.length ?? 0) > 30 || (p.birthDate && !validBirthDate(p.birthDate.toISOString().slice(0, 10)))).map(p => p.id),
    invalidReservations: reservas.filter(r => r.tutorId !== r.pet.ownerId || r.price <= 0 || r.endDate <= r.startDate).map(r => r.id),
    booleanReconfirmation: 'Não é possível inferir se valores true antigos resultam de respostas reais ou da conversão incorreta de false. Solicite reconfirmação aos responsáveis; não inverta valores automaticamente.',
  }, null, 2))
}
main().catch(() => { console.error('Falha na auditoria; confira acesso e migrações.'); process.exitCode = 1 }).finally(() => prisma.$disconnect())
