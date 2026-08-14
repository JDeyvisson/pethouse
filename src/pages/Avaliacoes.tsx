import { useState, useEffect } from 'react'
import { Star, Send, Loader2 } from 'lucide-react'
import { useReservas } from '../context/ReservasContext'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'
import Pill from '../components/Pill'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
        />
      ))}
    </div>
  )
}

function SelectableStarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1
        const filled = starValue <= (hover || value)
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star size={24} className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
          </button>
        )
      })}
    </div>
  )
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

interface TutorReview {
  id: string
  rating: number
  comment: string
  sitterName: string
  petName: string
  service: string
  createdAt: string
}

interface CuidadorReview {
  id: string
  rating: number
  comment: string
  tutorName: string
  createdAt: string
}

export default function Avaliacoes() {
  const { reservas } = useReservas()
  const { user } = useAuth()
  const isCuidador = user?.role === 'cuidador'

  const completedReservations = reservas.filter(r => r.status === 'concluida')

  // ── Tutor state
  const [avaliacoes, setAvaliacoes] = useState<TutorReview[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [reservaId, setReservaId] = useState(completedReservations[0]?.id ?? '')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Cuidador state
  const [receivedReviews, setReceivedReviews] = useState<CuidadorReview[]>([])

  useEffect(() => {
    if (isCuidador) {
      api.get<CuidadorReview[]>('/reviews/received')
        .then(setReceivedReviews)
        .catch(() => {})
        .finally(() => setListLoading(false))
    } else {
      api.get<TutorReview[]>('/reviews/mine')
        .then(setAvaliacoes)
        .catch(() => {})
        .finally(() => setListLoading(false))
    }
  }, [isCuidador])

  const avg = avaliacoes.length
    ? (avaliacoes.reduce((a, b) => a + b.rating, 0) / avaliacoes.length).toFixed(1)
    : '0.0'

  const handleTutorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const reserva = completedReservations.find(r => r.id === reservaId)
    if (!reserva || rating === 0 || !comment.trim()) return
    if (!reserva.hostId) {
      setSubmitError('Não foi possível identificar o anfitrião desta reserva.')
      return
    }
    setSubmitError(null)
    setSubmitting(true)
    try {
      const newReview = await api.post<TutorReview>('/reviews', {
        hostId: reserva.hostId,
        reservaId: reserva.id,
        rating,
        comment,
      })
      setAvaliacoes(prev => [{
        ...newReview,
        sitterName: reserva.sitterName,
        petName: reserva.petName,
        service: reserva.service,
      }, ...prev])
      setRating(0)
      setComment('')
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Erro ao enviar avaliação.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── CUIDADOR VIEW
  if (isCuidador) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Pill>Avaliações</Pill>
          <h1 className="font-display text-3xl font-bold text-text mt-3">Avaliações</h1>
          <p className="text-muted text-sm mt-1">Avaliações recebidas pelos tutores das suas hospedagens.</p>
        </div>

        {listLoading ? (
          <div className="card p-10 flex justify-center">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : receivedReviews.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-muted text-sm">Nenhuma avaliação recebida ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              {receivedReviews.length} avaliação{receivedReviews.length !== 1 ? 'ões' : ''} recebida{receivedReviews.length !== 1 ? 's' : ''}
            </p>
            {receivedReviews.map(r => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                      {r.tutorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text">{r.tutorName}</p>
                      <StarRating rating={r.rating} />
                    </div>
                  </div>
                  <p className="text-xs text-muted">{formatDate(r.createdAt)}</p>
                </div>
                <p className="text-sm text-muted leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── TUTOR VIEW
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Pill>Avaliações</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Avaliações</h1>
        <p className="text-muted text-sm mt-1">Veja e gerencie suas avaliações de serviços.</p>
      </div>

      {/* Summary */}
      {!listLoading && (
        <div className="card p-6 flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-text">{avg}</p>
            <StarRating rating={Math.round(Number(avg))} />
            <p className="text-xs text-muted mt-1">{avaliacoes.length} avaliações</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = avaliacoes.filter(a => a.rating === star).length
              const pct = avaliacoes.length ? (count / avaliacoes.length) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted">{star}</span>
                  <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-subtle-lg rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4 text-muted text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Leave a review */}
      {completedReservations.length > 0 && (
        <form onSubmit={handleTutorSubmit} className="card p-6 space-y-4">
          <p className="font-semibold text-text text-sm">Deixe sua avaliação</p>

          {submitError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{submitError}</div>
          )}

          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Serviço concluído</label>
            <select
              value={reservaId}
              onChange={e => setReservaId(e.target.value)}
              className="mt-2 w-full bg-surface-2 border border-medium rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
            >
              {completedReservations.map(r => (
                <option key={r.id} value={r.id}>
                  {r.sitterName} · {r.service} · {r.petName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Sua nota</label>
            <div className="mt-2">
              <SelectableStarRating value={rating} onChange={setRating} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Comentário</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Conte como foi a experiência..."
              rows={3}
              className="mt-2 w-full bg-surface-2 border border-medium rounded-xl px-4 py-3 text-sm text-text placeholder-muted focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={rating === 0 || !comment.trim() || submitting}
            className="btn-gradient flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </form>
      )}

      {/* Reviews list */}
      {listLoading ? (
        <div className="card p-10 flex justify-center">
          <Loader2 size={24} className="animate-spin text-muted" />
        </div>
      ) : (
        <div className="space-y-4">
          {avaliacoes.map(av => (
            <div key={av.id} className="card p-5">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                  {av.sitterName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text text-sm">{av.sitterName}</p>
                      <p className="text-xs text-muted">{av.service} · {av.petName}</p>
                    </div>
                    <div className="text-right">
                      <StarRating rating={av.rating} />
                      <p className="text-[10px] text-muted mt-0.5">{formatDate(av.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-text mt-3 leading-relaxed">{av.comment}</p>
                </div>
              </div>
            </div>
          ))}
          {avaliacoes.length === 0 && !listLoading && (
            <div className="card p-10 text-center">
              <p className="text-muted text-sm">Nenhuma avaliação enviada ainda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
