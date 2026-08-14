import { Link, Navigate } from 'react-router-dom'
import { ShieldCheck, CalendarCheck, Star, PawPrint, Home, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PetHouseLogo from '../components/PetHouseLogo'

export default function Landing() {
  const { user } = useAuth()
  if (user) return <Navigate to="/home" replace />

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">

      {/* Navbar */}
      <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur border-b border-subtle">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <PetHouseLogo />
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-outline py-2 px-4 text-sm">Entrar</Link>
            <Link to="/cadastrar" className="btn-primary py-2 px-4 text-sm">Cadastrar</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
          <PawPrint size={12} />
          Hospedagem de pets com quem você pode confiar
        </div>

        <h1 className="font-display text-5xl font-bold text-text leading-tight max-w-2xl mb-5">
          Seu pet merece o<br />
          <span className="text-primary">melhor cuidado</span>
        </h1>

        <p className="text-muted text-lg max-w-md mb-10">
          Conectamos tutores a anfitriões verificados que tratam seu pet como parte da família.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/cadastrar"
            className="flex items-center gap-2 btn-primary text-base py-3 px-7"
          >
            Sou tutor <ArrowRight size={16} />
          </Link>
          <Link
            to="/cadastro-anfitriao"
            className="flex items-center gap-2 btn-outline text-base py-3 px-7"
          >
            Quero ser anfitrião <Home size={16} />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <ShieldCheck size={22} className="text-primary" />,
              title: 'Anfitriões verificados',
              desc: 'Todos os anfitriões passam por verificação de identidade antes de receber pets.',
            },
            {
              icon: <CalendarCheck size={22} className="text-primary" />,
              title: 'Reserva simplificada',
              desc: 'Escolha as datas, selecione o anfitrião e confirme em menos de 2 minutos.',
            },
            {
              icon: <Star size={22} className="text-primary" />,
              title: 'Avaliações reais',
              desc: 'Leia avaliações de tutores que já usaram o serviço e escolha com segurança.',
            },
          ].map(f => (
            <div key={f.title} className="card p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {f.icon}
              </div>
              <p className="font-semibold text-text">{f.title}</p>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Two flows */}
      <section className="max-w-5xl mx-auto px-6 pb-24 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <PawPrint size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-text mb-1">Sou tutor</p>
              <p className="text-sm text-muted leading-relaxed">
                Encontre um anfitrião próximo, veja avaliações e faça a reserva com segurança.
              </p>
            </div>
            <Link to="/cadastrar" className="btn-primary text-center text-sm py-2.5">
              Criar conta de tutor
            </Link>
          </div>

          <div className="card p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 flex items-center justify-center">
              <Home size={24} className="text-coral" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-text mb-1">Sou anfitrião</p>
              <p className="text-sm text-muted leading-relaxed">
                Abra seu espaço para pets, defina sua disponibilidade e ganhe uma renda extra.
              </p>
            </div>
            <Link
              to="/cadastro-anfitriao"
              className="text-center text-sm py-2.5 rounded-xl font-semibold transition-colors text-white"
              style={{ backgroundColor: '#FF7E5F' }}
            >
              Criar conta de anfitrião
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-subtle py-6 text-center text-xs text-muted">
        Pet House © {new Date().getFullYear()} · pet.house.digipet@gmail.com
      </footer>
    </div>
  )
}
