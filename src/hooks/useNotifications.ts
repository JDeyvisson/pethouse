import { useState, useEffect, useMemo } from 'react'
import { useReservas } from '../context/ReservasContext'
import type { Reserva } from '../data/reservas'

const READ_KEY = 'ph_notifications_read'
const SYNC_EVENT = 'ph:notifications-changed'

export type NotificationType = 'reserva' | 'avaliacao' | 'sistema'
export type NotificationGroup = 'hoje' | 'esta_semana' | 'anteriores'

export interface Notificacao {
  id: string
  type: NotificationType
  group: NotificationGroup
  title: string
  body: string
  time: string
}

function daysDiff(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function relativeTime(days: number): string {
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days === -1) return 'Amanhã'
  if (days < 0) return `Em ${Math.abs(days)} dias`
  return `${days} dias atrás`
}

function buildNotifications(reservas: Reserva[]): Notificacao[] {
  const now = new Date()
  const result: Notificacao[] = []

  for (const r of reservas) {
    const start = new Date(r.startDate)
    const end = new Date(r.endDate)
    const daysToStart = daysDiff(now, start)
    const daysSinceEnd = daysDiff(end, now)

    if (r.status === 'proxima') {
      const group: NotificationGroup =
        daysToStart <= 0 ? 'hoje' : daysToStart <= 7 ? 'esta_semana' : 'anteriores'
      result.push({
        id: `reserva-${r.id}`,
        type: 'reserva',
        group,
        title: 'Reserva confirmada',
        body: `${r.petName} ficará com ${r.sitterName} a partir de ${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}.`,
        time: relativeTime(-daysToStart),
      })
    }

    if (r.status === 'em_andamento') {
      result.push({
        id: `andamento-${r.id}`,
        type: 'reserva',
        group: 'hoje',
        title: 'Hospedagem em andamento',
        body: `${r.petName} está hospedado com ${r.sitterName}.`,
        time: 'Agora',
      })
    }

    if (r.status === 'concluida' && daysSinceEnd <= 30) {
      const group: NotificationGroup =
        daysSinceEnd <= 0 ? 'hoje' : daysSinceEnd <= 7 ? 'esta_semana' : 'anteriores'
      result.push({
        id: `avaliacao-${r.id}`,
        type: 'avaliacao',
        group,
        title: 'Avalie sua hospedagem',
        body: `Como foi a experiência de ${r.petName} com ${r.sitterName}? Deixe sua avaliação!`,
        time: relativeTime(daysSinceEnd),
      })
    }
  }

  return result
}

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[]) }
  catch { return new Set() }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  window.dispatchEvent(new Event(SYNC_EVENT))
}

export function useNotifications() {
  const { reservas, loading } = useReservas()
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds)

  useEffect(() => {
    const sync = () => setReadIds(getReadIds())
    window.addEventListener(SYNC_EVENT, sync)
    return () => window.removeEventListener(SYNC_EVENT, sync)
  }, [])

  const notifications = useMemo(() => buildNotifications(reservas), [reservas])
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev).add(id)
      saveReadIds(next)
      return next
    })
  }

  const markAllRead = () => {
    const next = new Set(notifications.map(n => n.id))
    saveReadIds(next)
    setReadIds(next)
  }

  return { notifications, unreadCount, markRead, markAllRead, loading, readIds }
}
