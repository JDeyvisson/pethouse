import { useNavigate } from 'react-router-dom'
import { Bell, Sun, Moon } from 'lucide-react'
import PetHouseLogo from './PetHouseLogo'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotifications } from '../hooks/useNotifications'

export default function Topbar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { unreadCount } = useNotifications()

  return (
    <header className="fixed top-0 left-56 right-0 h-16 flex items-center justify-between px-8 bg-bg/80 backdrop-blur-sm border-b border-subtle z-20">
      <PetHouseLogo />

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          className="p-2 rounded-xl text-muted hover:text-text hover:bg-subtle transition-colors"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button
          onClick={() => navigate('/notificacoes')}
          className="relative p-2 rounded-xl text-muted hover:text-text hover:bg-subtle transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-medium hover:border-strong transition-colors"
        >
          <img
            src="https://randomuser.me/api/portraits/women/90.jpg"
            alt={user?.name ?? 'Usuário'}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-text">{user?.name ?? 'Usuário'}</span>
        </button>
      </div>
    </header>
  )
}
