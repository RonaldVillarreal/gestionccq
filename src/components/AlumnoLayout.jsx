import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, BookOpenCheck, Library, Trophy, LogOut, Menu, ChevronLeft, Star } from 'lucide-react'
import { ThemeToggle } from './UI'
import { useAlumno } from '../lib/useAlumno'
import { useAuth } from '../context/AuthContext'
import { tituloNivel } from '../lib/gamification'

const nav = [
  { to: '/alumno', icon: Home, label: 'Inicio', end: true },
  { to: '/alumno/tareas', icon: BookOpenCheck, label: 'Mis tareas' },
  { to: '/alumno/biblioteca', icon: Library, label: 'Biblioteca' },
  { to: '/alumno/logros', icon: Trophy, label: 'Mis logros' },
]

export default function AlumnoLayout () {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 820)
  const { user, alumno, progreso } = useAlumno()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const nombre = (alumno?.nombre || user?.nombre || '').split(' ')[0]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: open ? 252 : 76,
        // Degradado alegre índigo→morado para diferenciar el mundo del alumno.
        background: 'linear-gradient(180deg, var(--primary) 0%, #3A2F7A 100%)',
        color: '#fff', display: 'flex', flexDirection: 'column', transition: 'width .2s',
        position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
      }}>
        <div style={{ padding: open ? '20px 16px' : '20px 12px', borderBottom: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" width={34} height={34} alt="Logo" />
          {open && <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 15 }}>Mi Aula 🎒</div>
            <div style={{ fontSize: 11, opacity: .75 }}>Colegio Cardenal Quintero</div>
          </div>}
        </div>

        {/* Tarjetita de progreso: nivel + estrellas, siempre visible. */}
        {open && (
          <div style={{ margin: '14px 14px 4px', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 30, lineHeight: 1 }}>🦉</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Nivel {progreso.nivel}</div>
                <div style={{ fontSize: 11, opacity: .8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tituloNivel(progreso.nivel)}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontWeight: 800 }}>
                <Star size={15} fill="currentColor" />{progreso.puntos}
              </div>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: 'rgba(255,255,255,.22)', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progreso.progresoPct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
            </div>
          </div>
        )}

        <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px',
                borderRadius: 12, fontSize: 14.5, fontWeight: 700, color: '#fff',
                background: isActive ? 'rgba(255,255,255,.22)' : 'transparent',
                justifyContent: open ? 'flex-start' : 'center',
              })} title={item.label}>
              <item.icon size={20} style={{ flexShrink: 0 }} />{open && item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.14)' }}>
          <button onClick={() => { logout(); navigate('/') }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14, background: 'rgba(255,255,255,.1)', justifyContent: open ? 'flex-start' : 'center' }}>
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
            <span className="badge badge-accent" title="Tus estrellas"><Star size={13} fill="currentColor" /> {progreso.puntos}</span>
            <ThemeToggle />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-soft)', display: 'grid', placeItems: 'center', fontSize: 18 }}>🧒</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{nombre}</div>
            </div>
          </div>
        </header>
        <main className="main-pad" style={{ flex: 1, animation: 'slideup .25s' }}><Outlet /></main>
      </div>
    </div>
  )
}
