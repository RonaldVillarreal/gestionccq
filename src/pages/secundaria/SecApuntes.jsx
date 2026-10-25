import { useMemo, useState } from 'react'
import { Plus, Pin } from 'lucide-react'
import { Modal } from '../../components/UI'
import { useAlumno } from '../../lib/useAlumno'
import { useTable } from '../../lib/useTable'
import { Vacio, SinFicha } from '../../components/Secundaria'

/* Apuntes personales por materia. Solo los ve el propio alumno. */
const VACIO = { titulo: '', materia: '', contenido: '', fijado: false }

export default function SecApuntes () {
  const { alumno, misMaterias } = useAlumno()
  const apuntes = useTable('apuntes', ['alumno_id', alumno?.id])
  const [materia, setMateria] = useState('')
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const mios = useMemo(() => apuntes.rows
    .filter(a => a.alumno_id === alumno?.id)
    .filter(a => !materia || a.materia === materia)
    .filter(a => !q || `${a.titulo} ${a.contenido}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (Number(!!b.fijado) - Number(!!a.fijado)) || (b.created_at || '').localeCompare(a.created_at || '')),
  [apuntes.rows, alumno, materia, q])

  if (!alumno) return <SinFicha />

  const total = apuntes.rows.filter(a => a.alumno_id === alumno.id).length
  const color = (nombre) => misMaterias.find(m => m.nombre === nombre)?.color

  async function guardar () {
    if (!form.titulo.trim() && !form.contenido.trim()) return setForm(null)
    setGuardando(true)
    const datos = { titulo: form.titulo.trim() || 'Sin título', materia: form.materia, contenido: form.contenido, fijado: !!form.fijado, alumno_id: alumno.id }
    try {
      if (form.id) await apuntes.update(form.id, datos)
      else await apuntes.insert(datos)
      setForm(null)
    } finally { setGuardando(false) }
  }

  async function eliminar () {
    if (!confirm('¿Eliminar este apunte?')) return
    await apuntes.remove(form.id)
    setForm(null)
  }

  return (
    <>
      <div className="sec-head">
        <div>
          <h1>Apuntes</h1>
          <p>{total} {total === 1 ? 'apunte' : 'apuntes'} · solo tú puedes verlos.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setForm({ ...VACIO, materia })}><Plus size={16} /> Nuevo apunte</button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select className="select" style={{ width: 'auto', minWidth: 170 }} value={materia} onChange={e => setMateria(e.target.value)} aria-label="Filtrar por materia">
          <option value="">Todas las materias</option>
          {misMaterias.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
        </select>
        <input className="input" style={{ flex: '1 1 180px', maxWidth: 300 }} placeholder="Buscar en tus apuntes" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar en apuntes" />
      </div>

      {mios.length ? (
        <div className="sec-notes">
          {mios.map(a => (
            <button key={a.id} type="button" className="sec-card sec-note" style={{ '--c': color(a.materia) }} onClick={() => setForm({ ...VACIO, ...a })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}>
                <span className="sec-eyebrow">{a.materia || 'General'}</span>
                {a.fijado && <Pin size={14} aria-label="Fijado" style={{ color: 'var(--primary)' }} />}
              </div>
              <b style={{ fontFamily: 'var(--sec-font)', fontSize: 16 }}>{a.titulo}</b>
              <p>{a.contenido}</p>
              <span className="sec-faint" style={{ fontSize: 12, marginTop: 'auto' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : ''}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="sec-card">
          <Vacio titulo={total ? 'Sin resultados' : 'Aún no tienes apuntes'}
            texto={total ? 'Prueba con otra búsqueda o materia.' : 'Guarda resúmenes, fórmulas o lo que el profesor dijo que entra en el examen.'} />
        </div>
      )}

      {form && (
        <Modal wide title={form.id ? 'Editar apunte' : 'Nuevo apunte'} onClose={() => setForm(null)}
          footer={<>
            {form.id && <button className="btn btn-ghost" style={{ marginRight: 'auto', color: 'var(--danger)' }} onClick={eliminar}>Eliminar</button>}
            <button className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          </>}>
          <div className="grid-form">
            <div className="field"><label>Título</label><input className="input" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Fórmulas de la unidad 2" autoFocus /></div>
            <div className="field"><label>Materia</label>
              <select className="select" value={form.materia} onChange={e => setForm({ ...form, materia: e.target.value })}>
                <option value="">General</option>
                {misMaterias.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Contenido</label>
            <textarea className="textarea" style={{ minHeight: 260 }} value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })} placeholder="Escribe aquí…" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.fijado} onChange={e => setForm({ ...form, fijado: e.target.checked })} style={{ width: 17, height: 17 }} />
            Fijar arriba
          </label>
        </Modal>
      )}
    </>
  )
}
