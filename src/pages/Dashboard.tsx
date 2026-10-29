import FormFeedback from '../components/FormFeedback'
import { useState, useEffect } from 'react'
import {
  DollarSign, Calendar, Star, PawPrint, CheckCircle2,
  Lock, Loader2 } from 'lucide-react'
import Pill from '../components/Pill'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

// ── Subscription types ────────────────────────────────────────────────────────
interface SubStatus { active: boolean; endDate: string | null; plan: string | null }

// ── Paywall Modal ─────────────────────────────────────────────────────────────
function PaywallModal({ onSuccess }: { onSuccess: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function activate() {
    setBusy(true); setError(null)
    try { await api.post('/subscriptions/subscribe'); onSuccess() }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível ativar.') }
    finally { setBusy(false) }
  }
  return <div className="card max-w-md mx-auto p-6 space-y-4"><h2 className="text-xl font-bold">Assinatura demonstrativa</h2><p>Teste os recursos por 30 dias. Nenhuma cobrança será realizada e nenhum cartão é necessário.</p><FormFeedback message={error} /><button className="btn-primary" disabled={busy} onClick={activate}>{busy ? 'Ativando…' : 'Ativar demonstração'}</button></div>
}

function SubscriptionBanner({ endDate }: { endDate: string }) {
  const date = new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary">
      <CheckCircle2 size={13} />
      <span>Demonstração ativa até <strong>{date}</strong></span>
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
  const [loadError, setLoadError] = useState<string | null>(null)
  interface TutorStats {
    totalSpent: number; totalReservas: number; activeReservas: number; petCount: number
  }
  const [stats, setStats] = useState<TutorStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TutorStats>('/dashboard/stats').then(setStats).catch(() => setLoadError('Não foi possível carregar os dados.')).finally(() => setLoading(false))
  }, [])

  if (loadError) return <FormFeedback message={loadError} retry={() => window.location.reload()} />
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
  const [loadError, setLoadError] = useState<string | null>(null)
  interface CuidadorStats {
    totalEarned: number; monthEarned: number; hostings: number
    activeHostings: number; rating: number; reviewCount: number; petsAttended: number
  }
  const [stats, setStats] = useState<CuidadorStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<CuidadorStats>('/dashboard/stats').then(setStats).catch(() => setLoadError('Não foi possível carregar os dados.')).finally(() => setLoading(false))
  }, [])

  if (loadError) return <FormFeedback message={loadError} retry={() => window.location.reload()} />
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const { user } = useAuth()
  const [sub, setSub] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<SubStatus>('/subscriptions/me')
      .then(setSub)
      .catch(() => setLoadError('Não foi possível consultar sua assinatura.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubscriptionSuccess = () => {
    // Re-fetch to get the new endDate
    api.get<SubStatus>('/subscriptions/me').then(setSub).catch(() => setLoadError('Não foi possível carregar os dados.'))
  }

  if (loadError) return <FormFeedback message={loadError} retry={() => window.location.reload()} />
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
