import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, Search, Calendar, MessageCircle, PawPrint,
  DollarSign, Star, User, Settings, BarChart2, LogOut, Building2
} from 'lucide-react'
import { useAuth, type UserRole } from '../context/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
  allowedRoles: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/home',          label: 'Home',          icon: Home,          allowedRoles: ['tutor', 'cuidador'] },
  { to: '/buscar',        label: 'Buscar',        icon: Search,        allowedRoles: ['tutor'] },
  { to: '/reservas',      label: 'Reservas',      icon: Calendar,      allowedRoles: ['tutor', 'cuidador'] },
  { to: '/chat',          label: 'Chat',          icon: MessageCircle, allowedRoles: ['tutor', 'cuidador'] },
  { to: '/meus-pets',     label: 'Meus Pets',     icon: PawPrint,      allowedRoles: ['tutor'] },
  { to: '/financeiro',    label: 'Financeiro',    icon: DollarSign,    allowedRoles: ['cuidador'] },
  { to: '/meu-espaco',   label: 'Meu Espaço',   icon: Building2,     allowedRoles: ['cuidador'] },
  { to: '/avaliacoes',    label: 'Avaliações',    icon: Star,          allowedRoles: ['tutor', 'cuidador'] },
  { to: '/perfil',        label: 'Perfil',        icon: User,          allowedRoles: ['tutor', 'cuidador'] },
  { to: '/configuracoes', label: 'Configurações', icon: Settings,      allowedRoles: ['tutor', 'cuidador'] },
  { to: '/dashboard',     label: 'Dashboard',     icon: BarChart2,     allowedRoles: ['tutor', 'cuidador'] },
]

const roleLabels: Record<UserRole, string> = {
  tutor: 'Tutor',
  cuidador: 'Anfitrião',
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const role = user?.role ?? 'tutor'

  const visibleItems = navItems.filter(item => item.allowedRoles.includes(role))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col py-6 px-3 bg-surface border-r border-subtle z-30">
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900'
                  : 'text-muted hover:text-text hover:bg-subtle'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Account card */}
      <div className="mt-4 mx-1 rounded-2xl p-4 text-white" style={{ backgroundColor: '#FF7E5F' }}>
        <p className="text-[10px] font-semibold tracking-widest opacity-80 uppercase mb-1">Conta Atual</p>
        <p className="font-bold text-sm truncate">{user?.name ?? 'Usuário'}</p>
        <p className="text-xs opacity-75">{roleLabels[role]}</p>
      </div>

      <button
        onClick={handleLogout}
        className="mt-3 mx-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-strong text-muted hover:text-text hover:border-accent text-sm transition-colors"
      >
        <LogOut size={16} />
        Sair
      </button>
    </aside>
  )
}
