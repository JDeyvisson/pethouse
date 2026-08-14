import { z } from 'zod'

export const hostSchema = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  city: z.string().min(1, 'Cidade obrigatória'),
  street: z.string().min(1, 'Logradouro obrigatório'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),

  housingType: z.enum(['casa', 'apartamento', 'chacara', 'outro']),
  fencedYard: z.coerce.boolean().optional(),
  spaceSize: z.enum(['pequeno', 'medio', 'grande']),
  spaceDesc: z.string().optional(),

  hasOtherAnimals: z.coerce.boolean().optional(),
  otherAnimalsDesc: z.string().optional(),
  hasChildren: z.coerce.boolean().optional(),
  childrenAge: z.string().optional(),
  worksOutside: z.coerce.boolean().optional(),
  maxPets: z.enum(['1', '2', '3', '4+']),
  acceptedSizes: z.preprocess(
    v => (typeof v === 'string' ? JSON.parse(v) : v),
    z.array(z.string()),
  ),
  acceptedSpecies: z.preprocess(
    v => (typeof v === 'string' ? JSON.parse(v) : v),
    z.array(z.string()),
  ),
  canAdminMeds: z.coerce.boolean().optional(),
  specialNeedsExp: z.coerce.boolean().optional(),

  hasHostedBefore: z.coerce.boolean().optional(),
  hostingTime: z.enum(['nunca', 'menos1', '1a3', 'mais3']).optional(),
  experiencedBreeds: z.string().optional(),
  bio: z.string().optional(),

  cpf: z.string().optional(),
  pricePerDay: z.coerce.number().positive().optional(),
  availableDates: z.preprocess(
    v => (typeof v === 'string' ? JSON.parse(v) : v),
    z.array(z.string()),
  ).optional(),
})

export type HostInput = z.infer<typeof hostSchema>
