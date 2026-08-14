import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Calendar, ChevronRight, CalendarClock, Loader2, CheckCircle2,
  XCircle, Star, X, MapPin, PawPrint, DollarSign, AlertTriangle,
} from 'lucide-react'
import { type ReservaStatus, type Reserva } from '../data/reservas'
import { useReservas } from '../context/ReservasContext'
import Pill from '../components/Pill'

const statusConfig: Record<ReservaStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  proxima:      { label: 'Próxima',       icon: CalendarClock, color: 'text-blue-400 bg-blue-400/10' },
  em_andamento: { label: 'Em andamento',  icon: Loader2,       color: 'text-yellow-400 bg-yellow-400/10' },
  concluida:    { label: 'Concluída',     icon: CheckCircle2,  color: 'text-primary bg-primary/10' },
  cancelada:    { label: 'Cancelada',     icon: XCircle,       color: 'text-red-400 bg-red-400/10' },
}

const tabs: { key: ReservaStatus | 'todas'; label: string }[] = [
  { key: 'todas',        label: 'Todas' },
  { key: 'proxima',      label: 'Próximas' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluida',    label: 'Concluídas' },
  { key: 'cancelada',    label: 'Canceladas' },
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function nightsBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(ms / 86400000))
}

function DetailModal({ reserva, onClose, onNavigate, onCancel }: {
  reserva: Reserva
  onClose: () => void
  onNavigate: (path: string) => void
  onCancel: (id: string) => Promise<void>
}) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const status = statusConfig[reserva.status]
  const StatusIcon = status.icon
  const nights = nightsBetween(reserva.startDate, reserva.endDate)
  const pricePerNight = Math.round(reserva.price / nights)

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await onCancel(reserva.id)
      setCancelled(true)
      setTimeout(onClose, 2000)
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = reserva.status === 'proxima' || reserva.status === 'em_andamento'

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-subtle">
          <h2 className="font-display text-xl font-bold text-text">Detalhes da reserva</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-subtle text-muted hover:text-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Cancelled banner */}
          {cancelled && (
            <div className="bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-3 text-sm text-green-400">
              Reserva cancelada. Extorno de R$ {reserva.price} iniciado — previsão: 5 dias úteis.
            </div>
          )}

          {/* Sitter row */}
          <div className="flex items-center gap-4">
            {reserva.sitterPhoto ? (
              <img src={reserva.sitterPhoto} alt={reserva.sitterName} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xl">
                {reserva.sitterName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text">{reserva.sitterName}</p>
              <p className="text-xs text-muted mt-0.5">{reserva.service}</p>
            </div>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${status.color}`}>
              <StatusIcon size={11} className={reserva.status === 'em_andamento' ? 'animate-spin' : ''} />
              {status.label}
            </span>
          </div>

          {/* Details grid */}
          <div className="card-2 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <PawPrint size={15} className="text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted">Pet</p>
                <p className="text-sm font-medium text-text">{reserva.petName}</p>
              </div>
            </div>

            <div className="border-t border-subtle" />

            <div className="flex items-start gap-3">
              <Calendar size={15} className="text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted">Check-in</p>
                <p className="text-sm font-medium text-text">{formatDate(reserva.startDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-muted flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted">Check-out</p>
                <p className="text-sm font-medium text-text">{formatDate(reserva.endDate)}</p>
              </div>
            </div>

            <div className="border-t border-subtle" />

            <div className="flex items-start gap-3">
              <DollarSign size={15} className="text-muted flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted">Valor total</p>
                <p className="text-sm font-bold text-text">R$ {reserva.price}</p>
                <p className="text-[10px] text-muted mt-0.5">
                  {nights} {nights === 1 ? 'noite' : 'noites'} · R$ {pricePerNight}/noite
                </p>
              </div>
            </div>
          </div>

          {/* Cancel confirm prompt */}
          {confirmCancel && !cancelled && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400 font-medium">Confirmar cancelamento?</p>
              </div>
              <p className="text-xs text-muted">O valor de R$ {reserva.price} será estornado em até 5 dias úteis.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="btn-outline flex-1 py-1.5 text-xs"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-1.5 rounded-xl text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {cancelling ? 'Cancelando…' : 'Cancelar reserva'}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            {reserva.status === 'concluida' && (
              <button
                onClick={() => { onClose(); onNavigate('/avaliacoes') }}
                className="btn-gradient flex items-center justify-center gap-2 flex-1 py-2.5"
              >
                <Star size={15} /> Avaliar
              </button>
            )}

            {reserva.status === 'proxima' && (
              <button
                onClick={() => { onClose(); onNavigate('/buscar') }}
                className="btn-gradient flex items-center justify-center gap-2 flex-1 py-2.5"
              >
                <CheckCircle2 size={15} /> Confirmar presença
              </button>
            )}
          </div>

          {/* Cancel button */}
          {canCancel && !confirmCancel && !cancelled && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full text-xs text-red-400 hover:text-red-500 transition-colors text-center py-1"
            >
              Cancelar reserva
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Reservas() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { reservas, cancelReserva, loading } = useReservas()
  const [activeTab, setActiveTab] = useState<ReservaStatus | 'todas'>('todas')
  const [detailId, setDetailId] = useState<string | null>(null)
  const filtered = activeTab === 'todas' ? reservas : reservas.filter(r => r.status === activeTab)
  const detailReserva = detailId ? reservas.find(r => r.id === detailId) ?? null : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Pill>Reservas</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Minhas reservas</h1>
        <p className="text-muted text-sm mt-1">Acompanhe todas as suas reservas, do agendamento à conclusão.</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-subtle text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-12 flex justify-center">
          <Loader2 size={24} className="animate-spin text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted text-sm">Nenhuma reserva nesta categoria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => {
            const status = statusConfig[r.status]
            const StatusIcon = status.icon
            return (
              <div key={r.id} className="card p-5">
                <div className="flex gap-4">
                  {r.sitterPhoto ? (
                    <img src={r.sitterPhoto} alt={r.sitterName} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xl">
                      {r.sitterName.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-text">{r.sitterName}</p>
                        <p className="text-xs text-muted mt-0.5">{r.service} · Pet: {r.petName}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${status.color}`}>
                        <StatusIcon size={11} className={r.status === 'em_andamento' ? 'animate-spin' : ''} />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Calendar size={13} className="text-muted" />
                      <span className="text-xs text-muted">
                        {formatDate(r.startDate)}
                        {r.startDate !== r.endDate && ` → ${formatDate(r.endDate)}`}
                      </span>
                      <span className="ml-auto font-semibold text-text text-sm">R$ {r.price}</span>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      {r.status === 'concluida' && (
                        <button
                          onClick={() => navigate('/avaliacoes')}
                          className="flex items-center gap-1 text-xs text-yellow-400 hover:underline"
                        >
                          <Star size={11} /> Avaliar
                        </button>
                      )}
                      <button
                        onClick={() => setDetailId(r.id)}
                        className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-text transition-colors"
                      >
                        Ver detalhes <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {user?.role !== 'cuidador' && (
        <div className="card p-6 text-center">
          <p className="text-muted text-sm mb-3">Quer agendar uma nova hospedagem?</p>
          <button onClick={() => navigate('/buscar')} className="btn-gradient">
            Buscar anfitriões
          </button>
        </div>
      )}

      {/* Detail modal */}
      {detailReserva && (
        <DetailModal
          reserva={detailReserva}
          onClose={() => setDetailId(null)}
          onNavigate={navigate}
          onCancel={cancelReserva}
        />
      )}
    </div>
  )
}
