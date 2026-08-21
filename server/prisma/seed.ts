import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('senha123', 10)

  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@pethouse.dev' },
    update: {},
    create: {
      name: 'Marina Costa',
      email: 'tutor@pethouse.dev',
      password: passwordHash,
      role: 'TUTOR',
      phone: '(11) 99999-1234',
    },
  })

  const anfitriao = await prisma.user.upsert({
    where: { email: 'anfitriao@pethouse.dev' },
    update: {},
    create: {
      name: 'Clara Martins',
      email: 'anfitriao@pethouse.dev',
      password: passwordHash,
      role: 'CUIDADOR',
      phone: '(11) 98888-5678',
    },
  })

  const hostProfile = await prisma.hostProfile.upsert({
    where: { userId: anfitriao.id },
    update: {},
    create: {
      userId: anfitriao.id,
      cep: '01310-100',
      city: 'São Paulo',
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Apto 42',
      housingType: 'apartamento',
      fencedYard: false,
      spaceSize: 'medio',
      spaceDesc: 'Apartamento amplo com varanda e espaço pet-friendly',
      hasOtherAnimals: false,
      hasChildren: false,
      worksOutside: true,
      maxPets: '2',
      acceptedSizes: ['pequeno', 'medio'],
      acceptedSpecies: ['cachorro', 'gato'],
      canAdminMeds: true,
      specialNeedsExp: false,
      hasHostedBefore: true,
      hostingTime: '1a3',
      bio: 'Amante de animais com 2 anos de experiência em hospedagem pet.',
      spacePhotos: [],
      housePhotos: [],
      averageRating: 4.8,
      reviewCount: 24,
    },
  })

  const pet1 = await prisma.pet.upsert({
    where: { id: 'pet-seed-1' },
    update: {},
    create: {
      id: 'pet-seed-1',
      name: 'Thor',
      species: 'cao',
      breed: 'Golden Retriever',
      sex: 'macho',
      size: 'grande',
      ownerId: tutor.id,
      vaccinesUpToDate: true,
      energyLevel: 4,
    },
  })

  const pet2 = await prisma.pet.upsert({
    where: { id: 'pet-seed-2' },
    update: {},
    create: {
      id: 'pet-seed-2',
      name: 'Luna',
      species: 'gato',
      breed: 'Siamês',
      sex: 'femea',
      size: 'pequeno',
      ownerId: tutor.id,
      vaccinesUpToDate: true,
      energyLevel: 3,
    },
  })

  await prisma.reserva.upsert({
    where: { id: 'reserva-seed-1' },
    update: {},
    create: {
      id: 'reserva-seed-1',
      status: 'PROXIMA',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      price: 150,
      petId: pet1.id,
      tutorId: tutor.id,
      hostId: hostProfile.id,
    },
  })

  await prisma.reserva.upsert({
    where: { id: 'reserva-seed-2' },
    update: {},
    create: {
      id: 'reserva-seed-2',
      status: 'CONCLUIDA',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
      price: 120,
      petId: pet2.id,
      tutorId: tutor.id,
      hostId: hostProfile.id,
    },
  })

  // Reviews de exemplo para o anfitrião
  await prisma.review.upsert({
    where: { id: 'review-seed-1' } as never,
    update: {},
    create: {
      id: 'review-seed-1',
      rating: 5,
      comment: 'Clara foi incrível com o Thor! Cuidado impecável, atualizações frequentes e muito carinho.',
      tutorId: tutor.id,
      hostId: hostProfile.id,
      reservaId: 'reserva-seed-2',
    },
  } as never)

  await prisma.review.upsert({
    where: { id: 'review-seed-2' } as never,
    update: {},
    create: {
      id: 'review-seed-2',
      rating: 5,
      comment: 'Espaço limpo e acolhedor. Meu pet voltou feliz e descansado. Super recomendo!',
      tutorId: tutor.id,
      hostId: hostProfile.id,
    },
  } as never)

  await prisma.review.upsert({
    where: { id: 'review-seed-3' } as never,
    update: {},
    create: {
      id: 'review-seed-3',
      rating: 4,
      comment: 'Ótima experiência. A Clara é muito atenciosa e o ambiente é seguro para os pets.',
      tutorId: tutor.id,
      hostId: hostProfile.id,
    },
  } as never)

  // Atualizar stats do anfitrião com base nas reviews reais
  const agg = await prisma.review.aggregate({ where: { hostId: hostProfile.id }, _avg: { rating: true }, _count: { id: true } })
  await prisma.hostProfile.update({ where: { id: hostProfile.id }, data: { averageRating: agg._avg.rating ?? 4.8, reviewCount: agg._count.id } })

  console.log('Seed concluído:', { tutor: tutor.email, anfitriao: anfitriao.email })
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
