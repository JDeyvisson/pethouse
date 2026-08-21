import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import PetHouseLogo from '../components/PetHouseLogo'
import { useAuth, roleFromApi } from '../context/AuthContext'
import { api, ApiError } from '../lib/api'

interface LoginResponse {
  token: string
  user: { id: string; name: string; email: string; role: string }
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password })
      login(res.token, {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: roleFromApi(res.user.role),
      })
      navigate('/home')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-bg flex items-center justify-center p-4 overflow-hidden bg-paw-pattern">
      <div
        className="pointer-events-none absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(94,139,126,0.25) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(255,126,95,0.2) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="flex justify-center mb-10">
          <PetHouseLogo />
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-display font-semibold text-text mb-1">Bem-vinda de volta</h1>
          <p className="text-sm text-muted mb-8">Acesse sua conta Pet House</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="marina@email.com"
                className="mt-2 w-full border-0 border-b-2 pb-2 text-text placeholder-muted/50 outline-none bg-transparent transition-colors"
                style={{ borderColor: 'var(--border-medium)' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#5E8B7E')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wider">Senha</label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-0 border-b-2 pb-2 text-text placeholder-muted/50 outline-none bg-transparent transition-colors pr-8"
                  style={{ borderColor: 'var(--border-medium)' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#5E8B7E')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-2 text-muted hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? 'Entrando…' : 'Login'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted">
            <p>
              Ainda não possui uma conta?{' '}
              <Link to="/cadastrar" className="text-primary font-medium hover:underline">
                Cadastre-se
              </Link>
            </p>
            <button className="hover:text-text transition-colors">Esqueceu sua senha?</button>
          </div>
        </div>
      </div>
    </div>
  )
}
