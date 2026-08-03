import { useState } from 'react'
import { Plus, Upload, Trash2, UserCog, Download, Mail, Phone, KeyRound, GraduationCap, Pencil } from 'lucide-react'
import { Modal, Empty, WhatsAppButton } from '../components/UI'
import { useTable } from '../lib/useTable'
import { readExcel, downloadTemplate } from '../lib/excel'

const empty = { nombre: '', apellido: '', cedula: '', telefono: '', email: '', materia: '', nivel: 'Primaria', grado: '', seccion: '', usuario: '', pass: '' }

export default function Maestros () {
  const maestros = useTable('maestros')
  const usuarios = useTable('usuarios')
  const personal = useTable('personal')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [importing, setImporting] = useState(false)

  function set (k, v) { setForm(f => ({ ...f, [k]: v })) }

  // Abre el modal en modo edición con los datos del maestro (y su login si tiene).
  function editar (m) {
    const u = usuarios.rows.find(x => x.id === m.usuario_id)
    setEditId(m.id)
    setForm({
      nombre: m.nombre || '', apellido: m.apellido || '', cedula: m.cedula || '',
      telefono: m.telefono || '', email: m.email || '', materia: m.materia || '',
      nivel: m.nivel || 'Primaria', grado: m.grado || '', seccion: m.seccion || '',
      usuario: u?.usuario || '', pass: '',
    })
    setModal(true)
  }

  async function guardar () {
    if (!form.nombre || !form.telefono) return alert('Nombre y teléfono son obligatorios.')

    // Vinculación / creación del acceso al portal (opcional).
    let usuario_id = editId ? (maestros.rows.find(m => m.id === editId)?.usuario_id || null) : null
    if (form.usuario) {
      const existente = usuarios.rows.find(u => u.usuario?.toLowerCase() === form.usuario.trim().toLowerCase())
      if (existente) {
        usuario_id = existente.id
        if (form.pass && form.pass !== existente.pass) await usuarios.update(existente.id, { pass: form.pass })
      } else if (form.pass) {
        const u = await usuarios.insert({ nombre: `${form.nombre} ${form.apellido}`, usuario: form.usuario.trim(), pass: form.pass, rol: 'maestro', email: form.email })
        usuario_id = u.id
      }
    }

    const datos = {
      nombre: form.nombre, apellido: form.apellido, cedula: form.cedula, telefono: form.telefono,
      email: form.email, materia: form.materia, nivel: form.nivel,
      grado: form.grado, seccion: form.seccion, usuario_id,
    }

    if (editId) {
      await maestros.update(editId, datos)
      // Mantiene sincronizado el registro de Personal docente vinculado.
      const p = personal.rows.find(x => x.ref_id === editId)
      if (p) await personal.update(p.id, { nombre: form.nombre, apellido: form.apellido, telefono: form.telefono, email: form.email })
    } else {
      const m = await maestros.insert(datos)
      // El maestro también es Personal docente.
      await personal.insert({ nombre: form.nombre, apellido: form.apellido, cargo: 'Maestro', tipo: 'Docente', telefono: form.telefono, email: form.email, ref_id: m.id })
    }
    cerrar()
  }

  function cerrar () { setModal(false); setEditId(null); setForm(empty) }

  async function importar (e) {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    try {
      const rows = await readExcel(file)
      for (const r of rows) {
        await maestros.insert({
          nombre: r.nombre || '', apellido: r.apellido || '', cedula: String(r.cedula || ''),
          telefono: String(r.telefono || ''), email: r.email || '', materia: r.materia || '',
          nivel: r.nivel || 'Primaria', usuario_id: null,
        })
      }
      alert(`Importados ${rows.length} maestros.`)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setImporting(false); e.target.value = '' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Maestros</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>{maestros.rows.length} docentes · contacto directo por WhatsApp.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => downloadTemplate('plantilla_maestros.xlsx', ['nombre', 'apellido', 'cedula', 'telefono', 'email', 'materia', 'nivel'])}>
            <Download size={16} /> Plantilla
          </button>
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> {importing ? 'Importando…' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={importar} />
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nuevo maestro</button>
        </div>
      </header>

      {maestros.rows.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {maestros.rows.map(m => (
            <div key={m.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 18, fontFamily: 'Fraunces, serif' }}>
                  {m.nombre?.[0]}{m.apellido?.[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{m.nombre} {m.apellido}</div>
                  {/* En primaria el maestro da todas las materias, así que solo mostramos
                      el nivel. En secundaria sí puede tener una materia concreta. */}
                  <div style={{ color: 'var(--text-soft)', fontSize: 13 }}>
                    {m.nivel === 'Secundaria' && m.materia ? `${m.materia} · Secundaria` : m.nivel}
                  </div>
                </div>
              </div>

              {m.grado && (
                <span className="badge badge-accent" style={{ alignSelf: 'flex-start' }}>
                  <GraduationCap size={12} /> {m.grado}{m.seccion && ` · ${m.seccion}`}
                </span>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-soft)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Phone size={14} /> {m.telefono || '—'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Mail size={14} /> {m.email || '—'}</span>
                {m.usuario_id && <span className="badge badge-primary" style={{ alignSelf: 'flex-start' }}><KeyRound size={12} /> Acceso al portal</span>}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <WhatsAppButton phone={m.telefono} message={`Hola ${m.nombre}, le escribimos desde el colegio.`} />
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => editar(m)} title="Editar maestro">
                  <Pencil size={15} />
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => confirm('¿Eliminar maestro?') && maestros.remove(m.id)} title="Eliminar maestro">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="card"><Empty icon={UserCog} title="Sin maestros" hint="Agrega el primer docente del colegio." /></div>}

      {modal && (
        <Modal title={editId ? 'Editar maestro' : 'Nuevo maestro'} onClose={cerrar} wide
          footer={<>
            <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar}>{editId ? 'Guardar cambios' : 'Guardar maestro'}</button>
          </>}>
          <div className="grid-form">
            <div className="field"><label>Nombre *</label><input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
            <div className="field"><label>Apellido</label><input className="input" value={form.apellido} onChange={e => set('apellido', e.target.value)} /></div>
            <div className="field"><label>Cédula</label><input className="input" value={form.cedula} onChange={e => set('cedula', e.target.value)} /></div>
            <div className="field"><label>Teléfono * (WhatsApp)</label><input className="input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+584141234567" /></div>
            <div className="field"><label>Email</label><input className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="field"><label>Materia</label><input className="input" value={form.materia} onChange={e => set('materia', e.target.value)} /></div>
            <div className="field"><label>Nivel</label>
              <select className="select" value={form.nivel} onChange={e => set('nivel', e.target.value)}>
                <option>Primaria</option><option>Secundaria</option>
              </select>
            </div>
            <div className="field"><label>Grado asignado</label><input className="input" value={form.grado} onChange={e => set('grado', e.target.value)} placeholder="Ej: 3er Grado" /></div>
            <div className="field"><label>Sección</label><input className="input" value={form.seccion} onChange={e => set('seccion', e.target.value)} placeholder="A, B, U…" /></div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 12 }}>
              Acceso al portal del maestro <span style={{ fontWeight: 400 }}>(opcional)</span>
            </p>
            <div className="grid-form">
              <div className="field"><label>Usuario</label><input className="input" value={form.usuario} onChange={e => set('usuario', e.target.value)} placeholder="Ej: anavillarreal" /></div>
              <div className="field"><label>Contraseña</label><input className="input" value={form.pass} onChange={e => set('pass', e.target.value)} placeholder={editId ? 'Dejar en blanco para conservar' : ''} /></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
