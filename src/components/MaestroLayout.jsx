import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarRange, FileText, ClipboardList, GraduationCap, BookOpenCheck, Library, Inbox, ScrollText, LogOut, Menu, ChevronLeft } from 'lucide-react'
import { ThemeToggle, LogoImg, useNombreInstitucion } from './UI'
import { useAuth } from '../context/AuthContext'
import { useInbox } from '../lib/inbox'

const nav = [
  { to: '/maestro', icon: LayoutDashboard, label: 'Inicio', end: true },
  { to: '/maestro/mi-grado', icon: GraduationCap, label: 'Mi grado' },
  { to: '/maestro/tareas', icon: BookOpenCheck, label: 'Tareas' },
  { to: '/maestro/bandeja', icon: Inbox, label: 'Bandeja', inbox: true },
  { to: '/maestro/biblioteca', icon: Library, label: 'Biblioteca' },
  { to: '/maestro/planificacion', icon: CalendarRange, label: 'Planificación' },
  { to: '/maestro/fichas', icon: ScrollText, label: 'Fichas' },
  { to: '/maestro/boletas', icon: FileText, label: 'Boletas' },
  { to: '/maestro/calificaciones', icon: ClipboardList, label: 'Calificaciones' },
]

export default function MaestroLayout () {
  // En móvil arranca colapsada (solo iconos) para dejar espacio al contenido.
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 820)
  const { user, logout } = useAuth()
  const nombreInst = useNombreInstitucion()
  const { noLeidas } = useInbox()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: open ? 248 : 74, background: 'var(--primary)', color: '#fff',
        display: 'flex', flexDirection: 'column', transition: 'width .2s',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0
      }}>
        <div style={{ padding: open ? '20px 16px' : '20px 12px', borderBottom: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoImg />
          {open && <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 15 }}>Portal Maestro</div>
            <div style={{ fontSize: 11, opacity: .7 }}>{nombreInst}</div>
          </div>}
        </div>

        <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {nav.map(item => {
            const badge = item.inbox && noLeidas > 0
            return (
              <NavLink key={item.to} to={item.to} end={item.end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px',
                  borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#fff',
                  background: isActive ? 'rgba(255,255,255,.18)' : 'transparent',
                  justifyContent: open ? 'flex-start' : 'center', position: 'relative',
                })} title={item.label}>
                <span style={{ position: 'relative', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                  <item.icon size={19} />
                  {badge && !open && <span style={{ position: 'absolute', top: -4, right: -6, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 99, background: 'var(--accent)', color: '#1C1E2E', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{noLeidas}</span>}
                </span>
                {open && item.label}
                {badge && open && <span style={{ marginLeft: 'auto', minWidth: 20, height: 20, padding: '0 6px', borderRadius: 99, background: 'var(--accent)', color: '#1C1E2E', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{noLeidas}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.12)' }}>
          <button onClick={() => { navigate(logout()) }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, background: 'rgba(255,255,255,.08)', justifyContent: open ? 'flex-start' : 'center' }}>
            <LogOut size={18} />{open && 'Salir'}
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: 64, borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', position: 'sticky', top: 0, zIndex: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)} aria-label="Alternar menú">
            {open ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ThemeToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: '#1C1E2E', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>{user?.nombre?.[0]}</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.nombre}</div>
            </div>
          </div>
        </header>
        <main className="main-pad" style={{ flex: 1, animation: 'slideup .25s' }}><Outlet /></main>
      </div>
    </div>
  )
}
