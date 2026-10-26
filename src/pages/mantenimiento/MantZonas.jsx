import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Modal } from '../../components/UI'
import { ResumenZonas } from '../../components/Mantenimiento'
import { useTable } from '../../lib/useTable'
import { esEquipoMant, DIAS, diasDe } from '../../lib/mantenimiento'

/* Zonas de la institución y turnos (quién limpia qué zona, qué días y a qué hora). */
const ZONA_VACIA = { nombre: '', area: '', descripcion: '' }
const TURNO_VACIO = { zona_id: '', personal_id: '', dias: 'lun,mar,mie,jue,vie', hora_inicio: '07:00', hora_fin: '08:00', tarea: '' }

export default function MantZonas () {
  const zonas = useTable('mant_zonas')
  const horarios = useTable('mant_horarios')
  const personal = useTable('personal')
  const [zona, setZona] = useState(null)
  const [turno, setTurno] = useState(null)

  const equipo = personal.rows.filter(esEquipoMant)
  const ordenadas = [...zonas.rows].sort((a, b) => a.nombre.localeCompare(b.nombre))

  async function guardarZona () {
    if (!zona.nombre.trim()) return alert('Escribe el nombre de la zona.')
    const datos = { nombre: zona.nombre.trim(), area: zona.area, descripcion: zona.descripcion }
    if (zona.id) await zonas.update(zona.id, datos)
    else await zonas.insert(datos)
    setZona(null)
  }

  async function eliminarZona (z) {
    const turnos = horarios.rows.filter(h => h.zona_id === z.id)
    if (!confirm(`¿Eliminar la zona "${z.nombre}"${turnos.length ? ` y sus ${turnos.length} turno(s)` : ''}?`)) return
    for (const h of turnos) await horarios.remove(h.id)
    await zonas.remove(z.id)
  }

  async function guardarTurno () {
    if (!turno.zona_id || !turno.personal_id) return alert('Elige la zona y la persona.')
    if (!diasDe(turno).length) return alert('Elige al menos un día.')
    if (turno.hora_inicio && turno.hora_fin && turno.hora_fin <= turno.hora_inicio) return alert('La hora de fin debe ser posterior a la de inicio.')
    const datos = { zona_id: turno.zona_id, personal_id: turno.personal_id, dias: turno.dias, hora_inicio: turno.hora_inicio, hora_fin: turno.hora_fin, tarea: turno.tarea }
    if (turno.id) await horarios.update(turno.id, datos)
    else await horarios.insert(datos)
    setTurno(null)
  }

  async function eliminarTurno () {
    if (!confirm('¿Eliminar este turno?')) return
    await horarios.remove(turno.id)
    setTurno(null)
  }

  function alternarDia (id) {
    const d = diasDe(turno)
    const nuevos = d.includes(id) ? d.filter(x => x !== id) : [...d, id]
    setTurno(t => ({ ...t, dias: DIAS.map(x => x.id).filter(x => nuevos.includes(x)).join(',') }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Zonas y horarios</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Asigna a tu personal las zonas de la institución, con días y horas. Toca un turno para editarlo.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setZona(ZONA_VACIA)}><Plus size={16} /> Nueva zona</button>
          <button className="btn btn-primary btn-sm" disabled={!zonas.rows.length}
            title={!zonas.rows.length ? 'Primero crea una zona' : undefined}
            onClick={() => setTurno({ ...TURNO_VACIO, zona_id: ordenadas[0]?.id || '', personal_id: equipo[0]?.id || '' })}>
            <Plus size={16} /> Asignar turno
          </button>
        </div>
      </header>

      <ResumenZonas zonas={ordenadas} horarios={horarios.rows} personal={personal.rows}
        onTurno={(h) => setTurno(h)}
        acciones={(z) => (
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            <button className="btn btn-ghost btn-sm" title="Asignar turno en esta zona" onClick={() => setTurno({ ...TURNO_VACIO, zona_id: z.id, personal_id: equipo[0]?.id || '' })}><Plus size={14} /></button>
            <button className="btn btn-ghost btn-sm" title="Editar zona" onClick={() => setZona(z)}><Pencil size={14} /></button>
            <button className="btn btn-ghost btn-sm" title="Eliminar zona" onClick={() => eliminarZona(z)}><Trash2 size={14} /></button>
          </div>
        )} />

      {zona && (
        <Modal title={zona.id ? 'Editar zona' : 'Nueva zona'} onClose={() => setZona(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setZona(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarZona}>Guardar</button>
          </>}>
          <div className="field"><label>Nombre *</label><input className="input" value={zona.nombre} onChange={e => setZona({ ...zona, nombre: e.target.value })} placeholder="Ej: Baños del segundo piso" autoFocus /></div>
          <div className="field"><label>Área / ubicación</label><input className="input" value={zona.area || ''} onChange={e => setZona({ ...zona, area: e.target.value })} placeholder="Ej: Planta alta" /></div>
          <div className="field"><label>Descripción</label><textarea className="textarea" value={zona.descripcion || ''} onChange={e => setZona({ ...zona, descripcion: e.target.value })} /></div>
        </Modal>
      )}

      {turno && (
        <Modal title={turno.id ? 'Editar turno' : 'Asignar turno'} onClose={() => setTurno(null)}
          footer={<>
            {turno.id && <button className="btn btn-ghost" style={{ marginRight: 'auto', color: 'var(--danger)' }} onClick={eliminarTurno}>Eliminar</button>}
            <button className="btn btn-ghost" onClick={() => setTurno(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarTurno}>Guardar</button>
          </>}>
          {!equipo.length && <p className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>Primero agrega personas en "Mi personal".</p>}
          <div className="grid-form">
            <div className="field"><label>Zona</label>
              <select className="select" value={turno.zona_id} onChange={e => setTurno({ ...turno, zona_id: e.target.value })}>
                <option value="">Elegir…</option>
                {ordenadas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
            </div>
            <div className="field"><label>Persona</label>
              <select className="select" value={turno.personal_id} onChange={e => setTurno({ ...turno, personal_id: e.target.value })}>
                <option value="">Elegir…</option>
                {equipo.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Días</label>
              <div className="mt-dias">
                {DIAS.map(d => (
                  <button key={d.id} type="button" aria-pressed={diasDe(turno).includes(d.id)} onClick={() => alternarDia(d.id)}>{d.label}</button>
                ))}
              </div>
            </div>
            <div className="field"><label>Desde</label><input className="input" type="time" value={turno.hora_inicio} onChange={e => setTurno({ ...turno, hora_inicio: e.target.value })} /></div>
            <div className="field"><label>Hasta</label><input className="input" type="time" value={turno.hora_fin} onChange={e => setTurno({ ...turno, hora_fin: e.target.value })} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Tarea</label><input className="input" value={turno.tarea || ''} onChange={e => setTurno({ ...turno, tarea: e.target.value })} placeholder="Ej: Barrer, coletear y vaciar papeleras" /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
