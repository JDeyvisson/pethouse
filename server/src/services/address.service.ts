import { AppError } from '../middleware/error'

export async function validateCep(cep: string) {
  try {
    const endpoint = process.env.CEP_API_URL ?? 'https://viacep.com.br/ws'
    const response = await fetch(`${endpoint}/${cep}/json/`, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error('CEP provider unavailable')
    const data = await response.json() as { erro?: boolean; localidade?: string }
    if (data.erro) throw new AppError('VALIDATION_ERROR', 'CEP não encontrado', 400, { cep: 'CEP não encontrado. Confira os números.' })
    if (!data.localidade) throw new Error('Invalid CEP response')
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('CEP_UNAVAILABLE', 'Consulta de CEP indisponível. Seus dados foram preservados; tente novamente.', 503)
  }
}
