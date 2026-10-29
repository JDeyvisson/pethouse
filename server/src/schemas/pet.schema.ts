import { text, requiredText, phone, birthDate, booleanField } from './common'
import { z } from 'zod'

const behavior = z.enum(['muito_sociavel', 'sociavel', 'indiferente', 'agressivo'])

export const petSchema = z.object({
  requestKey: z.string().uuid().optional(),
  name: requiredText(80),
  species: z.enum(['Cachorro', 'Gato', 'Coelho', 'Ave', 'Réptil', 'Roedor', 'Outro']),
  breed: requiredText(100),
  sex: z.enum(['Macho', 'Fêmea', 'Indeterminado']),
  size: z.enum(['Pequeno (até 10 kg)', 'Médio (10–25 kg)', 'Grande (25–45 kg)', 'Gigante (acima de 45 kg)']),
  rg: text(30).optional(),
  birthDate,

  vaccinesUpToDate: booleanField,
  usesMedication: booleanField,
  medicationDesc: text().optional(),
  healthCondition: text().optional(),
  foodRestriction: booleanField,
  foodRestDesc: text().optional(),
  foodBrand: requiredText(200),

  behaviorDogs: behavior,
  behaviorCats: behavior,
  behaviorKids: behavior,
  energyLevel: z.coerce.number().int().min(1).max(5),
  hasEscaped: booleanField,
  escapeDesc: text().optional(),
  fearOfNoise: booleanField,
  staysAlone: booleanField,
  sleepsAlone: booleanField,
  neutered: booleanField,
  behaviorNotes: text().optional(),

  emergencyName: requiredText(100),
  emergencyPhone: phone,
  emergencyRelation: requiredText(100),
  vetClinic: text().optional(),
  vetPhone: z.union([phone, z.literal('')]).optional(),
  vetAddress: text().optional(),
})

export type PetInput = z.infer<typeof petSchema>
