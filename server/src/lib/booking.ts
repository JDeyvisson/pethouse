import { AppError } from '../middleware/error'
import { todayBrazil } from './rules'

export function bookingDays(start: Date, end: Date): string[] {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start)
    throw new AppError('INVALID_DATES', 'O check-out deve ser posterior ao check-in')
  const first = start.toISOString().slice(0, 10)
  const last = end.toISOString().slice(0, 10)
  const nights = (Date.parse(last) - Date.parse(first)) / 86400000
  if (first < todayBrazil() || nights < 1 || nights > 365)
    throw new AppError('INVALID_DATES', 'Escolha de 1 a 365 noites a partir de hoje')
  return Array.from({ length: nights }, (_, i) => new Date(Date.parse(first) + i * 86400000).toISOString().slice(0, 10))
}
