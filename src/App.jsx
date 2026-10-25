import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useInstitucion } from './context/InstitucionContext'
import { DEFAULT_TENANT } from './lib/db'
import { rutaLogin } from './lib/instituciones'
import { MODULO_DE_ROL } from './lib/modulos'

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

import PortalAlumno, { SegunNivel } from './components/PortalAlumno'
import AlumnoInicio from './pages/alumno/AlumnoInicio'
import MisTareas from './pages/alumno/MisTareas'
import Biblioteca from './pages/alumno/Biblioteca'
import Logros from './pages/alumno/Logros'
import SecInicio from './pages/secundaria/SecInicio'
import SecTareas from './pages/secundaria/SecTareas'
import SecNotas from './pages/secundaria/SecNotas'
import SecAgenda from './pages/secundaria/SecAgenda'
import SecApuntes from './pages/secundaria/SecApuntes'
import SecHerramientas from './pages/secundaria/SecHerramientas'
import SecBiblioteca from './pages/secundaria/SecBiblioteca'

import Bandeja from './pages/Bandeja'

import AdministradoraLayout from './components/AdministradoraLayout'
import AdminvaInicio from './pages/administradora/AdminvaInicio'
import Cobranzas from './pages/administradora/Cobranzas'
import Facturacion from './pages/administradora/Facturacion'

import Aprobador from './pages/Aprobador'

import MantenimientoLayout from './components/MantenimientoLayout'
import MantInicio from './pages/mantenimiento/MantInicio'
import MantPersonal from './pages/mantenimiento/MantPersonal'
import MantZonas from './pages/mantenimiento/MantZonas'
import MantPedidos from './pages/mantenimiento/MantPedidos'
import MantenimientoAdmin from './pages/MantenimientoAdmin'

import { SuperAdminProvider, useSuperAdmin } from './context/SuperAdminContext'
import SuperLogin from './pages/superadmin/SuperLogin'
import SuperPanel from './pages/superadmin/SuperPanel'

/* Ruta a la que pertenece cada rol */
const HOME = { admin: '/admin', maestro: '/maestro', aprobador: '/aprobador', alumno: '/alumno', administradora: '/administracion', mantenimiento: '/mantenimiento' }

/* Guardia: exige sesión y (opcional) un rol concreto.
   Si el rol no coincide, redirige al home del rol del usuario. */
function Protected ({ rol, children }) {
  const { user } = useAuth()
  const { slug, info, tieneModulo } = useInstitucion()
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
  if (!tieneModulo(MODULO_DE_ROL[user.rol])) return <SinModulo salir />
  return children
}

function SinModulo ({ salir }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="empty" style={{ padding: '80px 20px' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-soft)', marginBottom: 4 }}>Módulo no disponible</div>
      <div style={{ fontSize: 13 }}>Esta función no está activada para tu institución.</div>
      {salir && <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => navigate(logout())}>Cerrar sesión</button>}
    </div>
  )
}

/* Envuelve una ruta que pertenece a un módulo opcional. */
function ConModulo ({ id, children }) {
  const { tieneModulo } = useInstitucion()
  return tieneModulo(id) ? children : <SinModulo />
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
        <Route path="mantenimiento" element={<ConModulo id="mantenimiento"><MantenimientoAdmin /></ConModulo>} />
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
        <Route path="planificacion" element={<ConModulo id="planificacion"><Planificacion /></ConModulo>} />
        <Route path="fichas" element={<ConModulo id="fichas"><Fichas /></ConModulo>} />
        <Route path="boletas" element={<Boletas />} />
        <Route path="calificaciones" element={<Calificaciones />} />
      </Route>

      {/* Portal del alumno: primaria (gamificado) o secundaria según su nivel */}
      <Route
        path="/alumno"
        element={<Protected rol="alumno"><PortalAlumno /></Protected>}
      >
        <Route index element={<SegunNivel primaria={<AlumnoInicio />} secundaria={<SecInicio />} />} />
        <Route path="tareas" element={<SegunNivel primaria={<MisTareas />} secundaria={<SecTareas />} />} />
        <Route path="bandeja" element={<Bandeja />} />
        <Route path="biblioteca" element={<SegunNivel primaria={<Biblioteca />} secundaria={<SecBiblioteca />} />} />
        <Route path="logros" element={<SegunNivel primaria={<Logros />} />} />
        <Route path="notas" element={<SegunNivel secundaria={<SecNotas />} />} />
        <Route path="agenda" element={<SegunNivel secundaria={<SecAgenda />} />} />
        <Route path="apuntes" element={<SegunNivel secundaria={<SecApuntes />} />} />
        <Route path="herramientas" element={<SegunNivel secundaria={<SecHerramientas />} />} />
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

      {/* Portal del jefe de mantenimiento */}
      <Route
        path="/mantenimiento"
        element={<Protected rol="mantenimiento"><MantenimientoLayout /></Protected>}
      >
        <Route index element={<MantInicio />} />
        <Route path="personal" element={<MantPersonal />} />
        <Route path="zonas" element={<MantZonas />} />
        <Route path="pedidos" element={<MantPedidos />} />
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
