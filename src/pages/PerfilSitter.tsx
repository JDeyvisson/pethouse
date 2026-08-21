import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Star, MapPin, ShieldCheck, Home, Calendar, ArrowLeft, Heart,
  CheckCircle2, ImageIcon, ScrollText, X, CreditCard, Loader2, PawPrint, Plus,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useReservas } from '../context/ReservasContext'
import Pill from '../components/Pill'
import type { Sitter } from '../data/sitters'

const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3001'

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_PT_MIN = ['D','S','T','Q','Q','S','S']

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function todayIso() {
  const t = new Date()
  return isoDate(t.getFullYear(), t.getMonth(), t.getDate())
}
function diffDays(a: string, b: string) {
  return Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000)
}
function fmtIso(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
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
    verified: true,
    homeInspected: true,
    bio: h.bio ?? '',
    experience: h.hasHostedBefore ? 'Com experiência em hospedagem' : 'Iniciando como anfitrião',
    vetPartner: false,
    availability: [],
    availableDates: h.availableDates ?? [],
    gallery: (h.housePhotos ?? []).map(p => `${BASE}${p}`),
    reviews: [],
    policies: ['Cancelamento gratuito até 48h antes', 'Atualização diária sobre o pet'],
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

type PayStep = 'idle' | 'processing' | 'success'
type ModalTab = 'dates' | 'payment'

interface SavedCard { id: string; brand: string; last4: string; expiry: string }

function PaymentModal({ sitter, onClose, onSuccess }: {
  sitter: Sitter
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<PayStep>('idle')
  const [tab, setTab] = useState<ModalTab>('dates')
  const [payMethod, setPayMethod] = useState<'card' | 'pix'>('card')
  const [card, setCard] = useState({ number: '', holder: '', expiry: '', cvv: '' })
  const [copied, setCopied] = useState(false)
  const [pets, setPets] = useState<ApiPet[]>([])
  const [petsLoading, setPetsLoading] = useState(true)
  const [selectedPetId, setSelectedPetId] = useState<string>('')
  const [payError, setPayError] = useState<string | null>(null)
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>('new')
  const [cardsLoading, setCardsLoading] = useState(true)

  // Date range state
  const [checkin, setCheckin] = useState<string | null>(null)
  const [checkout, setCheckout] = useState<string | null>(null)
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())

  const today = todayIso()
  const availSet = new Set(sitter.availableDates ?? [])
  const hasAvailability = availSet.size > 0
  const nights = checkin && checkout ? Math.max(diffDays(checkin, checkout), 1) : 0
  const total = sitter.pricePerDay * nights

  const PIX_KEY = 'pet.house.digipet@gmail.com'
  const copyPix = () => {
    navigator.clipboard.writeText(PIX_KEY)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    api.get<ApiPet[]>('/pets').then(data => {
      setPets(data)
      if (data.length > 0) setSelectedPetId(data[0].id)
    }).catch(() => {}).finally(() => setPetsLoading(false))
    api.get<SavedCard[]>('/payment-cards')
      .then(cards => {
        setSavedCards(cards)
        if (cards.length > 0) setSelectedCardId(cards[0].id)
      })
      .catch(() => {})
      .finally(() => setCardsLoading(false))
  }, [])

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
  }

  // Calendar navigation
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const handleDayClick = (iso: string) => {
    if (!availSet.has(iso) || iso < today) return
    if (!checkin || (checkin && checkout)) {
      setCheckin(iso); setCheckout(null)
    } else {
      if (iso < checkin) { setCheckin(iso); setCheckout(null) }
      else setCheckout(iso)
    }
  }

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => isoDate(calYear, calMonth, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const handlePay = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.()
    if (!selectedPetId) { setPayError('Selecione um pet para continuar.'); return }
    if (!checkin || !checkout) { setPayError('Selecione as datas de check-in e check-out.'); return }
    setPayError(null)
    setStep('processing')
    try {
      await api.post('/reservas', {
        petId: selectedPetId,
        hostId: sitter.id,
        startDate: new Date(checkin + 'T12:00:00').toISOString(),
        endDate: new Date(checkout + 'T12:00:00').toISOString(),
        price: total,
      })
      setStep('success')
      setTimeout(() => onSuccess(), 1500)
    } catch (err) {
      setStep('idle')
      setPayError(err instanceof ApiError ? err.message : 'Erro ao processar pagamento.')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={step === 'idle' ? onClose : undefined}
    >
      <div className="card w-full max-w-md flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {step === 'success' ? (
          <div className="p-10 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-text font-display">Reserva confirmada!</p>
              <p className="text-sm text-muted mt-1">Você será redirecionado para suas reservas.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-subtle flex-shrink-0">
              <h2 className="font-display text-xl font-bold text-text">Reservar</h2>
              {step === 'idle' && (
                <button onClick={onClose} className="p-1.5 rounded-lg bg-subtle text-muted hover:text-text transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-subtle flex-shrink-0">
              {(['dates', 'payment'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
                  }`}>
                  {t === 'dates' ? '1. Datas' : '2. Pagamento'}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {payError && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{payError}</div>
              )}

              {tab === 'dates' ? (
                <>
                  {/* Pet selector */}
                  {petsLoading ? (
                    <div className="flex items-center gap-2 py-1 text-muted text-sm">
                      <Loader2 size={14} className="animate-spin" /> Carregando pets…
                    </div>
                  ) : pets.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-medium p-4 text-center space-y-2">
                      <PawPrint size={24} className="text-muted mx-auto opacity-40" />
                      <p className="text-sm font-medium text-text">Nenhum pet cadastrado</p>
                      <p className="text-xs text-muted">Cadastre um pet para poder fazer reservas.</p>
                      <a
                        href="/meus-pets/novo"
                        className="inline-flex items-center gap-1.5 mt-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ backgroundColor: '#FF7E5F' }}
                      >
                        <PawPrint size={14} /> Cadastrar pet
                      </a>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <PawPrint size={14} className="text-muted" />
                        <p className="text-xs font-medium text-muted uppercase tracking-wider">Qual pet vai se hospedar?</p>
                      </div>
                      <select
                        value={selectedPetId}
                        onChange={e => setSelectedPetId(e.target.value)}
                        className="w-full bg-surface-2 border border-medium rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
                      >
                        {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                      </select>
                    </div>
                  )}

                  {/* Calendar */}
                  {!hasAvailability ? (
                    <div className="rounded-xl bg-subtle p-6 text-center">
                      <Calendar size={28} className="text-muted mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted">Este anfitrião ainda não definiu datas disponíveis.</p>
                    </div>
                  ) : (
                    <div className="select-none">
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                        Selecione check-in e check-out
                      </p>

                      {/* Legend */}
                      <div className="flex gap-4 mb-3 text-xs text-muted">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#FF7E5F' }} /> Disponível
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-primary/20 inline-block" /> Período selecionado
                        </span>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={prevMonth}
                          className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-text transition-colors">
                          <ChevronLeft size={15} />
                        </button>
                        <p className="text-sm font-semibold text-text">{MONTHS_PT[calMonth]} {calYear}</p>
                        <button type="button" onClick={nextMonth}
                          className="p-1.5 rounded-lg hover:bg-subtle text-muted hover:text-text transition-colors">
                          <ChevronRight size={15} />
                        </button>
                      </div>

                      {/* Day headers */}
                      <div className="grid grid-cols-7 mb-1">
                        {DAYS_PT_MIN.map((d, i) => (
                          <div key={i} className="text-center text-[10px] font-medium text-muted py-1">{d}</div>
                        ))}
                      </div>

                      {/* Cells */}
                      <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((iso, idx) => {
                          if (!iso) return <div key={idx} />
                          const isAvail = availSet.has(iso) && iso >= today
                          const isPast = iso < today
                          const isCheckin = iso === checkin
                          const isCheckout = iso === checkout
                          const isInRange = !!(checkin && checkout && iso > checkin && iso < checkout)
                          const isEndpoint = isCheckin || isCheckout
                          return (
                            <button key={iso} type="button"
                              disabled={!isAvail}
                              onClick={() => handleDayClick(iso)}
                              className={`h-9 w-full rounded-lg text-sm font-medium transition-all relative
                                ${isPast || !isAvail ? 'text-muted/30 cursor-not-allowed' : ''}
                                ${isInRange ? 'bg-primary/15 rounded-none text-primary' : ''}
                                ${isEndpoint ? 'text-white shadow-sm rounded-lg z-10' : ''}
                                ${isAvail && !isEndpoint && !isInRange ? 'hover:bg-primary/10 hover:text-primary text-text' : ''}
                              `}
                              style={isEndpoint ? { backgroundColor: '#FF7E5F' } : {}}
                            >
                              {new Date(iso + 'T12:00:00').getDate()}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected range summary */}
                  <div className="card-2 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Anfitrião</span>
                      <span className="text-text font-medium">{sitter.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Check-in</span>
                      <span className={checkin ? 'text-text font-medium' : 'text-muted/50'}>
                        {checkin ? fmtIso(checkin) : '— Não selecionado'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Check-out</span>
                      <span className={checkout ? 'text-text font-medium' : 'text-muted/50'}>
                        {checkout ? fmtIso(checkout) : '— Não selecionado'}
                      </span>
                    </div>
                    {nights > 0 && (
                      <div className="flex justify-between border-t border-subtle pt-2 mt-2">
                        <span className="text-muted">{checkin === checkout ? '1 diária' : `${nights} noite${nights > 1 ? 's' : ''}`} × R$ {sitter.pricePerDay}</span>
                        <span className="text-text font-semibold">R$ {total}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!checkin || !checkout || !selectedPetId || pets.length === 0}
                    onClick={() => { setPayError(null); setTab('payment') }}
                    className="btn-gradient w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40">
                    Continuar para pagamento
                  </button>
                </>
              ) : (
                <>
                  {/* Payment tab */}
                  <div className="grid grid-cols-2 gap-2">
                    {([{ id: 'card', label: 'Cartão', icon: <CreditCard size={15} /> }, { id: 'pix', label: 'PIX', icon: <span className="font-bold text-xs">PIX</span> }] as const).map(m => (
                      <button key={m.id} type="button" onClick={() => setPayMethod(m.id)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          payMethod === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-medium text-muted hover:border-stronger'
                        }`}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>

                  {payMethod === 'card' ? (
                    <form onSubmit={handlePay} className="space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard size={15} className="text-muted" />
                        <p className="text-xs font-medium text-muted uppercase tracking-wider">Dados do cartão</p>
                      </div>

                      {cardsLoading ? (
                        <div className="flex items-center gap-2 py-2 text-muted text-sm">
                          <Loader2 size={14} className="animate-spin" /> Carregando cartões...
                        </div>
                      ) : savedCards.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted">Cartões salvos</p>
                          {savedCards.map(sc => (
                            <label key={sc.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedCardId === sc.id ? 'border-primary bg-primary/5' : 'border-medium hover:border-stronger'}`}>
                              <input type="radio" name="savedCard" value={sc.id} checked={selectedCardId === sc.id} onChange={() => setSelectedCardId(sc.id)} className="sr-only" />
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedCardId === sc.id ? 'border-primary' : 'border-medium'}`}>
                                {selectedCardId === sc.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                              </div>
                              <CreditCard size={15} className="text-muted flex-shrink-0" />
                              <span className="text-sm text-text font-medium">{sc.brand} •••• {sc.last4}</span>
                              <span className="text-xs text-muted ml-auto">Val. {sc.expiry}</span>
                            </label>
                          ))}
                          <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedCardId === 'new' ? 'border-primary bg-primary/5' : 'border-medium hover:border-stronger'}`}>
                            <input type="radio" name="savedCard" value="new" checked={selectedCardId === 'new'} onChange={() => setSelectedCardId('new')} className="sr-only" />
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedCardId === 'new' ? 'border-primary' : 'border-medium'}`}>
                              {selectedCardId === 'new' && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <Plus size={15} className="text-muted flex-shrink-0" />
                            <span className="text-sm text-text">Usar novo cartão</span>
                          </label>
                        </div>
                      ) : null}

                      {(savedCards.length === 0 || selectedCardId === 'new') && (
                        <>
                          <div>
                            <label className="text-xs text-muted">Número do cartão</label>
                            <input className="input-field mt-1" placeholder="0000 0000 0000 0000"
                              value={card.number} onChange={e => setCard(p => ({ ...p, number: formatCardNumber(e.target.value) }))} required />
                          </div>
                          <div>
                            <label className="text-xs text-muted">Nome no cartão</label>
                            <input className="input-field mt-1" placeholder="MARINA COSTA"
                              value={card.holder} onChange={e => setCard(p => ({ ...p, holder: e.target.value.toUpperCase() }))} required />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted">Validade</label>
                              <input className="input-field mt-1" placeholder="MM/AA"
                                value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))} required />
                            </div>
                            <div>
                              <label className="text-xs text-muted">CVV</label>
                              <input className="input-field mt-1" placeholder="123" maxLength={4}
                                value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} required />
                            </div>
                          </div>
                        </>
                      )}

                      <button type="submit" disabled={step === 'processing'}
                        className="btn-gradient w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60">
                        {step === 'processing'
                          ? <><Loader2 size={16} className="animate-spin" /> Processando...</>
                          : <>Pagar R$ {total}</>}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-medium p-4 space-y-3">
                        <p className="text-xs font-medium text-muted uppercase tracking-wider">Chave PIX</p>
                        <div className="flex items-center justify-between gap-3 bg-subtle rounded-xl px-3 py-2.5">
                          <span className="text-sm text-text font-mono">{PIX_KEY}</span>
                          <button type="button" onClick={copyPix}
                            className="text-xs text-primary hover:underline flex-shrink-0">
                            {copied ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        <div className="rounded-xl bg-subtle flex items-center justify-center h-32 text-xs text-muted">
                          QR Code — disponível em breve
                        </div>
                      </div>
                      <button type="button" disabled={step === 'processing'}
                        onClick={handlePay}
                        className="btn-gradient w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60">
                        {step === 'processing'
                          ? <><Loader2 size={16} className="animate-spin" /> Processando...</>
                          : <>Confirmar via PIX — R$ {total}</>}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
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
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar para busca
        </button>
        <div className="card p-12 text-center text-muted text-sm">Carregando perfil…</div>
      </div>
    )
  }

  if (!sitter) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar para busca
        </button>
        <div className="card p-12 text-center text-muted text-sm">Anfitrião não encontrado.</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-text transition-colors text-sm">
        <ArrowLeft size={16} /> Voltar para busca
      </button>

      <Pill>Perfil do anfitrião</Pill>

      {/* Hero card */}
      <div className="card overflow-hidden">
        <div className="h-40 relative" style={{ backgroundColor: '#FF7E5F22' }}>
          <div className="absolute inset-0 flex items-end p-6">
            <div className="flex items-end gap-4">
              <div className="relative">
                <img src={sitter.photo} alt={sitter.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-bg shadow-lg" />
                <div className="absolute -top-3 -right-3 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow" style={{ backgroundColor: '#FF7E5F' }}>
                  {sitter.matchPercent}%
                </div>
              </div>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-bold text-text">{sitter.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <MapPin size={12} />
                  <span>{sitter.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={handleLike} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg/70 backdrop-blur-sm transition-colors">
              <Heart size={16} className={liked ? '' : 'text-muted'} fill={liked ? '#FF7E5F' : 'none'} style={liked ? { color: '#FF7E5F' } : {}} />
              <span className="text-xs font-semibold" style={liked ? { color: '#FF7E5F' } : { color: 'var(--tw-color-muted, #6b6b6f)' }}>{likes}</span>
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
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-medium">
                <Home size={12} /> Casa vistoriada
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <StarRating rating={sitter.rating} size={14} />
                <span className="text-sm font-medium text-text">{sitter.rating > 0 ? sitter.rating.toFixed(1) : '—'}</span>
                {sitter.reviewCount > 0 && <span className="text-sm text-muted">({sitter.reviewCount} avaliações)</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-text">R$ {sitter.pricePerDay}</p>
              <p className="text-xs text-muted">por diária</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA bar */}
      <div className="card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-text">Pronto para reservar?</p>
          <p className="text-sm text-muted">Verifique a disponibilidade e faça sua reserva.</p>
        </div>
        <button onClick={() => setShowPayment(true)} className="btn-gradient flex items-center gap-2 w-full sm:w-auto justify-center">
          <Calendar size={16} /> Reservar
        </button>
      </div>

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
              <img key={i} src={src} alt={`Foto da casa de ${sitter.name} ${i + 1}`} className="w-full h-28 object-cover rounded-xl" />
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

      {showPayment && (
        <PaymentModal sitter={sitter} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />
      )}
    </div>
  )
}
