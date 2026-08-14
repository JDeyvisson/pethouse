import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Cadastrar from './pages/Cadastrar'
import CadastroAnfitriao from './pages/CadastroAnfitriao'
import Home from './pages/Home'
import Buscar from './pages/Buscar'
import PerfilSitter from './pages/PerfilSitter'
import Reservas from './pages/Reservas'
import Chat from './pages/Chat'
import MeusPets from './pages/MeusPets'
import CadastroPet from './pages/CadastroPet'
import Avaliacoes from './pages/Avaliacoes'
import Notificacoes from './pages/Notificacoes'
import Perfil from './pages/Perfil'
import Configuracoes from './pages/Configuracoes'
import Financeiro from './pages/Financeiro'
import PerfilAnfitriao from './pages/PerfilAnfitriao'
import Dashboard from './pages/Dashboard'
import { useAuth, type UserRole } from './context/AuthContext'

function RoleGuard({ forbiddenFor }: { forbiddenFor: UserRole[] }) {
  const { user } = useAuth()
  if (user && forbiddenFor.includes(user.role)) {
    return <Navigate to="/home" replace />
  }
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/cadastrar',
    element: <Cadastrar />,
  },
  {
    path: '/cadastro-anfitriao',
    element: <CadastroAnfitriao />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/home',              element: <Home /> },
      { path: '/reservas',          element: <Reservas /> },
      { path: '/chat',              element: <Chat /> },
      { path: '/avaliacoes',        element: <Avaliacoes /> },
      { path: '/notificacoes',      element: <Notificacoes /> },
      { path: '/perfil',            element: <Perfil /> },
      { path: '/configuracoes',     element: <Configuracoes /> },
      { path: '/dashboard',         element: <Dashboard /> },

      // Tutor-only routes
      {
        element: <RoleGuard forbiddenFor={['cuidador']} />,
        children: [
          { path: '/buscar',              element: <Buscar /> },
          { path: '/perfil-sitter/:id',   element: <PerfilSitter /> },
          { path: '/meus-pets',           element: <MeusPets /> },
          { path: '/meus-pets/novo',      element: <CadastroPet /> },
          { path: '/editar-pet/:id',      element: <CadastroPet /> },
        ],
      },

      // Cuidador-only routes
      {
        element: <RoleGuard forbiddenFor={['tutor']} />,
        children: [
          { path: '/financeiro',      element: <Financeiro /> },
          { path: '/meu-espaco',      element: <PerfilAnfitriao /> },
        ],
      },
    ],
  },
])
