import { z } from 'zod'
import { digits, validPhone, validCpf, validBirthDate, validDate } from '../lib/rules'

export const text = (max = 2000) => z.string().trim().max(max, `Máximo de ${max} caracteres`)
export const requiredText = (max = 100) => text(max).min(1, 'Campo obrigatório')
export const booleanField = z.preprocess(v => v === 'true' ? true : v === 'false' ? false : v, z.boolean())
export const phone = text(20).refine(validPhone, 'Informe DDD e telefone com 10 ou 11 dígitos').transform(digits)
export const cpf = text(14).refine(validCpf, 'CPF inválido').transform(digits)
export const cep = text(9).regex(/^\d{5}-?\d{3}$/, 'CEP inválido').refine(v => !/^(\d)\1{7}$/.test(digits(v)), 'CEP inválido').transform(digits)
export const birthDate = z.preprocess(v => v === '' ? null : v, z.string().refine(validBirthDate, 'Informe uma data real, não futura').transform(v => new Date(v + 'T12:00:00Z')).nullable()).optional()
export const dateOnly = z.string().refine(validDate, 'Data inválida')
export function jsonArray<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(v => {
    if (typeof v !== 'string') return v
    try { return JSON.parse(v) } catch { return v }
  }, z.array(schema).max(730))
}
