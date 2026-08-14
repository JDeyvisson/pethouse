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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <PetHouseLogo dark />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-display font-semibold text-gray-900 mb-1">Bem-vinda de volta</h1>
          <p className="text-sm text-gray-400 mb-8">Acesse sua conta Pet House</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="marina@email.com"
                className="mt-2 w-full border-0 border-b-2 border-gray-200 focus:border-primary pb-2 text-gray-900 placeholder-gray-300 outline-none bg-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Senha</label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-0 border-b-2 border-gray-200 focus:border-primary pb-2 text-gray-900 placeholder-gray-300 outline-none bg-transparent transition-colors pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#5E8B7E' }}
            >
              {loading ? 'Entrando…' : 'Login'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-gray-400">
            <p>
              Ainda não possui uma conta?{' '}
              <Link to="/cadastrar" className="text-primary font-medium hover:underline">
                Cadastre-se
              </Link>
            </p>
            <button className="hover:text-gray-600 transition-colors">Esqueceu sua senha?</button>
          </div>
        </div>
      </div>
    </div>
  )
}
