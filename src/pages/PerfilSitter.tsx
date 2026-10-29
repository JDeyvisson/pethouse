import FormFeedback from '../components/FormFeedback'
import { todayBrazil } from '../lib/validation'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Star, MapPin, ShieldCheck, Home, Calendar, ArrowLeft, Heart,
  CheckCircle2, ImageIcon, ScrollText, X } from 'lucide-react'
import { api } from '../lib/api'
import { useReservas } from '../context/ReservasContext'
import Pill from '../components/Pill'
import PawSpinner from '../components/PawSpinner'
import type { Sitter } from '../data/sitters'

const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3001'


function diffDays(a: string, b: string) {
  return Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000)
}

interface ApiHost {
  id: string
  city: string
  pricePerDay: number
  averageRating?: number | null
  reviewCount?: number | null
  bio?: string | null
  housePhotos?: string[]
  spacePhotos?: string[]
  acceptedSizes?: string[]
  acceptedSpecies?: string[]
  hasHostedBefore?: boolean
  availableDates?: string[]
  user: { id: string; name: string }
}

interface ApiPet { id: string; name: string; species: string; size: string }
interface MainPet { species: string; size: string }

function calcMatchPercent(h: ApiHost, pet: MainPet | null): number {
  if (!pet) {
    let score = 70
    if ((h.averageRating ?? 0) >= 4) score += 10
    if (h.hasHostedBefore) score += 10
    return Math.min(score, 95)
  }
  let score = 40
  const speciesOk = !h.acceptedSpecies?.length ||
    h.acceptedSpecies.some(s => pet.species.toLowerCase().startsWith(s.toLowerCase()) || s.toLowerCase().startsWith(pet.species.toLowerCase()))
  if (speciesOk) score += 25
  const sizeOk = !h.acceptedSizes?.length ||
    h.acceptedSizes.some(s => pet.size.toLowerCase().startsWith(s.toLowerCase()))
  if (sizeOk) score += 20
  if (h.hasHostedBefore) score += 10
  if ((h.averageRating ?? 0) >= 4) score += 5
  return Math.min(score, 99)
}

function hostToSitter(h: ApiHost, pet: MainPet | null = null): Sitter {
  const photo = h.housePhotos?.[0] || h.spacePhotos?.[0]
  return {
    id: h.id,
    name: h.user.name,
    photo: photo
      ? `${BASE}${photo}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(h.user.name)}&background=5E8B7E&color=fff&size=128`,
    location: h.city,
    distance: '–',
    rating: h.averageRating ?? 0,
    reviewCount: h.reviewCount ?? 0,
    pricePerDay: h.pricePerDay ?? 0,
    services: ['Hospedagem'],
    matchPercent: calcMatchPercent(h, pet),
    verified: false,
    homeInspected: false,
    bio: h.bio ?? '',
    experience: h.hasHostedBefore ? 'Com experiência em hospedagem' : 'Iniciando como anfitrião',
    vetPartner: false,
    availability: [],
    availableDates: h.availableDates ?? [],
    gallery: (h.housePhotos ?? []).map(p => `${BASE}${p}`),
    reviews: [],
    policies: ['Reserva demonstrativa, sem cobrança', 'Cancelamento antes do início da hospedagem'],
    likesCount: 0,
  }
}

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
      ))}
    </div>
  )
}



function PaymentModal({ sitter, onClose, onSuccess }: { sitter: Sitter; onClose: () => void; onSuccess: () => void }) {
  const [pets, setPets] = useState<ApiPet[]>([])
  const [petId, setPetId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)
  const key = useRef({ signature: '', value: crypto.randomUUID() })
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => { api.get<ApiPet[]>('/pets').then(setPets).then(() => setReady(true)).catch(() => setError('Não foi possível carregar seus pets. Feche e tente novamente.')) }, [])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement
    dialog.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
      if (e.key === 'Tab') {
        const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,a') ?? [])
        const first = items[0], last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last?.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', handler)
    return () => { document.removeEventListener('keydown', handler); previous?.focus() }
  }, [busy, onClose])
  const nights = start && end ? diffDays(start, end) : 0
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !ready) return
    setError(null)
    if (!petId || nights < 1 || nights > 365) { setError('Selecione um pet e um período de 1 a 365 noites.'); return }
    const available = new Set(sitter.availableDates)
    const days = Array.from({ length: nights }, (_, i) => new Date(Date.parse(start) + i * 86400000).toISOString().slice(0, 10))
    if (!days.every(d => available.has(d))) { setError('Há noites indisponíveis no período selecionado.'); return }
    const signature = [petId, start, end].join('|')
    if (key.current.signature !== signature) key.current = { signature, value: crypto.randomUUID() }
    setBusy(true)
    try {
      await api.post('/reservas', { petId, hostId: sitter.id, startDate: start + 'T12:00:00.000Z', endDate: end + 'T12:00:00.000Z', idempotencyKey: key.current.value })
      setDone(true)
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível reservar.') }
    finally { setBusy(false) }
  }
  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="booking-title" className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
      <div className="flex justify-between gap-4"><h2 id="booking-title" className="text-xl font-bold">Reserva demonstrativa</h2><button aria-label="Fechar reserva" onClick={onClose} disabled={busy}><X /></button></div>
      <p className="text-sm text-muted">Pagamento simulado: nenhuma cobrança ou transferência será realizada. Não informe dados de cartão.</p>
      <FormFeedback message={error} />
      {done ? <><p role="status">Reserva registrada para demonstração. Nenhum pagamento foi realizado.</p><button className="btn-primary" onClick={onSuccess}>Ver reservas</button></> : <form onSubmit={submit} className="space-y-4">
        <label htmlFor="booking-pet" className="block">Pet</label><select id="booking-pet" className="input-field mt-2" required value={petId} onChange={e => setPetId(e.target.value)}><option value="">Selecione</option>{pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        {ready && !pets.length && <a className="text-primary underline" href="/meus-pets/novo">Cadastre um pet para continuar</a>}
        <label className="block">Check-in<input className="input-field mt-2" type="date" required min={todayBrazil()} value={start} onChange={e => setStart(e.target.value)} /></label>
        <label className="block">Check-out<input className="input-field mt-2" type="date" required min={start || todayBrazil()} value={end} onChange={e => setEnd(e.target.value)} /></label>
        <p>{Math.max(nights, 0)} noite(s) · Valor demonstrativo: R$ {(Math.max(nights, 0) * sitter.pricePerDay).toFixed(2)}</p>
        <p className="text-xs text-muted">O valor e as vagas serão conferidos ao confirmar.</p>
        <button className="btn-primary" disabled={busy || !ready || !pets.length}>{busy ? 'Registrando…' : 'Confirmar reserva demonstrativa'}</button>
      </form>}
    </div>
  </div>
}

export default function PerfilSitter() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { refresh } = useReservas()
  interface ApiReview { id: string; rating: number; comment: string; tutorName: string; createdAt: string }

  const [sitter, setSitter] = useState<Sitter | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [showPayment, setShowPayment] = useState(false)
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [mainPet, setMainPet] = useState<MainPet | null>(null)

  useEffect(() => {
    api.get<ApiPet[]>('/pets')
      .then(pets => { if (pets.length > 0) setMainPet({ species: pets[0].species, size: pets[0].size }) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    api.get<ApiHost>(`/hosts/${id}`)
      .then(h => {
        const s = hostToSitter(h, mainPet)
        setSitter(s)
        setLikes(s.likesCount)
      })
      .catch(() => { /* show error state */ })
      .finally(() => setLoading(false))
    api.get<ApiReview[]>(`/reviews/${id}`)
      .then(setReviews)
      .catch(() => { /* keep empty */ })
  }, [id, mainPet])

  const handleLike = () => {
    setLiked(prev => !prev)
    setLikes(prev => (liked ? prev - 1 : prev + 1))
  }

  const handlePaymentSuccess = () => {
    refresh()
    setShowPayment(false)
    navigate('/reservas')
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar para busca
        </button>
        <div className="card skeleton h-56 sm:h-72" />
        <div className="card p-12 flex items-center justify-center">
          <PawSpinner size={16} label="Carregando perfil…" />
        </div>
      </div>
    )
  }

  if (!sitter) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar para busca
        </button>
        <div className="card p-12 text-center text-muted text-sm">Anfitrião não encontrado.</div>
      </div>
    )
  }

  const coverPhoto = sitter.gallery[0] || sitter.photo

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm">
        <ArrowLeft size={16} /> Voltar para busca
      </button>

      <Pill>Perfil do anfitrião</Pill>

      {/* Hero card */}
      <div className="card overflow-hidden">
        <div className="h-56 sm:h-72 relative overflow-hidden">
          <img src={coverPhoto} alt={`Espaço de ${sitter.name}`} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

          <div className="absolute inset-0 flex items-end p-6">
            <div className="flex items-end gap-4">
              <div className="relative">
                <img src={sitter.photo} alt={sitter.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-bg shadow-lg" />
                <div className="absolute -top-3 -right-3 bg-coral text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                  {sitter.matchPercent}%
                </div>
              </div>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-bold text-white drop-shadow-sm">{sitter.name}</h1>
                <div className="flex items-center gap-2 text-sm text-white/85">
                  <MapPin size={12} />
                  <span>{sitter.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={handleLike} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/30 backdrop-blur-sm hover:bg-black/45 transition-colors">
              <Heart size={16} className={liked ? 'animate-paw-pop' : 'text-white'} fill={liked ? '#FF7E5F' : 'none'} style={liked ? { color: '#FF7E5F' } : {}} />
              <span className="text-xs font-semibold text-white">{likes}</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {sitter.verified && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
                <ShieldCheck size={12} /> Identidade verificada
              </span>
            )}
            {sitter.homeInspected && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-info/15 text-info text-xs font-medium">
                <Home size={12} /> Casa vistoriada
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <StarRating rating={sitter.rating} size={14} />
            <span className="text-sm font-medium text-text">{sitter.rating > 0 ? sitter.rating.toFixed(1) : '—'}</span>
            {sitter.reviewCount > 0 && <span className="text-sm text-muted">({sitter.reviewCount} avaliações)</span>}
          </div>
        </div>
      </div>

      {/* Mobile-only quick CTA — desktop relies on the sticky booking card */}
      <div className="card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 lg:hidden">
        <div>
          <p className="font-semibold text-text">Pronto para reservar?</p>
          <p className="text-sm text-muted">R$ {sitter.pricePerDay} / diária · Verifique a disponibilidade.</p>
        </div>
        <button onClick={() => setShowPayment(true)} className="btn-gradient flex items-center gap-2 w-full sm:w-auto justify-center">
          <Calendar size={16} /> Reservar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6 items-start">
        {/* Left column — trust-building content */}
        <div className="space-y-6 order-2 lg:order-1">
          {/* Sobre */}
          {sitter.bio && (
            <div className="card p-6">
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Sobre</p>
              <p className="text-sm text-text leading-relaxed mb-3">{sitter.bio}</p>
              <p className="text-sm text-muted leading-relaxed">{sitter.experience}</p>
            </div>
          )}

          {/* Serviços */}
          <div className="card p-6">
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Serviços oferecidos</p>
            <div className="flex flex-wrap gap-2">
              {sitter.services.map(s => (
                <span key={s} className="px-3 py-1 rounded-full bg-subtle border border-medium text-xs text-text">{s}</span>
              ))}
            </div>
          </div>

          {/* Galeria */}
          {sitter.gallery.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={14} className="text-primary" />
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Fotos da casa</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sitter.gallery.map((src, i) => (
                  <div key={i} className="relative overflow-hidden rounded-xl h-28">
                    <img
                      src={src}
                      alt={`Foto da casa de ${sitter.name} ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Políticas */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <ScrollText size={14} className="text-primary" />
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Políticas</p>
            </div>
            <ul className="space-y-2">
              {sitter.policies.map((policy, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <CheckCircle2 size={14} className="text-primary flex-shrink-0 mt-0.5" />{policy}
                </li>
              ))}
            </ul>
          </div>

          {/* Avaliações */}
          {reviews.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className="text-primary" />
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Avaliações</p>
              </div>
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="border-b border-subtle last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                        {r.tutorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{r.tutorName}</p>
                        <StarRating rating={r.rating} size={11} />
                      </div>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final CTA */}
          <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-text">Gostou do perfil de {sitter.name}?</p>
              <p className="text-sm text-muted">Reserve agora e garanta o melhor cuidado para o seu pet.</p>
            </div>
            <button onClick={() => setShowPayment(true)} className="btn-gradient flex items-center gap-2 w-full sm:w-auto justify-center">
              <Calendar size={16} /> Reservar agora
            </button>
          </div>
        </div>

        {/* Right column — sticky booking card (desktop) */}
        <div className="order-1 lg:order-2 hidden lg:block lg:sticky lg:top-24">
          <div className="card p-6 space-y-5">
            <div>
              <p className="text-2xl font-bold text-text">R$ {sitter.pricePerDay}</p>
              <p className="text-xs text-muted">por diária</p>
            </div>

            <div className="flex items-center gap-2 pb-4 border-b border-subtle">
              <StarRating rating={sitter.rating} size={13} />
              <span className="text-sm font-medium text-text">{sitter.rating > 0 ? sitter.rating.toFixed(1) : '—'}</span>
              {sitter.reviewCount > 0 && <span className="text-xs text-muted">({sitter.reviewCount})</span>}
            </div>

            <button onClick={() => setShowPayment(true)} className="btn-gradient w-full flex items-center justify-center gap-2">
              <Calendar size={16} /> Reservar
            </button>

            <div className="space-y-2.5">
              {sitter.verified && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <ShieldCheck size={13} className="text-primary flex-shrink-0" /> Identidade verificada
                </div>
              )}
              {sitter.homeInspected && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Home size={13} className="text-info flex-shrink-0" /> Casa vistoriada
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted">
                <MapPin size={13} className="text-muted flex-shrink-0" /> {sitter.location}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal sitter={sitter} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />
      )}
    </div>
  )
}
