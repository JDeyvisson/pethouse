import { z } from 'zod'
import { requiredText, text, phone, cep } from './common'
import { TERMS_VERSION } from '../lib/rules'
export const registerSchema = z.object({
  name: requiredText(100).min(2, 'Informe pelo menos 2 caracteres'),
  email: z.string().trim().toLowerCase().max(254).email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(72, 'Máximo de 72 caracteres'),
  role: z.enum(['TUTOR', 'CUIDADOR']), phone,
  acceptedTerms: z.literal(true, { error: 'Aceite os termos para continuar' }),
  termsVersion: z.literal(TERMS_VERSION),
  cep: cep.optional(), street: text(200).optional(), addressNum: text(20).optional(),
  complement: text(100).optional(), neighborhood: text(100).optional(), city: text(100).optional(),
  state: z.string().regex(/^[A-Z]{2}$/, 'UF inválida').optional(),
})
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória').max(72),
})
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
