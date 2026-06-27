import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, GraduationCap, Users, UserCog, Briefcase,
  Receipt, LogOut, Menu, ChevronLeft
} from 'lucide-react'
import { Logo, ThemeToggle } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/db'

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Resumen', end: true },
  { to: '/admin/alumnos', icon: GraduationCap, label: 'Alumnos' },
  { to: '/admin/maestros', icon: UserCog, label: 'Maestros' },
  { to: '/admin/representantes', icon: Users, label: 'Representantes' },
  { to: '/admin/personal', icon: Briefcase, label: 'Personal' },
  { to: '/admin/administrativo', icon: Receipt, label: 'Administrativo' },
]

export default function AdminLayout () {
  // En móvil arranca colapsada (solo iconos) para dejar espacio al contenido.
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 820)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: open ? 256 : 76, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', transition: 'width .2s', position: 'sticky', top: 0,
        height: '100vh', flexShrink: 0
      }}>
        <div style={{ padding: open ? '20px 18px' : '20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {open ? <Logo /> : <img src="/logo.png" width={34} height={34} alt="Logo" />}
        </div>

        <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {nav.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px',
                borderRadius: 10, fontSize: 14, fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-soft)',
                background: isActive ? 'var(--primary)' : 'transparent',
                justifyContent: open ? 'flex-start' : 'center',
              })}
              title={item.label}
            >
              <item.icon size={19} style={{ flexShrink: 0 }} />
              {open && item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: open ? 'flex-start' : 'center' }}
            onClick={() => { logout(); navigate('/') }}>
            <LogOut size={18} />{open && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: 64, borderBottom: '1px solid var(--border)', background: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px',
          position: 'sticky', top: 0, zIndex: 10
        }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)} aria-label="Alternar menú">
            {open ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {!db.isRemote && (
              <span className="badge badge-warning" title="Conecta Appwrite en .env para persistencia real">Modo demo · local</span>
            )}
            <ThemeToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14 }}>
                {user?.nombre?.[0]}
              </div>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'capitalize' }}>{user?.rol}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="main-pad" style={{ flex: 1, animation: 'slideup .25s' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
