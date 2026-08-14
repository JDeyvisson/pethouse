import { z } from 'zod'

const yesNo = z.enum(['sim', 'nao'])
const behavior = z.enum(['muito_sociavel', 'sociavel', 'indiferente', 'agressivo']).optional()

export const petSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  species: z.string().min(1, 'Espécie obrigatória'),
  breed: z.string().min(1, 'Raça obrigatória'),
  sex: z.string().min(1, 'Sexo obrigatório'),
  size: z.string().min(1, 'Porte obrigatório'),
  rg: z.string().optional(),
  birthDate: z.string().optional().transform(s => s ? new Date(s + 'T12:00:00.000Z') : undefined),

  vaccinesUpToDate: z.coerce.boolean().optional(),
  usesMedication: z.coerce.boolean().optional(),
  medicationDesc: z.string().optional(),
  healthCondition: z.string().optional(),
  foodRestriction: z.coerce.boolean().optional(),
  foodRestDesc: z.string().optional(),
  foodBrand: z.string().optional(),

  behaviorDogs: behavior,
  behaviorCats: behavior,
  behaviorKids: behavior,
  energyLevel: z.coerce.number().min(1).max(5).optional(),
  hasEscaped: z.coerce.boolean().optional(),
  escapeDesc: z.string().optional(),
  fearOfNoise: z.coerce.boolean().optional(),
  staysAlone: z.coerce.boolean().optional(),
  sleepsAlone: z.coerce.boolean().optional(),
  neutered: z.coerce.boolean().optional(),
  behaviorNotes: z.string().optional(),

  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  vetClinic: z.string().optional(),
  vetPhone: z.string().optional(),
  vetAddress: z.string().optional(),
})

export type PetInput = z.infer<typeof petSchema>
