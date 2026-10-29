export { TERMS_VERSION, digits, formatPhone, validPhone, validCpf, validEmail, validBirthDate, todayBrazil } from '../../server/src/lib/rules'

export async function lookupCep(value: string, signal?: AbortSignal) {
  const digits = value.replace(/\D/g, '')
  if (!/^\d{8}$/.test(digits) || /^(\d)\1{7}$/.test(digits)) throw new Error('CEP inválido')
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal })
  if (!response.ok) throw new Error('Consulta de CEP indisponível. Tente novamente.')
  const data = await response.json()
  if (data.erro) throw new Error('CEP não encontrado. Confira os números.')
  return data as { logradouro: string; bairro: string; localidade: string; uf: string }
}
