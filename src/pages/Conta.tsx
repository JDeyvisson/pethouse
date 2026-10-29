import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import FormFeedback from '../components/FormFeedback'

export default function Conta() {
  const { user, logout } = useAuth()
  const query = new URLSearchParams(window.location.search)
  const purpose = query.get('purpose') === 'verify' ? 'verify' : 'reset'
  const token = query.get('token')
  const change = query.get('purpose') === 'change' && !!user
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setMessage(null); setPreview('')
    if ((change || (token && purpose === 'reset')) && password !== confirm) { setMessage('As senhas não coincidem.'); return }
    setBusy(true)
    try {
      const result = await api.post<{ message: string; previewPath?: string }>(change ? '/auth/change-password' : token ? '/auth/consume-email' : '/auth/request-email', change ? { currentPassword, password } : token ? { token, ...(purpose === 'reset' ? { password } : {}) } : { email, purpose })
      setMessage(result.message); setPreview(result.previewPath ?? '')
      if (change || token) { setDone(true); if (change || purpose === 'reset') logout() }
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Não foi possível concluir.') }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-bg p-6 text-text"><div className="card max-w-md mx-auto p-6 space-y-4">
    <Link to={user ? '/perfil' : '/login'} className="text-primary underline">Voltar</Link>
    <h1 className="text-2xl font-bold">{change ? 'Alterar senha' : purpose === 'verify' ? 'Verificação de e-mail' : 'Recuperar senha'}</h1>
    {!change && <p className="text-sm text-muted">Demonstração: nenhum e-mail real é enviado. A prévia permite testar o fluxo e não comprova a posse do endereço.</p>}
    <FormFeedback message={message} />
    {preview && <Link to={preview} reloadDocument className="block text-primary underline">Abrir prévia do e-mail demonstrativo</Link>}
    {!done && <form onSubmit={submit} className="space-y-4">
      {!change && !token && <label className="block">E-mail<input className="input-field mt-2" type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>}
      {change && <label className="block">Senha atual<input className="input-field mt-2" type="password" required autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>}
      {(change || (token && purpose === 'reset')) && <>
        <label className="block">Nova senha<input className="input-field mt-2" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label className="block">Confirmar senha<input className="input-field mt-2" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
      </>}
      <button className="btn-primary" disabled={busy}>{busy ? 'Aguarde…' : change ? 'Alterar senha' : token ? 'Concluir demonstração' : 'Gerar e-mail demonstrativo'}</button>
    </form>}
    {done && <Link to="/login" className="text-primary underline">Fazer login</Link>}
  </div></main>
}
