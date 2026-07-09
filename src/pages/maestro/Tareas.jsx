import { useMemo, useState } from 'react'
import { Plus, Trash2, CalendarClock, BookOpenCheck, GraduationCap, Users, Map } from 'lucide-react'
import { Modal, Empty } from '../../components/UI'
import MapaBuscador from '../../components/MapaBuscador'
import VistaContenido from '../../components/VistaContenido'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'
import { materiaEmoji } from '../../lib/gamification'
import { MARCA_MAPA } from '../../lib/contenidoMateria'

const empty = { materia_id: '', titulo: '', descripcion: '', fecha_entrega: '' }

export default function Tareas () {
  const { user } = useAuth()
  const maestros = useTable('maestros')
  const materias = useTable('materias')
  const tareas = useTable('tareas')
  const entregas = useTable('entregas')
  const alumnos = useTable('alumnos')

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [buscarMapa, setBuscarMapa] = useState(false)

  const miMaestro = useMemo(() => maestros.rows.find(m => m.usuario_id === user?.id), [maestros.rows, user])
  const misMaterias = useMemo(() => (miMaestro ? materias.rows.filter(m => m.maestro_id === miMaestro.id) : []), [materias.rows, miMaestro])
  const misTareas = useMemo(
    () => (miMaestro?.grado ? tareas.rows.filter(t => t.maestro_id === miMaestro.id || (t.grado === miMaestro.grado && (!t.seccion || t.seccion === miMaestro.seccion))) : [])
      .sort((a, b) => (b.fecha_entrega || '').localeCompare(a.fecha_entrega || '')),
    [tareas.rows, miMaestro]
  )

  // Cuántos alumnos del grado ya entregaron cada tarea (seguimiento real).
  const alumnosGrado = useMemo(
    () => (miMaestro?.grado ? alumnos.rows.filter(a => a.grado === miMaestro.grado && (!miMaestro.seccion || a.seccion === miMaestro.seccion)) : []),
    [alumnos.rows, miMaestro]
  )
  const entregadasDe = (tareaId) => entregas.rows.filter(e => e.tarea_id === tareaId && e.status === 'entregada').length

  function set (k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar () {
    if (!form.materia_id) return alert('Elige la materia.')
    if (!form.titulo.trim()) return alert('Ponle un título a la tarea.')
    const mat = misMaterias.find(m => m.id === form.materia_id)
    await tareas.insert({
      materia_id: form.materia_id, maestro_id: miMaestro.id,
      grado: miMaestro.grado, seccion: miMaestro.seccion || '',
      titulo: form.titulo, descripcion: form.descripcion, fecha_entrega: form.fecha_entrega,
      color: mat?.color || '#2A2F6B',
    })
    cerrar()
  }
  function cerrar () { setModal(false); setForm(empty) }

  if (!maestros.loading && !miMaestro?.grado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <h1 style={{ fontSize: 28 }}>Tareas</h1>
        <div className="card"><Empty icon={GraduationCap} title="Aún no tienes un grado asignado"
          hint="Pídele al administrador que te asigne un grado y sección para poder publicar tareas." /></div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Tareas</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-accent"><GraduationCap size={13} /> {miMaestro?.grado}{miMaestro?.seccion && ` · ${miMaestro.seccion}`}</span>
            <span>Lo que publiques aquí aparece en el portal de tus alumnos.</span>
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)} disabled={!misMaterias.length}>
          <Plus size={16} /> Nueva tarea
        </button>
      </header>

      {!misMaterias.length && (
        <div className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>
          Primero crea materias en Planificación para poder asignar tareas.
        </div>
      )}

      {misTareas.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {misTareas.map(t => {
            const mat = materias.rows.find(m => m.id === t.materia_id)
            const n = entregadasDe(t.id)
            const total = alumnosGrado.length
            return (
              <div key={t.id} className="card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start', borderLeft: `5px solid ${t.color || 'var(--primary)'}` }}>
                <span style={{ fontSize: 26 }}>{materiaEmoji(mat?.nombre || '')}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{t.titulo}</span>
                    {mat && <span className="badge badge-neutral">{mat.nombre}</span>}
                  </div>
                  {t.descripcion && (
                    <div style={{ marginTop: 6, color: 'var(--text-soft)' }}>
                      <VistaContenido texto={t.descripcion} vacio="" />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 9, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-faint)' }}>
                    {t.fecha_entrega && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CalendarClock size={14} /> Entrega: {t.fecha_entrega}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={14} /> {n}/{total} entregadas</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => confirm('¿Eliminar esta tarea?') && tareas.remove(t.id)} title="Eliminar"><Trash2 size={15} /></button>
              </div>
            )
          })}
        </div>
      ) : <div className="card"><Empty icon={BookOpenCheck} title="Aún no has publicado tareas"
            hint="Crea la primera tarea y tus alumnos la verán al instante en su portal." /></div>}

      {modal && (
        <Modal title="Nueva tarea" onClose={cerrar} wide
          footer={<>
            <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar}>Publicar tarea</button>
          </>}>
          <div className="grid-form">
            <div className="field"><label>Materia *</label>
              <select className="select" value={form.materia_id} onChange={e => set('materia_id', e.target.value)}>
                <option value="">— Elige —</option>
                {misMaterias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="field"><label>Fecha de entrega</label>
              <input className="input" type="date" value={form.fecha_entrega} onChange={e => set('fecha_entrega', e.target.value)} />
            </div>
          </div>
          <div className="field"><label>Título *</label>
            <input className="input" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ej: Resolver ejercicios de la página 24" />
          </div>
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span>Instrucciones para el alumno</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBuscarMapa(true)}>
                <Map size={14} /> Insertar mapa
              </button>
            </label>
            <textarea className="input" rows={3} value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Explica la tarea con palabras claras y motivadoras 😊" />
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              El alumno verá el mapa dibujado, no el texto.
            </span>
          </div>

          {buscarMapa && (
            <MapaBuscador onClose={() => setBuscarMapa(false)}
              onInsertar={(m) => set('descripcion',
                `${form.descripcion ? form.descripcion + '\n' : ''}${MARCA_MAPA} ${m.nombre} | ${m.lat} | ${m.lon} | ${m.zoom}`)} />
          )}
        </Modal>
      )}
    </div>
  )
}
