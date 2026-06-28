import { useMemo, useState } from 'react'
import { Plus, Trash2, Library, GraduationCap, ExternalLink, BookOpen } from 'lucide-react'
import { Modal, Empty } from '../../components/UI'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'
import { materiaEmoji } from '../../lib/gamification'

const empty = { materia_id: '', titulo: '', autor: '', descripcion: '', url: '' }

export default function Biblioteca () {
  const { user } = useAuth()
  const maestros = useTable('maestros')
  const materias = useTable('materias')
  const libros = useTable('libros')

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)

  const miMaestro = useMemo(() => maestros.rows.find(m => m.usuario_id === user?.id), [maestros.rows, user])
  const misMaterias = useMemo(() => (miMaestro ? materias.rows.filter(m => m.maestro_id === miMaestro.id) : []), [materias.rows, miMaestro])
  const misLibros = useMemo(
    () => (miMaestro?.grado ? libros.rows.filter(l => l.maestro_id === miMaestro.id || (l.grado === miMaestro.grado && (!l.seccion || l.seccion === miMaestro.seccion))) : []),
    [libros.rows, miMaestro]
  )

  function set (k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar () {
    if (!form.materia_id) return alert('Elige la materia.')
    if (!form.titulo.trim()) return alert('Ponle un título al libro.')
    if (!form.url.trim()) return alert('Pega el enlace (URL) del PDF.')
    const mat = misMaterias.find(m => m.id === form.materia_id)
    await libros.insert({
      materia_id: form.materia_id, maestro_id: miMaestro.id,
      grado: miMaestro.grado, seccion: miMaestro.seccion || '',
      titulo: form.titulo, autor: form.autor, descripcion: form.descripcion, url: form.url.trim(),
      color: mat?.color || '#2A2F6B',
    })
    cerrar()
  }
  function cerrar () { setModal(false); setForm(empty) }

  if (!maestros.loading && !miMaestro?.grado) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <h1 style={{ fontSize: 28 }}>Biblioteca</h1>
        <div className="card"><Empty icon={GraduationCap} title="Aún no tienes un grado asignado"
          hint="Pídele al administrador que te asigne un grado y sección para poder publicar libros." /></div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Biblioteca</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-accent"><GraduationCap size={13} /> {miMaestro?.grado}{miMaestro?.seccion && ` · ${miMaestro.seccion}`}</span>
            <span>Comparte los libros (PDF por enlace) que verán tus alumnos.</span>
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)} disabled={!misMaterias.length}>
          <Plus size={16} /> Agregar libro
        </button>
      </header>

      {!misMaterias.length && (
        <div className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>
          Primero crea materias en Planificación para poder asociar libros.
        </div>
      )}

      {misLibros.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16 }}>
          {misLibros.map(l => {
            const mat = materias.rows.find(m => m.id === l.materia_id)
            const color = l.color || mat?.color || 'var(--primary)'
            return (
              <div key={l.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ height: 96, background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`, display: 'grid', placeItems: 'center' }}>
                  <span style={{ fontSize: 40 }}>{materiaEmoji(mat?.nombre || '')}</span>
                </div>
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{l.titulo}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{mat?.nombre}{l.autor && ` · ${l.autor}`}</div>
                  {l.descripcion && <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{l.descripcion}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                    <a className="btn btn-ghost btn-sm" href={l.url} target="_blank" rel="noreferrer" style={{ flex: 1, justifyContent: 'center' }}>
                      <BookOpen size={14} /> Ver <ExternalLink size={12} />
                    </a>
                    <button className="btn btn-ghost btn-sm" onClick={() => confirm('¿Eliminar este libro?') && libros.remove(l.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : <div className="card"><Empty icon={Library} title="Aún no has agregado libros"
            hint="Agrega el primer libro con su enlace PDF y tus alumnos lo verán en su biblioteca." /></div>}

      {modal && (
        <Modal title="Agregar libro" onClose={cerrar} wide
          footer={<>
            <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar}>Guardar libro</button>
          </>}>
          <div className="grid-form">
            <div className="field"><label>Materia *</label>
              <select className="select" value={form.materia_id} onChange={e => set('materia_id', e.target.value)}>
                <option value="">— Elige —</option>
                {misMaterias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="field"><label>Autor / Editorial</label>
              <input className="input" value={form.autor} onChange={e => set('autor', e.target.value)} placeholder="Ej: Editorial Santillana" />
            </div>
          </div>
          <div className="field"><label>Título *</label>
            <input className="input" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ej: Matemática 3° — Libro guía" />
          </div>
          <div className="field"><label>Enlace del PDF *</label>
            <input className="input" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://… (Drive, Appwrite Storage, etc.)" />
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Pega un enlace público al PDF. Asegúrate de que cualquiera con el enlace pueda verlo.</span>
          </div>
          <div className="field"><label>Descripción</label>
            <textarea className="input" rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Breve descripción del libro" />
          </div>
        </Modal>
      )}
    </div>
  )
}
