import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useInstitucion } from './context/InstitucionContext'
import { DEFAULT_TENANT } from './lib/db'
import { rutaLogin } from './lib/instituciones'

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
import MaestroTareas from './pages/maestro/Tareas'
import MaestroBiblioteca from './pages/maestro/Biblioteca'
import Fichas from './pages/maestro/Fichas'

import AlumnoLayout from './components/AlumnoLayout'
import AlumnoInicio from './pages/alumno/AlumnoInicio'
import MisTareas from './pages/alumno/MisTareas'
import Biblioteca from './pages/alumno/Biblioteca'
import Logros from './pages/alumno/Logros'

import Bandeja from './pages/Bandeja'

import AdministradoraLayout from './components/AdministradoraLayout'
import AdminvaInicio from './pages/administradora/AdminvaInicio'
import Cobranzas from './pages/administradora/Cobranzas'
import Facturacion from './pages/administradora/Facturacion'

import Aprobador from './pages/Aprobador'

import { SuperAdminProvider, useSuperAdmin } from './context/SuperAdminContext'
import SuperLogin from './pages/superadmin/SuperLogin'
import SuperPanel from './pages/superadmin/SuperPanel'

/* Ruta a la que pertenece cada rol */
const HOME = { admin: '/admin', maestro: '/maestro', aprobador: '/aprobador', alumno: '/alumno', administradora: '/administracion' }

/* Guardia: exige sesión y (opcional) un rol concreto.
   Si el rol no coincide, redirige al home del rol del usuario. */
function Protected ({ rol, children }) {
  const { user } = useAuth()
  const { slug, info } = useInstitucion()
  const location = useLocation()
  if (!user) return <Navigate to={rutaLogin(slug)} replace state={{ from: location }} />
  // Si el Super Admin desactiva el sistema, se bloquea también a quien ya tenía sesión.
  if (info?.estado === 'inactivo') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Sistema desactivado</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 8 }}>Contacta al administrador de la plataforma.</p>
        </div>
      </div>
    )
  }
  if (rol && user.rol !== rol) return <Navigate to={HOME[user.rol] || '/'} replace />
  return children
}

/* Login de una institución: "/" es la principal, "/i/:slug" las demás.
   Si ya hay sesión en esa misma institución, manda al home del rol.    */
function LoginRoute () {
  const { user, logout } = useAuth()
  const { slug, setSlug } = useInstitucion()
  const destino = useParams().slug?.toLowerCase() || DEFAULT_TENANT
  const otraInstitucion = Boolean(user) && (user.institucion || DEFAULT_TENANT) !== destino

  useEffect(() => {
    if (otraInstitucion) logout()
    if (slug !== destino) setSlug(destino)
  }, [destino, otraInstitucion]) // eslint-disable-line react-hooks/exhaustive-deps

  if (slug !== destino || otraInstitucion) return null
  if (user) return <Navigate to={HOME[user.rol] || '/'} replace />
  return <Login />
}

function SuperProtected ({ children }) {
  const { activo, cargando } = useSuperAdmin()
  if (cargando) return null
  return activo ? children : <Navigate to="/superadmin" replace />
}

export default function App () {
  return (
    <Routes>
      <Route path="/" element={<LoginRoute />} />
      <Route path="/i/:slug" element={<LoginRoute />} />

      {/* Super Admin: gestiona todos los sistemas (instituciones) */}
      <Route path="/superadmin/*" element={
        <SuperAdminProvider>
          <Routes>
            <Route index element={<SuperLogin />} />
            <Route path="panel" element={<SuperProtected><SuperPanel /></SuperProtected>} />
            <Route path="*" element={<Navigate to="/superadmin" replace />} />
          </Routes>
        </SuperAdminProvider>
      } />

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
        <Route path="tareas" element={<MaestroTareas />} />
        <Route path="bandeja" element={<Bandeja />} />
        <Route path="biblioteca" element={<MaestroBiblioteca />} />
        <Route path="planificacion" element={<Planificacion />} />
        <Route path="fichas" element={<Fichas />} />
        <Route path="boletas" element={<Boletas />} />
        <Route path="calificaciones" element={<Calificaciones />} />
      </Route>

      {/* Portal del alumno */}
      <Route
        path="/alumno"
        element={<Protected rol="alumno"><AlumnoLayout /></Protected>}
      >
        <Route index element={<AlumnoInicio />} />
        <Route path="tareas" element={<MisTareas />} />
        <Route path="bandeja" element={<Bandeja />} />
        <Route path="biblioteca" element={<Biblioteca />} />
        <Route path="logros" element={<Logros />} />
      </Route>

      {/* Portal de la administradora */}
      <Route
        path="/administracion"
        element={<Protected rol="administradora"><AdministradoraLayout /></Protected>}
      >
        <Route index element={<AdminvaInicio />} />
        <Route path="cobranzas" element={<Cobranzas />} />
        <Route path="facturacion" element={<Facturacion />} />
        <Route path="alumnos" element={<Alumnos />} />
        <Route path="representantes" element={<Representantes />} />
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
