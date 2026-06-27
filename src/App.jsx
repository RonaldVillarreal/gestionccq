import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'

import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import Alumnos from './pages/Alumnos'
import Maestros from './pages/Maestros'
import Representantes from './pages/Representantes'
import Personal from './pages/Personal'
import Administrativo from './pages/Administrativo'

import MaestroLayout from './components/MaestroLayout'
import MaestroDashboard from './pages/maestro/MaestroDashboard'
import MiGrado from './pages/maestro/MiGrado'
import Planificacion from './pages/maestro/Planificacion'
import Boletas from './pages/maestro/Boletas'
import Calificaciones from './pages/maestro/Calificaciones'

import Aprobador from './pages/Aprobador'

/* Ruta a la que pertenece cada rol */
const HOME = { admin: '/admin', maestro: '/maestro', aprobador: '/aprobador' }

/* Guardia: exige sesión y (opcional) un rol concreto.
   Si el rol no coincide, redirige al home del rol del usuario. */
function Protected ({ rol, children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/" replace state={{ from: location }} />
  if (rol && user.rol !== rol) return <Navigate to={HOME[user.rol] || '/'} replace />
  return children
}

export default function App () {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Login: si ya hay sesión, manda al home del rol */}
      <Route
        path="/"
        element={user ? <Navigate to={HOME[user.rol] || '/'} replace /> : <Login />}
      />

      {/* Panel administrativo */}
      <Route
        path="/admin"
        element={<Protected rol="admin"><AdminLayout /></Protected>}
      >
        <Route index element={<Dashboard />} />
        <Route path="alumnos" element={<Alumnos />} />
        <Route path="maestros" element={<Maestros />} />
        <Route path="representantes" element={<Representantes />} />
        <Route path="personal" element={<Personal />} />
        <Route path="administrativo" element={<Administrativo />} />
      </Route>

      {/* Portal del maestro */}
      <Route
        path="/maestro"
        element={<Protected rol="maestro"><MaestroLayout /></Protected>}
      >
        <Route index element={<MaestroDashboard />} />
        <Route path="mi-grado" element={<MiGrado />} />
        <Route path="planificacion" element={<Planificacion />} />
        <Route path="boletas" element={<Boletas />} />
        <Route path="calificaciones" element={<Calificaciones />} />
      </Route>

      {/* Portal del aprobador */}
      <Route
        path="/aprobador"
        element={<Protected rol="aprobador"><Aprobador /></Protected>}
      />

      {/* Cualquier otra ruta vuelve al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
