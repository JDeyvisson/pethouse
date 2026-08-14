import { useState, useEffect } from 'react'
import {
  DollarSign, Calendar, Star, PawPrint, CheckCircle2,
  Lock, Sparkles, CreditCard, Loader2, Check, Plus,
} from 'lucide-react'
import Pill from '../components/Pill'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'

// ── Subscription types ────────────────────────────────────────────────────────
interface SubStatus { active: boolean; endDate: string | null; plan: string | null }
interface SavedCard { id: string; brand: string; last4: string; expiry: string }

// ── Paywall Modal ─────────────────────────────────────────────────────────────
function PaywallModal({ onSuccess }: { onSuccess: () => void }) {
  const [payMethod, setPayMethod] = useState<'card' | 'pix'>('card')
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>('new')
  const [cardsLoading, setCardsLoading] = useState(true)
  const [card, setCard] = useState({ number: '', holder: '', expiry: '', cvv: '' })
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const PIX_KEY = 'pet.house.digipet@gmail.com'

  useEffect(() => {
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
    const d = v.replace(/\D/g, '').slice(0, 4)
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubscribing(true)
    setError(null)
    try {
      await api.post('/subscriptions/subscribe', { paymentMethod: payMethod })
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao processar pagamento. Tente novamente.')
    } finally {
      setSubscribing(false)
    }
  }

  const handlePixConfirm = async () => {
    setSubscribing(true)
    setError(null)
    try {
      await api.post('/subscriptions/subscribe', { paymentMethod: 'pix' })
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao processar pagamento.')
    } finally {
      setSubscribing(false)
    }
  }

  const copyPix = () => {
    navigator.clipboard.writeText(PIX_KEY)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-subtle flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/15">
              <Sparkles size={18} className="text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-text">Pet House Premium</h2>
          </div>
          <p className="text-sm text-muted">Desbloqueie o Dashboard completo com análises detalhadas.</p>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Plan card */}
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-bold text-text text-lg">Plano Mensal</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">R$ 29,90</span>
                <span className="text-xs text-muted">/mês</span>
              </div>
            </div>
            <ul className="space-y-2">
              {[
                'Dashboard com todos os dados',
                'Histórico completo de reservas',
                'Relatório de gastos e economias',
                'Estatísticas por pet',
                'Acesso prioritário a novidades',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-text">
                  <Check size={13} className="text-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
          )}

          {/* Payment method selector */}
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'card' as const, label: 'Cartão', icon: <CreditCard size={15} /> },
              { id: 'pix' as const,  label: 'PIX',    icon: <span className="font-bold text-xs">PIX</span> },
            ]).map(m => (
              <button key={m.id} type="button" onClick={() => setPayMethod(m.id)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  payMethod === m.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-medium text-muted hover:border-stronger'
                }`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {payMethod === 'card' ? (
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-muted" />
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Dados do cartão</p>
              </div>

              {cardsLoading ? (
                <div className="flex items-center gap-2 py-2 text-muted text-sm">
                  <Loader2 size={14} className="animate-spin" /> Carregando cartões…
                </div>
              ) : savedCards.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted">Cartões salvos</p>
                  {savedCards.map(sc => (
                    <label key={sc.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedCardId === sc.id ? 'border-primary bg-primary/5' : 'border-medium hover:border-stronger'
                    }`}>
                      <input type="radio" name="savedCard" value={sc.id} checked={selectedCardId === sc.id}
                        onChange={() => setSelectedCardId(sc.id)} className="sr-only" />
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        selectedCardId === sc.id ? 'border-primary' : 'border-medium'
                      }`}>
                        {selectedCardId === sc.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <CreditCard size={14} className="text-muted flex-shrink-0" />
                      <span className="text-sm text-text font-medium">{sc.brand} •••• {sc.last4}</span>
                      <span className="text-xs text-muted ml-auto">Val. {sc.expiry}</span>
                    </label>
                  ))}
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCardId === 'new' ? 'border-primary bg-primary/5' : 'border-medium hover:border-stronger'
                  }`}>
                    <input type="radio" name="savedCard" value="new" checked={selectedCardId === 'new'}
                      onChange={() => setSelectedCardId('new')} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selectedCardId === 'new' ? 'border-primary' : 'border-medium'
                    }`}>
                      {selectedCardId === 'new' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <Plus size={14} className="text-muted flex-shrink-0" />
                    <span className="text-sm text-text">Usar novo cartão</span>
                  </label>
                </div>
              ) : null}

              {(savedCards.length === 0 || selectedCardId === 'new') && (
                <>
                  <div>
                    <label className="text-xs text-muted">Número do cartão</label>
                    <input className="input-field mt-1" placeholder="0000 0000 0000 0000"
                      value={card.number}
                      onChange={e => setCard(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                      required />
                  </div>
                  <div>
                    <label className="text-xs text-muted">Nome no cartão</label>
                    <input className="input-field mt-1" placeholder="SEU NOME"
                      value={card.holder}
                      onChange={e => setCard(p => ({ ...p, holder: e.target.value.toUpperCase() }))}
                      required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted">Validade</label>
                      <input className="input-field mt-1" placeholder="MM/AA"
                        value={card.expiry}
                        onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                        required />
                    </div>
                    <div>
                      <label className="text-xs text-muted">CVV</label>
                      <input className="input-field mt-1" placeholder="123" maxLength={4}
                        value={card.cvv}
                        onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        required />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={subscribing}
                className="btn-gradient w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60">
                {subscribing
                  ? <><Loader2 size={16} className="animate-spin" /> Processando…</>
                  : <>Assinar por R$ 29,90/mês</>}
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
                <p className="text-xs text-muted">Valor: <span className="font-semibold text-text">R$ 29,90</span></p>
                <div className="rounded-xl bg-subtle flex items-center justify-center h-28 text-xs text-muted">
                  QR Code — disponível em breve
                </div>
              </div>
              <button type="button" disabled={subscribing} onClick={handlePixConfirm}
                className="btn-gradient w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60">
                {subscribing
                  ? <><Loader2 size={16} className="animate-spin" /> Processando…</>
                  : <>Confirmar pagamento via PIX — R$ 29,90</>}
              </button>
            </div>
          )}

          <p className="text-[11px] text-muted text-center leading-relaxed">
            Renovação automática a cada 30 dias. Cancele a qualquer momento pelo suporte.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Subscription success banner ───────────────────────────────────────────────
function SubscriptionBanner({ endDate }: { endDate: string }) {
  const date = new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary">
      <CheckCircle2 size={13} />
      <span>Assinatura ativa até <strong>{date}</strong></span>
    </div>
  )
}

// ── Locked placeholder (shown behind modal) ───────────────────────────────────
function LockedOverlay() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none pointer-events-none">
      <div>
        <Pill>Dashboard</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3 opacity-30">Dashboard</h1>
        <p className="text-muted text-sm mt-1 opacity-30">Visão geral da sua atividade no Pet House.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 opacity-20 blur-sm">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card p-5 h-24 flex items-center justify-center">
            <Lock size={20} className="text-muted" />
          </div>
        ))}
      </div>
      <div className="card p-8 h-40 opacity-20 blur-sm flex items-center justify-center">
        <Lock size={32} className="text-muted" />
      </div>
    </div>
  )
}

// ── Dashboard content (unlocked) ─────────────────────────────────────────────
function DashboardTutor({ subEndDate }: { subEndDate: string }) {
  interface TutorStats {
    totalSpent: number; totalReservas: number; activeReservas: number; petCount: number
  }
  const [stats, setStats] = useState<TutorStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TutorStats>('/dashboard/stats').then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Pill>Dashboard</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Visão geral da sua atividade no Pet House.</p>
      </div>
      <SubscriptionBanner endDate={subEndDate} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}   label="Gasto total"       value={loading ? '…' : `R$ ${stats?.totalSpent?.toFixed(0) ?? 0}`} sublabel="Em hospedagens" accent />
        <StatCard icon={Calendar}     label="Reservas"           value={loading ? '…' : stats?.totalReservas ?? 0}                   sublabel="Total" />
        <StatCard icon={CheckCircle2} label="Ativas"             value={loading ? '…' : stats?.activeReservas ?? 0}                  sublabel="Próximas e em andamento" />
        <StatCard icon={PawPrint}     label="Pets cadastrados"   value={loading ? '…' : stats?.petCount ?? 0}                        sublabel="No perfil" />
      </div>
      <div className="card p-8 text-center text-muted text-sm">
        Gráficos de histórico disponíveis em breve.
      </div>
    </div>
  )
}

function DashboardCuidador({ subEndDate }: { subEndDate: string }) {
  interface CuidadorStats {
    totalEarned: number; monthEarned: number; hostings: number
    activeHostings: number; rating: number; reviewCount: number; petsAttended: number
  }
  const [stats, setStats] = useState<CuidadorStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<CuidadorStats>('/dashboard/stats').then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Pill>Dashboard</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Visão geral da sua atividade como anfitrião.</p>
      </div>
      <SubscriptionBanner endDate={subEndDate} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total recebido"  value={loading ? '…' : `R$ ${stats?.totalEarned?.toFixed(0) ?? 0}`} sublabel="Em hospedagens" accent />
        <StatCard icon={Calendar}   label="Hospedagens"     value={loading ? '…' : stats?.hostings ?? 0}                         sublabel="Realizadas" />
        <StatCard icon={Star}       label="Avaliação média" value={loading ? '…' : stats?.rating?.toFixed(1) ?? '—'}             sublabel="Pelos tutores" />
        <StatCard icon={PawPrint}   label="Pets atendidos"  value={loading ? '…' : stats?.petsAttended ?? 0}                     sublabel="Histórico total" />
      </div>
      <div className="card p-8 text-center text-muted text-sm">
        Gráficos de histórico disponíveis em breve.
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const [sub, setSub] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<SubStatus>('/subscriptions/me')
      .then(setSub)
      .catch(() => setSub({ active: false, endDate: null, plan: null }))
      .finally(() => setLoading(false))
  }, [])

  const handleSubscriptionSuccess = () => {
    // Re-fetch to get the new endDate
    api.get<SubStatus>('/subscriptions/me').then(setSub).catch(() => {})
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-muted" />
      </div>
    )
  }

  const isActive = sub?.active && sub.endDate

  return (
    <>
      {isActive ? (
        user?.role === 'cuidador'
          ? <DashboardCuidador subEndDate={sub!.endDate!} />
          : <DashboardTutor   subEndDate={sub!.endDate!} />
      ) : (
        <>
          <LockedOverlay />
          <PaywallModal onSuccess={handleSubscriptionSuccess} />
        </>
      )}
    </>
  )
}
