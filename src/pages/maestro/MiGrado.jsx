import { useMemo, useState } from 'react'
import {
  GraduationCap, Users, ClipboardList, StickyNote, HeartPulse,
  BookOpen, Tag, Plus, Trash2, Search,
} from 'lucide-react'
import { Modal, Empty } from '../../components/UI'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'

/* Categorías de items que el maestro puede agregar a cada alumno. */
const CATEGORIAS = [
  { key: 'calificacion', label: 'Calificaciones', icon: ClipboardList, conMateria: true, conValor: true },
  { key: 'nota',         label: 'Notas',          icon: StickyNote },
  { key: 'alergia',      label: 'Salud / Alergias', icon: HeartPulse },
  { key: 'tarea',        label: 'Tareas',         icon: BookOpen, soon: true },
  { key: 'otro',         label: 'Otros',          icon: Tag },
]
const catDef = (k) => CATEGORIAS.find(c => c.key === k) || CATEGORIAS[CATEGORIAS.length - 1]
const emptyItem = { titulo: '', materia: '', valor: '', detalle: '' }

export default function MiGrado () {
  const { user } = useAuth()
  const maestros = useTable('maestros')
  const alumnos = useTable('alumnos')
  const items = useTable('items_alumno')

  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)     // alumno seleccionado
  const [cat, setCat] = useState('calificacion')
  const [form, setForm] = useState(emptyItem)

  // Maestro vinculado al usuario logueado → de ahí sale su grado asignado.
  const miMaestro = useMemo(
    () => maestros.rows.find(m => m.usuario_id === user?.id),
    [maestros.rows, user]
  )

  // Alumnos del grado/sección asignado.
  const misAlumnos = useMemo(() => {
    if (!miMaestro?.grado) return []
    const s = q.toLowerCase()
    return alumnos.rows
      .filter(a => a.grado === miMaestro.grado && (!miMaestro.seccion || a.seccion === miMaestro.seccion))
      .filter(a => `${a.nombre} ${a.apellido} ${a.cedula}`.toLowerCase().includes(s))
  }, [alumnos.rows, miMaestro, q])

  const itemsDe = (alumnoId) => items.rows.filter(i => i.alumno_id === alumnoId)
  const itemsCat = sel ? itemsDe(sel.id).filter(i => i.categoria === cat) : []

  function abrir (alumno) { setSel(alumno); setCat('calificacion'); setForm(emptyItem) }
  function cerrar () { setSel(null); setForm(emptyItem) }

  async function agregar () {
    if (!form.titulo.trim()) return alert('Ponle un título al ítem.')
    await items.insert({
      alumno_id: sel.id, categoria: cat,
      materia: form.materia, titulo: form.titulo, valor: form.valor, detalle: form.detalle,
    })
    setForm(emptyItem)
  }

  const def = catDef(cat)

  /* ---------- Sin grado asignado ---------- */
  if (!maestros.loading && !miMaestro?.grado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <h1 style={{ fontSize: 28 }}>Mi grado</h1>
        <div className="card">
          <Empty icon={GraduationCap} title="Aún no tienes un grado asignado"
            hint="Pídele al administrador que te asigne un grado y sección desde la sección Maestros." />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Mi grado</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-accent"><GraduationCap size={13} /> {miMaestro?.grado}{miMaestro?.seccion && ` · Sección ${miMaestro.seccion}`}</span>
            <span>{misAlumnos.length} alumno{misAlumnos.length === 1 ? '' : 's'}</span>
          </p>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={16} color="var(--text-faint)" style={{ flexShrink: 0 }} />
          <input className="input" style={{ border: 'none', background: 'transparent', padding: 4, minWidth: 0 }}
            placeholder="Buscar alumno…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </header>

      <div className="card">
        <div className="scroll-x">
          {misAlumnos.length ? (
            <table className="table">
              <thead>
                <tr><th>Alumno</th><th>Cédula</th><th>Registros</th><th></th></tr>
              </thead>
              <tbody>
                {misAlumnos.map(a => {
                  const n = itemsDe(a.id).length
                  return (
                    <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => abrir(a)}>
                      <td style={{ fontWeight: 600 }}>{a.nombre} {a.apellido}</td>
                      <td style={{ color: 'var(--text-soft)' }}>{a.cedula || '—'}</td>
                      <td>{n ? <span className="badge badge-neutral">{n}</span> : <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>—</span>}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); abrir(a) }}>Gestionar</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : <Empty icon={Users} title="Sin alumnos en este grado"
                hint="Cuando el administrador inscriba alumnos en tu grado y sección, aparecerán aquí." />}
        </div>
      </div>

      {/* ---------- Ficha del alumno ---------- */}
      {sel && (
        <Modal wide onClose={cerrar}
          title={`${sel.nombre} ${sel.apellido}`}
          footer={<button className="btn btn-ghost" onClick={cerrar}>Cerrar</button>}>

          <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-soft)', marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="badge badge-neutral">Cédula: {sel.cedula || '—'}</span>
            <span className="badge badge-accent">{miMaestro?.grado}{miMaestro?.seccion && ` · ${miMaestro.seccion}`}</span>
          </div>

          {/* Pestañas de categoría */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {CATEGORIAS.map(c => {
              const count = itemsDe(sel.id).filter(i => i.categoria === c.key).length
              const active = c.key === cat
              return (
                <button key={c.key} onClick={() => { setCat(c.key); setForm(emptyItem) }}
                  className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}>
                  <c.icon size={15} /> {c.label}{count > 0 && ` (${count})`}
                </button>
              )
            })}
          </div>

          {def.soon && (
            <div className="badge badge-warning" style={{ marginBottom: 14 }}>
              Módulo de tareas en desarrollo · por ahora puedes dejar anotaciones básicas
            </div>
          )}

          {/* Lista de ítems de la categoría activa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {itemsCat.length ? itemsCat.map(i => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {i.titulo}
                    {i.materia && <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}> · {i.materia}</span>}
                    {i.valor && <span className="badge badge-primary" style={{ marginLeft: 8 }}>{i.valor}</span>}
                  </div>
                  {i.detalle && <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 3 }}>{i.detalle}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>{(i.created_at || '').slice(0, 10)}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => items.remove(i.id)} title="Eliminar"><Trash2 size={15} /></button>
              </div>
            )) : <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Sin registros en «{def.label}». Agrega el primero abajo.</p>}
          </div>

          {/* Formulario para agregar ítem */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)' }}>Agregar a «{def.label}»</p>
            <div className="grid-form">
              <div className="field"><label>Título *</label>
                <input className="input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder={def.conValor ? 'Ej: Examen unidad 1' : 'Ej: Penicilina'} />
              </div>
              {def.conMateria && (
                <div className="field"><label>Materia</label>
                  <input className="input" value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value }))} placeholder="Ej: Matemática" />
                </div>
              )}
              {def.conValor && (
                <div className="field"><label>Nota / Valor</label>
                  <input className="input" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="Ej: 18/20" />
                </div>
              )}
            </div>
            <div className="field"><label>Detalle (opcional)</label>
              <textarea className="input" rows={2} value={form.detalle} onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))} />
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={agregar}>
              <Plus size={16} /> Agregar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
