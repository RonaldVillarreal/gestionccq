import { useMemo, useState } from 'react'
import { Plus, Trash2, CalendarClock, BookOpenCheck, GraduationCap, Users, Map, ClipboardCheck, Award, Check } from 'lucide-react'
import { Modal, Empty } from '../../components/UI'
import MapaBuscador from '../../components/MapaBuscador'
import VistaContenido from '../../components/VistaContenido'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'
import { materiaEmoji, SELLOS } from '../../lib/gamification'
import { MARCA_MAPA } from '../../lib/contenidoMateria'
import { notificar, notificarVarios } from '../../lib/inbox'

const empty = { materia_id: '', titulo: '', descripcion: '', fecha_entrega: '' }

export default function Tareas () {
  const { user } = useAuth()
  const maestros = useTable('maestros')
  const materias = useTable('materias')
  const tareas = useTable('tareas')
  const entregas = useTable('entregas')
  const alumnos = useTable('alumnos')
  const medallas = useTable('medallas')

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [buscarMapa, setBuscarMapa] = useState(false)
  const [revisar, setRevisar] = useState(null)   // tarea en revisión

  const miMaestro = useMemo(() => maestros.rows.find(m => m.usuario_id === user?.id), [maestros.rows, user])
  const misMaterias = useMemo(() => (miMaestro ? materias.rows.filter(m => m.maestro_id === miMaestro.id) : []), [materias.rows, miMaestro])
  const misTareas = useMemo(
    () => (miMaestro?.grado ? tareas.rows.filter(t => t.maestro_id === miMaestro.id || (t.grado === miMaestro.grado && (!t.seccion || t.seccion === miMaestro.seccion))) : [])
      .sort((a, b) => (b.fecha_entrega || '').localeCompare(a.fecha_entrega || '')),
    [tareas.rows, miMaestro]
  )

  const alumnosGrado = useMemo(
    () => (miMaestro?.grado ? alumnos.rows.filter(a => a.grado === miMaestro.grado && (!miMaestro.seccion || a.seccion === miMaestro.seccion)) : []),
    [alumnos.rows, miMaestro]
  )
  const entregoLa = (tareaId, alumnoId) => entregas.rows.find(e => e.tarea_id === tareaId && e.alumno_id === alumnoId && e.status === 'entregada')
  const entregadasDe = (tareaId) => entregas.rows.filter(e => e.tarea_id === tareaId && e.status === 'entregada').length
  const medallaDe = (tareaId, alumnoId) => medallas.rows.find(m => m.tarea_id === tareaId && m.alumno_id === alumnoId)

  function set (k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar () {
    if (!form.materia_id) return alert('Elige la materia.')
    if (!form.titulo.trim()) return alert('Ponle un título a la tarea.')
    const mat = misMaterias.find(m => m.id === form.materia_id)
    const t = await tareas.insert({
      materia_id: form.materia_id, maestro_id: miMaestro.id,
      grado: miMaestro.grado, seccion: miMaestro.seccion || '',
      titulo: form.titulo, descripcion: form.descripcion, fecha_entrega: form.fecha_entrega,
      color: mat?.color || '#2A2F6B',
    })
    // Aviso a la bandeja de cada alumno del grado con acceso al portal.
    await notificarVarios(alumnosGrado.map(a => a.usuario_id), {
      de: user.id, tipo: 'tarea_nueva',
      titulo: `📌 Nueva tarea de ${mat?.nombre || 'clase'}`,
      cuerpo: `Tienes una nueva tarea: «${form.titulo}».`, ref_id: t.id,
    })
    cerrar()
  }
  function cerrar () { setModal(false); setForm(empty) }

  // Otorga un sello a un alumno por una tarea: crea la medalla y le avisa.
  async function otorgar (alumno, tarea, sello, mensaje) {
    await medallas.insert({
      alumno_id: alumno.id, maestro_id: miMaestro.id, tarea_id: tarea.id,
      sello: sello.key, emoji: sello.emoji, titulo: sello.titulo, mensaje: mensaje || '', puntos: sello.puntos,
    })
    if (alumno.usuario_id) await notificar({
      para: alumno.usuario_id, de: user.id, tipo: 'medalla',
      titulo: `${sello.emoji} ¡Ganaste una medalla!`,
      cuerpo: `${miMaestro.nombre} te dio el sello «${sello.titulo}» (+${sello.puntos} ⭐)${tarea ? ` por «${tarea.titulo}»` : ''}.`,
    })
  }
  async function quitarMedalla (md) {
    if (confirm('¿Quitar esta medalla?')) await medallas.remove(md.id)
  }

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
            <span>Publica tareas, revisa entregas y premia a tus alumnos.</span>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setRevisar(t)} title="Revisar entregas">
                    <ClipboardCheck size={15} /> Revisar{n ? ` (${n})` : ''}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => confirm('¿Eliminar esta tarea?') && tareas.remove(t.id)} title="Eliminar"><Trash2 size={15} /></button>
                </div>
              </div>
            )
          })}
        </div>
      ) : <div className="card"><Empty icon={BookOpenCheck} title="Aún no has publicado tareas"
            hint="Crea la primera tarea y tus alumnos la verán al instante en su portal." /></div>}

      {/* ---------- Modal: nueva tarea ---------- */}
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
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>El alumno verá el mapa dibujado, no el texto.</span>
          </div>

          {buscarMapa && (
            <MapaBuscador onClose={() => setBuscarMapa(false)}
              onInsertar={(m) => set('descripcion',
                `${form.descripcion ? form.descripcion + '\n' : ''}${MARCA_MAPA} ${m.nombre} | ${m.lat} | ${m.lon} | ${m.zoom}`)} />
          )}
        </Modal>
      )}

      {/* ---------- Modal: revisar entregas y premiar ---------- */}
      {revisar && (
        <Modal title={`Revisar · ${revisar.titulo}`} wide onClose={() => setRevisar(null)}
          footer={<button className="btn btn-ghost" onClick={() => setRevisar(null)}>Cerrar</button>}>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: -4 }}>
            {entregadasDe(revisar.id)} de {alumnosGrado.length} entregaron. Dale un sello a quien lo merezca: sumará estrellas a su perfil.
          </p>
          {alumnosGrado.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alumnosGrado.map(a => (
                <FilaRevision key={a.id} alumno={a} entrega={entregoLa(revisar.id, a.id)} medalla={medallaDe(revisar.id, a.id)}
                  onOtorgar={(sello, msg) => otorgar(a, revisar, sello, msg)}
                  onQuitar={(md) => quitarMedalla(md)} />
              ))}
            </div>
          ) : <Empty icon={Users} title="Sin alumnos en este grado" hint="Cuando el administrador inscriba alumnos, aparecerán aquí." />}
        </Modal>
      )}
    </div>
  )
}

/* Una fila de la revisión: estado de entrega del alumno + otorgar/quitar sello. */
function FilaRevision ({ alumno, entrega, medalla, onOtorgar, onQuitar }) {
  const [abierto, setAbierto] = useState(false)
  const [selloKey, setSelloKey] = useState('')
  const [msg, setMsg] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function dar () {
    const sello = SELLOS.find(s => s.key === selloKey)
    if (!sello) return
    setGuardando(true)
    try { await onOtorgar(sello, msg) } finally { setGuardando(false); setAbierto(false); setSelloKey(''); setMsg('') }
  }

  return (
    <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{alumno.nombre} {alumno.apellido}</div>
          <div style={{ fontSize: 12.5, marginTop: 2 }}>
            {entrega
              ? <span className="badge badge-success"><Check size={12} /> Entregada {entrega.fecha && `· ${entrega.fecha}`}</span>
              : <span className="badge badge-neutral">Sin entregar</span>}
          </div>
        </div>

        {medalla ? (
          <span className="badge badge-accent" title={medalla.mensaje || medalla.titulo}>
            {medalla.emoji} {medalla.titulo} · +{medalla.puntos} ⭐
            <button onClick={() => onQuitar(medalla)} title="Quitar" style={{ marginLeft: 6, color: 'inherit', background: 'none' }}>✕</button>
          </span>
        ) : (
          <button className="btn btn-accent btn-sm" onClick={() => setAbierto(o => !o)}>
            <Award size={15} /> Premiar
          </button>
        )}
      </div>

      {abierto && !medalla && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SELLOS.map(s => (
              <button key={s.key} type="button" onClick={() => setSelloKey(s.key)}
                className={`btn btn-sm ${selloKey === s.key ? 'btn-primary' : 'btn-ghost'}`} title={`${s.desc} · +${s.puntos} ⭐`}>
                {s.emoji} {s.titulo}
              </button>
            ))}
          </div>
          <textarea className="input" rows={2} value={msg} onChange={e => setMsg(e.target.value)}
            placeholder="Mensaje para el alumno (opcional). Ej: ¡Excelente trabajo!" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={dar} disabled={!selloKey || guardando}>
              <Award size={15} /> Dar medalla{selloKey ? ` (+${SELLOS.find(s => s.key === selloKey)?.puntos} ⭐)` : ''}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setAbierto(false); setSelloKey('') }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
