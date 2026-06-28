import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, CalendarClock, Sparkles, PartyPopper, UserRound } from 'lucide-react'
import { Empty, Loading } from '../../components/UI'
import { useAlumno } from '../../lib/useAlumno'
import { materiaEmoji, PUNTOS_POR_TAREA } from '../../lib/gamification'

const hoyISO = () => new Date().toISOString().slice(0, 10)

function vencimiento (fecha) {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const dias = Math.round((new Date(fecha + 'T00:00:00') - hoy) / 86400000)
  if (Number.isNaN(dias)) return null
  if (dias < 0) return { txt: 'Venció', tone: 'danger' }
  if (dias === 0) return { txt: 'Para hoy', tone: 'warning' }
  if (dias === 1) return { txt: 'Para mañana', tone: 'warning' }
  return { txt: `Faltan ${dias} días`, tone: 'primary' }
}

export default function MisTareas () {
  const { alumno, misMaterias, misTareas, misEntregas, loading, tablas } = useAlumno()
  const [filtro, setFiltro] = useState('pendientes') // pendientes | hechas | todas
  const [fiesta, setFiesta] = useState(false)
  const [guardando, setGuardando] = useState(null)

  const entregaDe = (tareaId) => misEntregas.find(e => e.tarea_id === tareaId && e.status === 'entregada')

  const lista = useMemo(() => {
    const ordenadas = [...misTareas].sort((a, b) => (a.fecha_entrega || '').localeCompare(b.fecha_entrega || ''))
    if (filtro === 'pendientes') return ordenadas.filter(t => !entregaDe(t.id))
    if (filtro === 'hechas') return ordenadas.filter(t => entregaDe(t.id))
    return ordenadas
  }, [misTareas, misEntregas, filtro])

  const pendientesN = misTareas.filter(t => !entregaDe(t.id)).length
  const hechasN = misTareas.length - pendientesN

  async function toggle (tarea) {
    if (guardando) return
    setGuardando(tarea.id)
    try {
      const existente = entregaDe(tarea.id)
      if (existente) {
        await tablas.entregas.remove(existente.id)
      } else {
        await tablas.entregas.insert({ alumno_id: alumno.id, tarea_id: tarea.id, status: 'entregada', comentario: '', fecha: hoyISO() })
        setFiesta(true)
        setTimeout(() => setFiesta(false), 1600)
      }
    } finally { setGuardando(null) }
  }

  if (loading) return <Loading label="Cargando tus tareas…" />
  if (!alumno) {
    return <div className="card"><Empty icon={UserRound} title="Sin ficha de alumno vinculada"
      hint="Pídele a la administración que conecte tu usuario con tu ficha de alumno." /></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {fiesta && <Confetti />}

      <header>
        <h1 style={{ fontSize: 28 }}>📝 Mis tareas</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>
          Marca cada tarea cuando la termines y gana <strong style={{ color: 'var(--accent)' }}>{PUNTOS_POR_TAREA} ⭐</strong> por cada una.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Chip activo={filtro === 'pendientes'} onClick={() => setFiltro('pendientes')}>Por hacer ({pendientesN})</Chip>
        <Chip activo={filtro === 'hechas'} onClick={() => setFiltro('hechas')}>Hechas ({hechasN})</Chip>
        <Chip activo={filtro === 'todas'} onClick={() => setFiltro('todas')}>Todas ({misTareas.length})</Chip>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {lista.map(t => {
          const mat = misMaterias.find(m => m.id === t.materia_id)
          const hecha = !!entregaDe(t.id)
          const v = vencimiento(t.fecha_entrega)
          return (
            <div key={t.id} className="card" style={{
              display: 'flex', gap: 14, padding: 16, alignItems: 'flex-start',
              borderLeft: `5px solid ${t.color || mat?.color || 'var(--primary)'}`,
              opacity: hecha ? .72 : 1, transition: 'opacity .2s',
            }}>
              <button onClick={() => toggle(t)} disabled={guardando === t.id} title={hecha ? 'Desmarcar' : 'Marcar como hecha'}
                style={{ background: 'none', flexShrink: 0, marginTop: 1, color: hecha ? 'var(--success)' : 'var(--text-faint)' }}>
                {hecha ? <CheckCircle2 size={30} /> : <Circle size={30} />}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 22 }}>{materiaEmoji(mat?.nombre || '')}</span>
                  <span style={{ fontWeight: 700, fontSize: 16, textDecoration: hecha ? 'line-through' : 'none' }}>{t.titulo}</span>
                  {mat && <span className="badge badge-neutral">{mat.nombre}</span>}
                </div>
                {t.descripcion && <p style={{ fontSize: 14, color: 'var(--text-soft)', marginTop: 7 }}>{t.descripcion}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9, flexWrap: 'wrap' }}>
                  {t.fecha_entrega && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-faint)' }}>
                    <CalendarClock size={14} /> Entrega: {t.fecha_entrega}
                  </span>}
                  {hecha
                    ? <span className="badge badge-success"><Sparkles size={12} /> ¡Lista! +{PUNTOS_POR_TAREA} ⭐</span>
                    : v && <span className={`badge badge-${v.tone}`}>{v.txt}</span>}
                </div>
              </div>
            </div>
          )
        })}

        {!lista.length && (
          <div className="card">
            <Empty icon={filtro === 'hechas' ? Sparkles : PartyPopper}
              title={filtro === 'pendientes' ? '¡Genial! No te queda nada por hacer 🎉' : filtro === 'hechas' ? 'Aún no has completado tareas' : 'No hay tareas todavía'}
              hint={filtro === 'pendientes' ? 'Vuelve más tarde para ver nuevas tareas de tu maestra.' : 'Cuando tu maestra asigne tareas, aparecerán aquí.'} />
          </div>
        )}
      </div>
    </div>
  )
}

function Chip ({ activo, onClick, children }) {
  return (
    <button onClick={onClick} className={`btn btn-sm ${activo ? 'btn-primary' : 'btn-ghost'}`}>{children}</button>
  )
}

/* Confetti ligero a base de emojis cayendo (sin dependencias). */
function Confetti () {
  const piezas = ['⭐', '🎉', '✨', '🏅', '🌟', '🎊', '💫', '⭐', '🎉', '✨', '🏆', '🌈']
  return (
    <div className="confetti-layer" aria-hidden="true">
      {piezas.map((p, i) => (
        <span key={i} className="confetti-pz" style={{
          left: `${(i / piezas.length) * 100 + Math.random() * 6}%`,
          animationDelay: `${Math.random() * 0.4}s`,
          fontSize: `${18 + Math.random() * 16}px`,
        }}>{p}</span>
      ))}
    </div>
  )
}
