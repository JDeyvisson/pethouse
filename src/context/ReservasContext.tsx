import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'
import type { ReservaStatus, Reserva } from '../data/reservas'

interface ApiReserva {
  id: string
  status: 'PROXIMA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  startDate: string
  endDate: string
  price: number
  service: string
  pet: { id: string; name: string; photoUrl?: string | null }
  host?: { id: string; user: { name: string } }
  tutor?: { id: string; name: string }
}

function mapStatus(s: ApiReserva['status']): ReservaStatus {
  return s.toLowerCase() as ReservaStatus
}

function apiToReserva(r: ApiReserva): Reserva {
  return {
    id: r.id,
    sitterName: r.host?.user.name ?? '',
    sitterPhoto: '',
    petName: r.pet.name,
    service: r.service ?? 'Hospedagem',
    startDate: r.startDate.slice(0, 10),
    endDate: r.endDate.slice(0, 10),
    status: mapStatus(r.status),
    price: r.price,
    hostId: r.host?.id,
    tutorName: r.tutor?.name,
  }
}

interface ReservasContextValue {
  reservas: Reserva[]
  loading: boolean
  addReserva: (r: Reserva) => void
  cancelReserva: (id: string) => Promise<void>
  startReserva: (id: string) => Promise<void>
  concludeReserva: (id: string) => Promise<void>
  refresh: () => void
}

const ReservasContext = createContext<ReservasContextValue | null>(null)

export function ReservasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user) {
      setReservas([])
      setLoading(false)
      return
    }
    setLoading(true)
    api.get<ApiReserva[]>('/reservas')
      .then(data => setReservas(data.map(apiToReserva)))
      .catch(() => setReservas([]))
      .finally(() => setLoading(false))
  }, [tick, user?.id])

  const addReserva = (r: Reserva) => setReservas(prev => [r, ...prev])

  const cancelReserva = async (id: string) => {
    await api.patch(`/reservas/${id}/cancel`)
    setReservas(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'cancelada' as const } : r))
    )
  }

  const startReserva = async (id: string) => {
    await api.patch(`/reservas/${id}/start`)
    setReservas(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'em_andamento' as const } : r))
    )
  }

  const concludeReserva = async (id: string) => {
    await api.patch(`/reservas/${id}/conclude`)
    setReservas(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'concluida' as const } : r))
    )
  }

  const refresh = () => setTick(t => t + 1)

  return (
    <ReservasContext.Provider value={{ reservas, loading, addReserva, cancelReserva, startReserva, concludeReserva, refresh }}>
      {children}
    </ReservasContext.Provider>
  )
}

export function useReservas() {
  const ctx = useContext(ReservasContext)
  if (!ctx) throw new Error('useReservas must be used within ReservasProvider')
  return ctx
}
