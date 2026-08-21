import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Send, Search, Lock, MessageCircle } from 'lucide-react'
import { useReservas } from '../context/ReservasContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import Pill from '../components/Pill'
import EmptyState from '../components/EmptyState'

interface ApiMessage {
  id: string
  text: string
  senderId: string
  sender: { id: string; name: string }
  createdAt: string
}

interface Contact {
  id: string
  displayName: string
  initials: string
  reservaId: string
  locked: boolean
}

function toInitials(name: string) {
  const words = name.trim().split(/\s+/)
  return (words.length >= 2 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase()
}

export default function Chat() {
  const { reservas, loading } = useReservas()
  const { user } = useAuth()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ApiMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isCuidador = user?.role === 'cuidador'

  const contacts = useMemo<Contact[]>(() => {
    const seen = new Map<string, Contact>()

    for (const r of reservas) {
      const isActive = r.status === 'proxima' || r.status === 'em_andamento'

      if (isCuidador) {
        const name = r.tutorName ?? ''
        if (!name) continue
        const key = name
        if (!seen.has(key) || isActive) {
          seen.set(key, {
            id: `conv-${r.id}`,
            displayName: name,
            initials: toInitials(name),
            reservaId: r.id,
            locked: !isActive,
          })
        }
      } else {
        const name = r.sitterName
        if (!name) continue
        const key = name
        if (!seen.has(key) || isActive) {
          seen.set(key, {
            id: `conv-${r.id}`,
            displayName: name,
            initials: toInitials(name),
            reservaId: r.id,
            locked: !isActive,
          })
        }
      }
    }

    return [...seen.values()]
  }, [reservas, isCuidador])

  const filtered = search.trim()
    ? contacts.filter(c => c.displayName.toLowerCase().includes(search.toLowerCase()))
    : contacts

  const active = contacts.find(c => c.id === activeId) ?? null

  // Fetch messages for active contact
  const fetchMessages = useCallback(async (reservaId: string) => {
    try {
      const msgs = await api.get<ApiMessage[]>(`/messages/${reservaId}`)
      setMessages(msgs)
    } catch { /* ignore */ }
  }, [])

  // Auto-select first contact
  useEffect(() => {
    if (!activeId && contacts.length > 0) setActiveId(contacts[0].id)
  }, [contacts, activeId])

  // Load + poll messages when active contact changes
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (!active) return

    fetchMessages(active.reservaId)
    pollRef.current = setInterval(() => fetchMessages(active.reservaId), 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [active?.reservaId, fetchMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || active?.locked || !active || sending) return
    setSending(true)
    setSendError(null)
    try {
      const msg = await api.post<ApiMessage>('/messages', {
        reservaId: active.reservaId,
        text: newMessage.trim(),
      })
      setMessages(prev => [...prev, msg])
      setNewMessage('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
      setSendError(msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <Pill>Chat</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Mensagens</h1>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-muted text-sm">Carregando…</div>
      ) : contacts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={MessageCircle}
            title="Nenhuma conversa ainda"
            description={`As conversas aparecem quando você tem reservas com ${isCuidador ? 'tutores' : 'anfitriões'}.`}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 md:h-[calc(100vh-280px)]">
          {/* Contacts list */}
          <div className="card overflow-hidden flex flex-col h-[360px] md:h-auto">
            <div className="p-4 border-b border-subtle">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar conversa..."
                  className="w-full bg-surface-2 border border-medium rounded-xl pl-9 pr-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(c => {
                const lastMsg = activeId === c.id ? messages[messages.length - 1] : undefined
                return (
                  <button
                    key={c.id}
                    onClick={() => { setActiveId(c.id); setMessages([]) }}
                    className={`w-full flex gap-3 p-4 text-left transition-colors border-b border-l-2 border-subtle last:border-b-0 ${
                      activeId === c.id
                        ? 'bg-primary/10 border-l-primary'
                        : 'border-l-transparent hover:bg-subtle'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {c.initials}
                      </div>
                      {c.locked && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface border border-medium flex items-center justify-center">
                          <Lock size={8} className="text-muted" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate font-medium ${activeId === c.id ? 'text-text font-semibold' : 'text-text'}`}>
                        {c.displayName}
                      </p>
                      <p className="text-xs truncate mt-0.5 text-muted">
                        {lastMsg ? lastMsg.text : (c.locked ? 'Chat encerrado' : 'Inicie a conversa')}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Messages panel */}
          {active ? (
            <div className="card flex flex-col overflow-hidden h-[480px] md:h-auto">
              <div className="flex items-center gap-3 p-4 border-b border-subtle">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {active.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{active.displayName}</p>
                  {active.locked
                    ? <p className="text-xs text-muted">Chat encerrado</p>
                    : <p className="text-xs text-primary">Disponível</p>
                  }
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && !active.locked && (
                  <p className="text-center text-xs text-muted pt-8">
                    Nenhuma mensagem ainda. Diga olá para {active.displayName}!
                  </p>
                )}
                {messages.map(msg => {
                  const isMe = msg.senderId === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                          isMe ? 'bg-coral text-white rounded-tr-sm' : 'bg-surface-2 text-text rounded-tl-sm'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70 text-right' : 'text-muted'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {active.locked && (
                <div className="px-4 py-2.5 border-t border-subtle bg-yellow-400/10 flex items-center gap-2">
                  <Lock size={13} className="text-yellow-500 flex-shrink-0" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Chat disponível apenas durante reservas ativas (Próxima ou Em andamento).
                  </p>
                </div>
              )}

              {sendError && (
                <p className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border-t border-subtle">
                  {sendError}
                </p>
              )}

              <form onSubmit={sendMessage} className="flex gap-3 p-4 border-t border-subtle">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={active.locked ? 'Chat encerrado para esta reserva' : 'Digite sua mensagem...'}
                  disabled={active.locked || sending}
                  className="flex-1 bg-surface-2 border border-medium rounded-xl px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={active.locked || sending}
                  className="p-2.5 rounded-xl bg-coral hover:brightness-105 active:scale-95 text-white flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
