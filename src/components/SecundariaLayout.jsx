import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  House, ListChecks, GraduationCap, CalendarDays, NotebookPen, Library,
  Timer, Inbox, LogOut, Ellipsis,
} from 'lucide-react'
import { ThemeToggle, LogoImg, useNombreInstitucion } from './UI'
import { useAlumno } from '../lib/useAlumno'
import { useAuth } from '../context/AuthContext'
import { useInbox } from '../lib/inbox'

/* Portal de secundaria: barra lateral en escritorio y barra de pestañas
   inferior en el celular (donde más lo usan los adolescentes). */
const ESTUDIO = [
  { to: '/alumno', icon: House, label: 'Inicio', end: true },
  { to: '/alumno/tareas', icon: ListChecks, label: 'Tareas', pendientes: true },
  { to: '/alumno/notas', icon: GraduationCap, label: 'Notas' },
  { to: '/alumno/agenda', icon: CalendarDays, label: 'Agenda' },
]
const RECURSOS = [
  { to: '/alumno/apuntes', icon: NotebookPen, label: 'Apuntes' },
  { to: '/alumno/biblioteca', icon: Library, label: 'Biblioteca' },
  { to: '/alumno/herramientas', icon: Timer, label: 'Herramientas' },
  { to: '/alumno/bandeja', icon: Inbox, label: 'Bandeja', inbox: true },
]

export default function SecundariaLayout () {
  const { user, alumno, misTareas, misEntregas } = useAlumno()
  const { logout } = useAuth()
  const { noLeidas } = useInbox()
  const nombreInst = useNombreInstitucion()
  const navigate = useNavigate()
  const location = useLocation()
  const [mas, setMas] = useState(false)

  useEffect(() => { setMas(false) }, [location.pathname])

  const hechas = new Set(misEntregas.filter(e => e.status === 'entregada').map(e => e.tarea_id))
  const pendientes = misTareas.filter(t => !hechas.has(t.id)).length
  const nombre = alumno ? `${alumno.nombre} ${alumno.apellido || ''}`.trim() : user?.nombre
  const curso = [alumno?.grado, alumno?.seccion && `Sección ${alumno.seccion}`].filter(Boolean).join(' · ')
  const contador = (item) => (item.pendientes ? pendientes : item.inbox ? noLeidas : 0)
  const enMas = RECURSOS.some(r => location.pathname.startsWith(r.to))

  const enlace = (item) => (
    <NavLink key={item.to} to={item.to} end={item.end}>
      <item.icon size={18} strokeWidth={1.9} />
      {item.label}
      {contador(item) > 0 && <span className="sec-count">{contador(item)}</span>}
    </NavLink>
  )

  return (
    <div className="sec">
      <div className="sec-shell">
        <aside className="sec-side">
          <div className="sec-brand">
            <LogoImg size={30} />
            <div style={{ lineHeight: 1.2, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--sec-font)', fontWeight: 700, fontSize: 15 }}>Campus</div>
              <div className="sec-faint" style={{ fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreInst}</div>
            </div>
          </div>
          <nav className="sec-nav" aria-label="Principal">
            {ESTUDIO.map(enlace)}
            <div className="sec-nav-label">Recursos</div>
            {RECURSOS.map(enlace)}
          </nav>
          <div style={{ padding: 10, borderTop: '1px solid var(--sec-border)' }}>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }} onClick={() => navigate(logout())}>
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="sec-main">
          <header className="sec-top">
            <div className="sec-top-brand">
              <LogoImg size={26} />
              <span style={{ fontFamily: 'var(--sec-font)', fontWeight: 700 }}>Campus</span>
            </div>
            <div className="sec-faint sec-top-curso" style={{ fontSize: 13 }}>{curso}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ThemeToggle />
              <div className="sec-avatar" title={nombre}>{(nombre || '?').split(' ').map(p => p[0]).slice(0, 2).join('')}</div>
            </div>
          </header>
          <main className="sec-content"><Outlet /></main>
        </div>
      </div>

      {/* Navegación móvil: 4 secciones de estudio + "Más" */}
      <nav className="sec-tabbar" aria-label="Principal">
        {ESTUDIO.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <item.icon size={21} strokeWidth={1.9} />
            {item.label}
            {contador(item) > 0 && <span className="sec-dot" aria-label={`${contador(item)} pendientes`} />}
          </NavLink>
        ))}
        <button type="button" aria-expanded={mas || enMas} aria-haspopup="menu" onClick={() => setMas(m => !m)}>
          <Ellipsis size={21} strokeWidth={1.9} />
          Más
          {noLeidas > 0 && <span className="sec-dot" />}
        </button>
      </nav>
      {mas && (
        <>
          <div className="sec-mas-fondo" onClick={() => setMas(false)} />
          <div className="sec-mas" role="menu">
            {RECURSOS.map(item => (
              <NavLink key={item.to} to={item.to} role="menuitem">
                <item.icon size={19} strokeWidth={1.9} /> {item.label}
                {contador(item) > 0 && <span className="sec-count">{contador(item)}</span>}
              </NavLink>
            ))}
            <button role="menuitem" onClick={() => navigate(logout())}><LogOut size={19} /> Cerrar sesión</button>
          </div>
        </>
      )}
    </div>
  )
}
