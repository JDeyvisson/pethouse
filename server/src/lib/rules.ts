// Pure rules shared by the API and browser. No platform-specific dependencies.
export const TERMS_VERSION = '2026-10-28'
export const digits = (value: string) => value.replace(/\D/g, '')
export const validPhone = (value: string) => /^[1-9]{2}\d{8,9}$/.test(digits(value)) && /^[\d\s()+-]+$/.test(value)
export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 254
export function validCpf(value: string): boolean {
  if (!/^[\d.\s-]+$/.test(value)) return false
  const d = digits(value)
  if (!/^\d{11}$/.test(d) || /^(\d)\1{10}$/.test(d)) return false
  return [9, 10].every(n => {
    const sum = [...d.slice(0, n)].reduce((s, v, i) => s + Number(v) * (n + 1 - i), 0)
    const check = (sum * 10) % 11
    return Number(d[n]) === (check === 10 ? 0 : check)
  })
}
export function todayBrazil(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  return ['year', 'month', 'day'].map(k => parts.find(p => p.type === k)!.value).join('-')
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return false
  const date = new Date(value + 'T12:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export const validBirthDate = (value: string) => validDate(value) && value <= todayBrazil()
export function formatPhone(value: string): string {
  const d = digits(value).slice(0, 11)
  if (d.length <= 2) return d
  const split = d.length > 10 ? 7 : 6
  return `(${d.slice(0, 2)}) ${d.slice(2, split)}${d.length > split ? '-' + d.slice(split) : ''}`
}
export const normalizeOption = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(' (')[0].replace('passaro', 'ave')
