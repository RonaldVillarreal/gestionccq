import { useMemo, useState } from 'react'
import { ClipboardList, ListChecks, NotebookPen, Plus, Pencil, Trash2, Download, GraduationCap, ScrollText } from 'lucide-react'
import { Empty } from '../../components/UI'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'
import FichaObservacion, { printObservacion } from './fichas/FichaObservacion'
import FichaCotejo, { printCotejo } from './fichas/FichaCotejo'
import FichaAnecdotico, { printAnecdotico } from './fichas/FichaAnecdotico'
import { imprimirFicha } from '../../lib/imprimirFicha'

const TIPOS = {
  observacion: { label: 'Ficha de observación', desc: 'Actitudes y comportamientos', icon: ClipboardList, print: printObservacion },
  cotejo:      { label: 'Lista de cotejo',      desc: 'Criterios: logrado / no logrado', icon: ListChecks, print: printCotejo },
  anecdotico:  { label: 'Registro anecdótico',  desc: 'Observación de un alumno', icon: NotebookPen, print: printAnecdotico },
}

export default function Fichas () {
  const { user } = useAuth()
  const maestros = useTable('maestros')
  const materias = useTable('materias')
  const alumnos = useTable('alumnos')
  const fichas = useTable('fichas')

  const [editor, setEditor] = useState(null) // { tipo, ficha? }

  const miMaestro = useMemo(() => maestros.rows.find(m => m.usuario_id === user?.id), [maestros.rows, user])
  const misMaterias = useMemo(() => (miMaestro ? materias.rows.filter(m => m.maestro_id === miMaestro.id) : []), [materias.rows, miMaestro])
  const alumnosGrado = useMemo(
    () => (miMaestro?.grado ? alumnos.rows.filter(a => a.grado === miMaestro.grado && (!miMaestro.seccion || a.seccion === miMaestro.seccion))
      .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)) : []),
    [alumnos.rows, miMaestro]
  )
  const misFichas = useMemo(
    () => (miMaestro ? fichas.rows.filter(f => f.maestro_id === miMaestro.id).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')) : []),
    [fichas.rows, miMaestro]
  )

  async function guardar (payload) {
    if (editor.ficha?.id) await fichas.update(editor.ficha.id, payload)
    else await fichas.insert({ ...payload, maestro_id: miMaestro.id })
    setEditor(null)
  }

  function descargar (ficha) {
    const def = TIPOS[ficha.tipo]
    let datos = {}
    try { datos = JSON.parse(ficha.datos || '{}') } catch { /* datos corrupto */ }
    imprimirFicha(ficha.titulo || def.label, def.print(datos, { alumnos: alumnosGrado, maestro: miMaestro }))
  }

  if (!maestros.loading && !miMaestro?.grado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <h1 style={{ fontSize: 28 }}>Fichas</h1>
        <div className="card"><Empty icon={GraduationCap} title="Aún no tienes un grado asignado"
          hint="Pídele al administrador que te asigne un grado y sección para generar fichas de tus alumnos." /></div>
      </div>
    )
  }

  // ---------- Editor ----------
  if (editor) {
    const props = { maestro: miMaestro, materias: misMaterias, alumnos: alumnosGrado, ficha: editor.ficha, onGuardar: guardar, onSalir: () => setEditor(null) }
    if (editor.tipo === 'observacion') return <FichaObservacion {...props} />
    if (editor.tipo === 'cotejo') return <FichaCotejo {...props} />
    return <FichaAnecdotico {...props} />
  }

  // ---------- Lista ----------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 style={{ fontSize: 28 }}>Fichas</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="badge badge-accent"><GraduationCap size={13} /> {miMaestro?.grado}{miMaestro?.seccion && ` · ${miMaestro.seccion}`}</span>
          <span>Los estudiantes se completan solos desde tu grado. Guarda, edita y descarga en PDF.</span>
        </p>
      </header>

      {/* Crear nueva */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 14 }}>
        {Object.entries(TIPOS).map(([tipo, def]) => (
          <button key={tipo} className="card card-pad" onClick={() => setEditor({ tipo })}
            style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}><def.icon size={24} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{def.label}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{def.desc}</div>
            </div>
            <Plus size={18} color="var(--text-faint)" />
          </button>
        ))}
      </div>

      {/* Guardadas */}
      <div>
        <h3 style={{ fontSize: 18, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><ScrollText size={18} /> Fichas guardadas</h3>
        {misFichas.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {misFichas.map(f => {
              const def = TIPOS[f.tipo] || TIPOS.observacion
              return (
                <div key={f.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><def.icon size={20} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{f.titulo || def.label}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{def.label} · {(f.created_at || '').slice(0, 10)}</div>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditor({ tipo: f.tipo, ficha: f })} title="Editar"><Pencil size={15} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => descargar(f)} title="Descargar PDF"><Download size={15} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => confirm('¿Eliminar esta ficha?') && fichas.remove(f.id)} title="Eliminar"><Trash2 size={15} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : <div className="card"><Empty icon={ScrollText} title="Sin fichas guardadas" hint="Crea tu primera ficha con las opciones de arriba." /></div>}
      </div>
    </div>
  )
}
