import { useState, useRef, useEffect } from 'react'
import { Shield, CreditCard, Plus, Check, Save, Camera, X, Loader2 } from 'lucide-react'
import Pill from '../components/Pill'
import { useAuth } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'

interface PaymentCard { id: string; brand: string; last4: string; expiry: string; holder?: string | null }

interface TutorStats { totalReservas: number; petCount: number }
interface CuidadorStats { hostings: number }

function Initials({ name, size = 20 }: { name: string; size?: number }) {
  const words = name.trim().split(/\s+/)
  const letters = words.length >= 2
    ? words[0][0] + words[words.length - 1][0]
    : (words[0] ?? '?').slice(0, 2)
  return (
    <div
      className="rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {letters.toUpperCase()}
    </div>
  )
}

export default function Perfil() {
  const { user, login } = useAuth()
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api', '') ?? 'http://localhost:3001'


  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [cardForm, setCardForm] = useState({ brand: '', last4: '', expiry: '', holder: '' })
  const [cardSaving, setCardSaving] = useState(false)

  const [stats, setStats] = useState<TutorStats | CuidadorStats | null>(null)

  useEffect(() => {
    api.get<{ name: string; email: string; phone?: string | null; photoUrl?: string | null }>('/users/me')
      .then(u => {
        setForm({ name: u.name, email: u.email, phone: u.phone ?? '' })
        if (u.photoUrl) setProfilePhoto(`${BASE}${u.photoUrl}`)
      })
      .catch(() => {})
  }, [BASE])

  useEffect(() => {
    api.get<TutorStats | CuidadorStats>('/dashboard/stats')
      .then(setStats)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user?.role === 'cuidador') return
    setCardsLoading(true)
    api.get<PaymentCard[]>('/payment-cards')
      .then(setPaymentCards)
      .catch(() => {})
      .finally(() => setCardsLoading(false))
  }, [user?.role])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfilePhoto(URL.createObjectURL(file))
    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const res = await api.upload<{ photoUrl: string }>('/users/me/photo', fd, 'PATCH')
      setProfilePhoto(`${BASE}${res.photoUrl}`)
    } catch {
      // preview stays; error is silent — photo will revert on next load
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
    setSaveError(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      const updated = await api.patch<{ id: string; name: string; email: string; role: string; phone?: string | null }>('/users/me', {
        name: form.name,
        phone: form.phone || undefined,
      })
      setForm(prev => ({ ...prev, name: updated.name, phone: updated.phone ?? '' }))
      // Update cached auth user so sidebar name refreshes
      if (user) {
        login(localStorage.getItem('ph_token')!, {
          id: user.id,
          name: updated.name,
          email: user.email,
          role: user.role,
        })
      }
      setSaved(true)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cardForm.last4.length !== 4) return
    setCardSaving(true)
    try {
      const card = await api.post<PaymentCard>('/payment-cards', {
        brand: cardForm.brand,
        last4: cardForm.last4,
        expiry: cardForm.expiry,
        holder: cardForm.holder || undefined,
      })
      setPaymentCards(prev => [card, ...prev])
      setCardForm({ brand: '', last4: '', expiry: '', holder: '' })
      setShowAddCard(false)
    } catch { /* ignore */ } finally {
      setCardSaving(false)
    }
  }

  const handleRemoveCard = async (id: string) => {
    try {
      await api.delete(`/payment-cards/${id}`)
      setPaymentCards(prev => prev.filter(c => c.id !== id))
    } catch { /* ignore */ }
  }

  const roleLabel = user?.role === 'cuidador' ? 'Anfitrião' : 'Tutor'

  const tutorStats = user?.role !== 'cuidador' && stats
    ? (stats as TutorStats)
    : null
  const cuidadorStats = user?.role === 'cuidador' && stats
    ? (stats as CuidadorStats)
    : null

  const statsGrid = user?.role === 'cuidador'
    ? [{ label: 'Total de hospedagens', value: cuidadorStats ? String(cuidadorStats.hostings) : '–' }]
    : [
        { label: 'Total de reservas',   value: tutorStats ? String(tutorStats.totalReservas) : '–' },
        { label: 'Pets cadastrados',    value: tutorStats ? String(tutorStats.petCount) : '–' },
      ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Pill>Perfil pessoal</Pill>
        <h1 className="font-display text-3xl font-bold text-text mt-3">Meu Perfil</h1>
        <p className="text-muted text-sm mt-1">Gerencie suas informações pessoais.</p>
      </div>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex gap-5">
          <div className="relative flex-shrink-0">
            {profilePhoto ? (
              <img src={profilePhoto} alt={form.name} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <Initials name={form.name || '?'} size={80} />
            )}
            <label className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-primary text-white shadow cursor-pointer hover:opacity-90 transition-opacity ${photoUploading ? 'opacity-60 pointer-events-none' : ''}`}>
              {photoUploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              <input ref={photoInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={photoUploading} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">{form.name}</h2>
            <p className="text-sm text-muted">{form.email}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Pill variant="active">{roleLabel}</Pill>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                Conta verificada
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${statsGrid.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {statsGrid.map(s => (
          <div key={s.label} className="card p-5 text-center">
            <p className="text-3xl font-bold text-text">{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Dados pessoais */}
      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <p className="font-semibold text-text text-sm">Dados pessoais</p>

        {saveError && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{saveError}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Nome completo</label>
            <input name="name" type="text" value={form.name} onChange={handleChange} className="input-field mt-2" required />
          </div>
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Email</label>
            <input name="email" type="email" value={form.email} className="input-field mt-2 opacity-60 cursor-not-allowed" readOnly />
          </div>
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Telefone</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="input-field mt-2" placeholder="(11) 99999-8888" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Check size={13} /> Alterações salvas
            </span>
          )}
          <button type="submit" disabled={saving} className="btn-gradient flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </form>

      {/* Métodos de pagamento — apenas tutores */}
      {user?.role !== 'cuidador' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-primary" />
              <p className="font-semibold text-text text-sm">Métodos de pagamento</p>
            </div>
            <button onClick={() => setShowAddCard(v => !v)} className="flex items-center gap-1 text-xs text-primary hover:underline">
              {showAddCard ? <X size={13} /> : <Plus size={13} />}
              {showAddCard ? 'Cancelar' : 'Adicionar cartão'}
            </button>
          </div>

          {showAddCard && (
            <form onSubmit={handleAddCard} className="mb-4 p-4 rounded-xl bg-subtle space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted">Bandeira</label>
                  <select value={cardForm.brand} onChange={e => setCardForm(p => ({ ...p, brand: e.target.value }))} className="input-field mt-1" required>
                    <option value="">Selecione</option>
                    <option>Visa</option><option>Mastercard</option><option>Elo</option><option>Amex</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted">Últimos 4 dígitos</label>
                  <input type="text" maxLength={4} pattern="\d{4}" value={cardForm.last4}
                    onChange={e => setCardForm(p => ({ ...p, last4: e.target.value.replace(/\D/g, '') }))}
                    className="input-field mt-1" placeholder="0000" required />
                </div>
                <div>
                  <label className="text-xs text-muted">Validade (MM/AA)</label>
                  <input type="text" maxLength={5} value={cardForm.expiry}
                    onChange={e => setCardForm(p => ({ ...p, expiry: e.target.value }))}
                    className="input-field mt-1" placeholder="12/29" required />
                </div>
                <div>
                  <label className="text-xs text-muted">Nome no cartão</label>
                  <input type="text" value={cardForm.holder}
                    onChange={e => setCardForm(p => ({ ...p, holder: e.target.value }))}
                    className="input-field mt-1" placeholder="Opcional" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={cardSaving} className="btn-gradient flex items-center gap-2 text-sm">
                  {cardSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Salvar cartão
                </button>
              </div>
            </form>
          )}

          {cardsLoading ? (
            <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-muted" /></div>
          ) : paymentCards.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">Nenhum cartão cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {paymentCards.map(pm => (
                <div key={pm.id} className="flex items-center justify-between py-3 border-b border-subtle last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-subtle"><CreditCard size={16} className="text-muted" /></div>
                    <div>
                      <p className="text-sm text-text">{pm.brand} •••• {pm.last4}</p>
                      <p className="text-xs text-muted">Validade {pm.expiry}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveCard(pm.id)} className="text-xs text-muted hover:text-red-500 transition-colors">Remover</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Segurança */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-primary" />
          <p className="font-semibold text-text text-sm">Segurança</p>
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm text-text">Alterar senha</p>
            <p className="text-xs text-muted">Mantenha sua conta segura com uma senha forte</p>
          </div>
          <button className="text-xs text-primary hover:underline">Configurar</button>
        </div>
      </div>
    </div>
  )
}
