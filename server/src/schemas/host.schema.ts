import { text, requiredText, cpf, cep, dateOnly, jsonArray, booleanField } from './common'
import { z } from 'zod'

export const hostSchema = z.object({
  cep,
  city: requiredText(),
  street: requiredText(200),
  number: requiredText(20),
  complement: text().optional(),

  housingType: z.enum(['casa', 'apartamento', 'chacara', 'outro']),
  fencedYard: booleanField,
  spaceSize: z.enum(['pequeno', 'medio', 'grande']),
  spaceDesc: text().optional(),

  hasOtherAnimals: booleanField,
  otherAnimalsDesc: text().optional(),
  hasChildren: booleanField,
  childrenAge: text().optional(),
  worksOutside: booleanField,
  maxPets: z.enum(['1', '2', '3', '4+']),
  acceptedSizes: jsonArray(z.enum(['Pequeno', 'Médio', 'Grande', 'Gigante'])).refine(a => a.length > 0, 'Selecione pelo menos um porte'),
  acceptedSpecies: jsonArray(z.enum(['Cachorro', 'Gato', 'Pássaro', 'Ave', 'Coelho', 'Réptil', 'Roedor', 'Outro'])).refine(a => a.length > 0, 'Selecione pelo menos uma espécie'),
  canAdminMeds: booleanField,
  specialNeedsExp: booleanField,

  hasHostedBefore: booleanField,
  hostingTime: z.enum(['nunca', 'menos1', '1a3', 'mais3']),
  experiencedBreeds: text().optional(),
  bio: text().optional(),

  cpf,
  pricePerDay: z.coerce.number().positive().max(100000),
  availableDates: jsonArray(dateOnly).optional(),
  acceptedTerms: booleanField.refine(v => v, 'Aceite os termos'),
  confirmsAccuracy: booleanField.refine(v => v, 'Confirme a veracidade dos dados'),
  acceptsResponsibility: booleanField.refine(v => v, 'Aceite a responsabilidade'),
  termsVersion: z.literal('2026-10-28'),

})

export type HostInput = z.infer<typeof hostSchema>
