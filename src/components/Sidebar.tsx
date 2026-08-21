import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, Search, Calendar, MessageCircle, PawPrint as PawIcon,
  DollarSign, Star, User, Settings, BarChart2, LogOut, Building2, X,
} from 'lucide-react'
import { useAuth, type UserRole } from '../context/AuthContext'
import PawPrint from './PawPrint'

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
  { to: '/meus-pets',     label: 'Meus Pets',     icon: PawIcon,       allowedRoles: ['tutor'] },
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

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const role = user?.role ?? 'tutor'

  const visibleItems = navItems.filter(item => item.allowedRoles.includes(role))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`fixed left-0 top-0 h-screen w-64 lg:w-56 flex flex-col py-6 px-3 bg-surface border-r border-subtle z-40
          transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-2 mb-2 lg:hidden">
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">Menu</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-subtle transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-muted hover:text-text hover:bg-subtle'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Account card */}
        <div className="relative mt-4 mx-1 rounded-2xl p-4 text-white overflow-hidden bg-coral">
          <PawPrint size={64} color="white" className="absolute -bottom-3 -right-3 opacity-15 rotate-12" />
          <p className="relative text-[10px] font-semibold tracking-widest opacity-80 uppercase mb-1">Conta Atual</p>
          <p className="relative font-bold text-sm truncate">{user?.name ?? 'Usuário'}</p>
          <p className="relative text-xs opacity-75">{roleLabels[role]}</p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-3 mx-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-strong text-muted hover:text-text hover:border-accent transition-colors text-sm"
        >
          <LogOut size={16} />
          Sair
        </button>
      </aside>
    </>
  )
}
