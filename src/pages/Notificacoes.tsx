import { Bell, Calendar, Star, CheckCheck } from 'lucide-react'
import Pill from '../components/Pill'
import { useNotifications, type NotificationType, type NotificationGroup } from '../hooks/useNotifications'

const typeConfig = {
  reserva:  { icon: Calendar, color: 'text-blue-400 bg-blue-400/10' },
  avaliacao: { icon: Star,    color: 'text-yellow-400 bg-yellow-400/10' },
  sistema:  { icon: Bell,     color: 'text-muted bg-subtle' },
} satisfies Record<NotificationType, { icon: typeof Bell; color: string }>

const groupLabels: Record<NotificationGroup, string> = {
  hoje: 'Hoje',
  esta_semana: 'Esta semana',
  anteriores: 'Anteriores',
}

const groupOrder: NotificationGroup[] = ['hoje', 'esta_semana', 'anteriores']

export default function Notificacoes() {
  const { notifications, unreadCount, markRead, markAllRead, loading, readIds } = useNotifications()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Pill>Notificações</Pill>
          <h1 className="font-display text-3xl font-bold text-text mt-3">Notificações</h1>
          {unreadCount > 0 && <p className="text-muted text-sm mt-1">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</p>}
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
        >
          <CheckCheck size={13} />
          Marcar todas como lidas
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-muted text-sm">Carregando…</div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={32} className="text-muted mx-auto mb-3 opacity-40" />
          <p className="text-muted text-sm">Você não tem notificações.</p>
        </div>
      ) : (
        groupOrder.map(group => {
          const items = notifications.filter(n => n.group === group)
          if (items.length === 0) return null
          return (
            <div key={group}>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">{groupLabels[group]}</p>
              <div className="space-y-2">
                {items.map(n => {
                  const { icon: Icon, color } = typeConfig[n.type]
                  const unread = !readIds.has(n.id)
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full card p-4 flex gap-4 text-left transition-all hover:border-strong ${
                        unread ? 'border-primary/25 bg-primary/[0.03]' : ''
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl flex-shrink-0 h-fit ${color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${unread ? 'text-text' : 'text-muted'}`}>{n.title}</p>
                          <p className="text-[10px] text-muted flex-shrink-0">{n.time}</p>
                        </div>
                        <p className="text-xs text-muted mt-0.5 leading-relaxed">{n.body}</p>
                      </div>
                      {unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
