import { useNavigate } from 'react-router-dom'
import { Bell, Sun, Moon, Menu } from 'lucide-react'
import PetHouseLogo from './PetHouseLogo'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../hooks/useNotifications'

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()

  return (
    <header className="fixed top-0 left-0 lg:left-56 right-0 h-16 flex items-center justify-between px-4 sm:px-8 bg-bg/80 backdrop-blur-sm border-b border-subtle z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-muted hover:text-text hover:bg-subtle transition-colors lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <PetHouseLogo />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          className="relative p-2 rounded-xl text-muted hover:text-text hover:bg-subtle transition-colors overflow-hidden"
        >
          <Sun size={20} className={`transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50 absolute inset-0 m-auto'}`} />
          <Moon size={20} className={`transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50 absolute inset-0 m-auto'}`} />
        </button>

        <button
          onClick={() => navigate('/notificacoes')}
          className="relative p-2 rounded-xl text-muted hover:text-text hover:bg-subtle transition-colors"
        >
          <Bell size={20} className={unreadCount > 0 ? 'animate-wag' : ''} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral ring-2 ring-bg" />
          )}
        </button>

        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl bg-surface-2 border border-medium hover:border-primary/50 transition-colors group"
        >
          <img
            src="https://randomuser.me/api/portraits/women/90.jpg"
            alt={user?.name ?? 'Usuário'}
            className="w-6 h-6 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
          />
          <span className="hidden sm:inline text-sm font-medium text-text">{user?.name ?? 'Usuário'}</span>
        </button>
      </div>
    </header>
  )
}
