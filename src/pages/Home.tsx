import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, DollarSign, Search, Star, PawPrint, ClipboardList, BadgeCheck, ChevronRight, MessageCircle } from 'lucide-react'
import StatCard from '../components/StatCard'
import Pill from '../components/Pill'
import PawPrintDecor from '../components/PawPrint'
import { useAuth } from '../context/AuthContext'
import { useReservas } from '../context/ReservasContext'
import { api } from '../lib/api'

interface TutorStats {
  activeReservas: number
  petCount: number
  avgRegionPrice: number | null
}

function HomeTutor() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const [stats, setStats] = useState<TutorStats | null>(null)

  useEffect(() => {
    api.get<TutorStats>('/dashboard/stats')
      .then(setStats)
      .catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/buscar')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <Pill>Home principal</Pill>
      </div>

      <div>
        <h1 className="font-display text-4xl font-bold text-text leading-tight">
          Bem-vindo{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted mt-2 max-w-lg">
          Encontre o anfitrião ideal para a hospedagem do seu pet com segurança e confiança.
          Cada reserva é protegida pelo selo Pet House.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Calendar}
          label="Reservas ativas"
          value={stats ? stats.activeReservas : '–'}
          sublabel="Próximas e em andamento"
          accent={!!stats && stats.activeReservas > 0}
        />
        <StatCard
          icon={PawPrint}
          label="Meus pets"
          value={stats ? stats.petCount : '–'}
          sublabel="Cadastrados na plataforma"
        />
        <StatCard
          icon={DollarSign}
          label="Preço médio"
          value={stats?.avgRegionPrice ? `R$ ${stats.avgRegionPrice}` : '–'}
          sublabel="Por diária na sua região"
        />
      </div>

      <div className="relative card p-8 overflow-hidden">
        <PawPrintDecor size={140} className="pointer-events-none absolute -bottom-8 -right-6 text-primary/5 rotate-12" />
        <Pill variant="coral">Busca inteligente</Pill>
        <h2 className="font-display text-2xl font-semibold text-text mt-3">
          Descubra o match ideal para a hospedagem do seu pet.
        </h2>
        <p className="text-muted text-sm mt-2 max-w-md">
          Use os filtros avançados para encontrar anfitriões verificados próximos de você,
          prontos para hospedar seu pet com todo cuidado.
        </p>

        <form onSubmit={handleSearch} className="flex gap-3 mt-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, bairro ou experiência..."
              className="w-full bg-surface-2 border border-medium rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button type="submit" className="btn-gradient px-8 flex items-center gap-2 whitespace-nowrap">
            <Search size={16} />
            Buscar
          </button>
        </form>
      </div>
    </div>
  )
}

interface CuidadorStats {
  totalEarned: number
  monthEarned: number
  hostings: number
  activeHostings: number
  rating: number
  reviewCount: number
  petsAttended: number
}

function HomeCuidador() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { reservas } = useReservas()
  const [stats, setStats] = useState<CuidadorStats | null>(null)

  useEffect(() => {
    api.get<CuidadorStats>('/dashboard/stats').then(setStats).catch(() => {})
  }, [])

  const emAndamento = reservas.filter(r => r.status === 'em_andamento')
  const proximas = reservas.filter(r => r.status === 'proxima')
  const nextReserva = emAndamento[0] ?? proximas[0] ?? null

  const quickActions = [
    { label: 'Minhas reservas',  desc: 'Veja sua agenda completa',    icon: ClipboardList, path: '/reservas'   },
    { label: 'Mensagens',        desc: 'Converse com os tutores',      icon: MessageCircle, path: '/chat'       },
    { label: 'Avaliações',       desc: 'Veja o que dizem sobre você',  icon: Star,          path: '/avaliacoes' },
    { label: 'Financeiro',       desc: 'Acompanhe seus ganhos',        icon: DollarSign,    path: '/financeiro' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <Pill>Painel do anfitrião</Pill>
        <h1 className="font-display text-4xl font-bold text-text mt-3 leading-tight">
          Olá{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-muted mt-2 max-w-lg">
          Aqui está um resumo da sua atividade como anfitrião.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar}   label="Em andamento"    value={emAndamento.length}                                                         sublabel="Hospedagens ativas"    accent />
        <StatCard icon={PawPrint}   label="Próximas"        value={proximas.length}                                                            sublabel="Aguardando check-in" />
        <StatCard icon={Star}       label="Avaliação média" value={stats ? (stats.rating > 0 ? stats.rating.toFixed(1) : '0') : '–'}           sublabel={stats?.reviewCount ? `${stats.reviewCount} avaliações` : 'Sem avaliações'} />
        <StatCard icon={DollarSign} label="Ganhos do mês"   value={stats ? `R$ ${stats.monthEarned.toFixed(0)}` : '–'}                        sublabel="Mês atual" />
      </div>

      {/* Next / active reservation */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <Pill variant="coral">
            {emAndamento.length > 0 ? 'Em andamento' : 'Próxima hospedagem'}
          </Pill>
          <button
            onClick={() => navigate('/reservas')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver todas <ChevronRight size={13} />
          </button>
        </div>

        {nextReserva ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <PawPrint size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text">{nextReserva.petName}</p>
              <p className="text-xs text-muted mt-0.5">{nextReserva.service}</p>
              <p className="text-xs text-muted mt-0.5">
                {new Date(nextReserva.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                {' → '}
                {new Date(nextReserva.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-text">R$ {nextReserva.price}</p>
              <p className="text-[10px] text-muted mt-0.5">valor da reserva</p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <BadgeCheck size={32} className="text-primary mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-text">Nenhuma hospedagem no momento</p>
            <p className="text-xs text-muted mt-1">Seu perfil está visível para tutores.</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 stagger-children">
        {quickActions.map(a => {
          const Icon = a.icon
          return (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="card p-5 flex items-center gap-4 text-left hover:border-primary/40 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
                <Icon size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">{a.label}</p>
                <p className="text-xs text-muted mt-0.5 truncate">{a.desc}</p>
              </div>
              <ChevronRight size={14} className="text-muted flex-shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  return user?.role === 'cuidador' ? <HomeCuidador /> : <HomeTutor />
}
