import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ReservasProvider } from './context/ReservasContext'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReservasProvider>
          <RouterProvider router={router} />
        </ReservasProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
