import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Star, Flame, BookOpenCheck, Library, Trophy, CalendarClock,
  ChevronRight, Sparkles, GraduationCap, UserRound,
} from 'lucide-react'
import { Empty, Loading } from '../../components/UI'
import { useAlumno } from '../../lib/useAlumno'
import { tituloNivel, mensajeAnimo, materiaEmoji } from '../../lib/gamification'

/* Días que faltan para una fecha (texto amistoso). */
function cuandoEntrega (fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha + 'T00:00:00')
  const dias = Math.round((f - hoy) / 86400000)
  if (Number.isNaN(dias)) return null
  if (dias < 0) return { txt: '¡Ya venció!', tone: 'danger' }
  if (dias === 0) return { txt: 'Para hoy', tone: 'warning' }
  if (dias === 1) return { txt: 'Para mañana', tone: 'warning' }
  return { txt: `En ${dias} días`, tone: 'primary' }
}

export default function AlumnoInicio () {
  const { user, alumno, maestro, misMaterias, misTareas, misEntregas, progreso, loading } = useAlumno()
  const nombre = (alumno?.nombre || user?.nombre || '').split(' ')[0]

  const hechasIds = useMemo(() => new Set(misEntregas.filter(e => e.status === 'entregada').map(e => e.tarea_id)), [misEntregas])
  const pendientes = useMemo(
    () => misTareas.filter(t => !hechasIds.has(t.id))
      .sort((a, b) => (a.fecha_entrega || '').localeCompare(b.fecha_entrega || '')),
    [misTareas, hechasIds]
  )

  if (loading) return <Loading label="Preparando tu aula…" />

  if (!alumno) {
    return (
      <div className="card">
        <Empty icon={UserRound} title="Aún no tienes una ficha de alumno vinculada"
          hint="Pídele a la administración que conecte tu usuario con tu ficha de alumno para ver tus tareas y libros." />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* ---------- Banner de bienvenida ---------- */}
      <div className="card" style={{ overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(120deg, var(--primary) 0%, #4A3A8F 55%, #6B4BB0 100%)', color: '#fff', border: 'none' }}>
        <div style={{ position: 'absolute', right: -10, top: -20, fontSize: 150, opacity: .12, lineHeight: 1 }}>🎈</div>
        <div style={{ padding: 26, position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 30, color: '#fff' }}>¡Hola, {nombre}! 👋</h1>
            <p style={{ opacity: .92, marginTop: 6, maxWidth: 460 }}>{mensajeAnimo({ pendientes: pendientes.length, completadas: progreso.completadas })}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {alumno?.grado && <span className="badge" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}><GraduationCap size={13} /> {alumno.grado}{alumno.seccion && ` · ${alumno.seccion}`}</span>}
              {maestro && <span className="badge" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}><UserRound size={13} /> Mi maestra: {maestro.nombre} {maestro.apellido}</span>}
            </div>
          </div>
          {/* Medallón de nivel */}
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.14)', borderRadius: 20, padding: '16px 22px', minWidth: 140 }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>🦉</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22, marginTop: 6 }}>Nivel {progreso.nivel}</div>
            <div style={{ fontSize: 12, opacity: .85 }}>{tituloNivel(progreso.nivel)}</div>
            <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,.25)', marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progreso.progresoPct}%`, background: 'var(--accent)', borderRadius: 99 }} />
            </div>
            <div style={{ fontSize: 11, opacity: .85, marginTop: 6 }}>{progreso.faltanParaSubir} ⭐ para subir</div>
          </div>
        </div>
      </div>

      {/* ---------- Stats divertidas ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14 }}>
        <MiniStat emoji="⭐" valor={progreso.puntos} label="Estrellas" icon={Star} tone="accent" />
        <MiniStat emoji="✅" valor={progreso.completadas} label="Tareas hechas" icon={BookOpenCheck} tone="success" />
        <MiniStat emoji="📌" valor={pendientes.length} label="Por hacer" icon={CalendarClock} tone="primary" />
        <MiniStat emoji="🔥" valor={progreso.racha} label="Días de racha" icon={Flame} tone="danger" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20 }}>
        {/* ---------- Próximas tareas ---------- */}
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 18 }}>📋 Tus próximas tareas</h3>
            <Link to="/alumno/tareas" className="btn btn-ghost btn-sm">Ver todas <ChevronRight size={15} /></Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendientes.slice(0, 4).map(t => {
              const mat = misMaterias.find(m => m.id === t.materia_id)
              const w = cuandoEntrega(t.fecha_entrega)
              return (
                <Link key={t.id} to="/alumno/tareas" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 24 }}>{materiaEmoji(mat?.nombre || '')}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t.titulo}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{mat?.nombre || 'Materia'}</div>
                  </div>
                  {w && <span className={`badge badge-${w.tone}`}>{w.txt}</span>}
                </Link>
              )
            })}
            {!pendientes.length && (
              <div style={{ textAlign: 'center', padding: '26px 10px' }}>
                <div style={{ fontSize: 46 }}>🎉</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>¡No tienes tareas pendientes!</div>
                <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>Disfruta tu tiempo libre 😄</div>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Mis materias ---------- */}
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 18 }}>🎨 Mis materias</h3>
            <Link to="/alumno/biblioteca" className="btn btn-ghost btn-sm"><Library size={15} /> Libros</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))', gap: 10 }}>
            {misMaterias.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 8px', borderRadius: 14, background: 'var(--surface-2)', border: `2px solid ${m.color || 'var(--border)'}`, textAlign: 'center' }}>
                <span style={{ fontSize: 30 }}>{materiaEmoji(m.nombre)}</span>
                <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{m.nombre}</span>
              </div>
            ))}
            {!misMaterias.length && <p style={{ color: 'var(--text-faint)', fontSize: 14, gridColumn: '1 / -1' }}>Tus materias aparecerán aquí cuando tu maestra las registre.</p>}
          </div>
        </div>
      </div>

      {/* ---------- Accesos rápidos ---------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 14 }}>
        <QuickLink to="/alumno/tareas" emoji="📝" titulo="Mis tareas" sub="Marca lo que ya hiciste" icon={BookOpenCheck} />
        <QuickLink to="/alumno/biblioteca" emoji="📚" titulo="Biblioteca" sub="Tus libros por materia" icon={Library} />
        <QuickLink to="/alumno/logros" emoji="🏆" titulo="Mis logros" sub="Mira tus medallas" icon={Trophy} />
      </div>
    </div>
  )
}

function MiniStat ({ emoji, valor, label, tone }) {
  return (
    <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 24, background: `var(--${tone}-soft)` }}>{emoji}</div>
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{valor}</div>
        <div style={{ color: 'var(--text-soft)', fontSize: 12.5, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

function QuickLink ({ to, emoji, titulo, sub, icon: Icon }) {
  return (
    <Link to={to} className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, transition: 'transform .12s, box-shadow .15s' }}>
      <div style={{ fontSize: 34 }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}><Icon size={16} /> {titulo}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginTop: 2 }}>{sub}</div>
      </div>
      <Sparkles size={18} color="var(--accent)" />
    </Link>
  )
}
