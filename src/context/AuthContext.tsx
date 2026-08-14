import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type UserRole = 'tutor' | 'cuidador'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

interface AuthContextValue {
  user: AuthUser | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function roleFromApi(r: string): UserRole {
  return r === 'CUIDADOR' ? 'cuidador' : 'tutor'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('ph_token')
    const stored = localStorage.getItem('ph_user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser)
      } catch { /* ignore corrupt data */ }
    }
    setReady(true)
  }, [])

  function login(token: string, u: AuthUser) {
    localStorage.setItem('ph_token', token)
    localStorage.setItem('ph_user', JSON.stringify(u))
    setUser(u)
  }

  function logout() {
    localStorage.removeItem('ph_token')
    localStorage.removeItem('ph_user')
    setUser(null)
  }

  if (!ready) return null

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { roleFromApi }
