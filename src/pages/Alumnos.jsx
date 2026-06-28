import { useMemo, useState } from 'react'
import { Plus, Upload, Trash2, GraduationCap, Download, Search, UserPlus, KeyRound, Pencil } from 'lucide-react'
import { Modal, Empty } from '../components/UI'
import { useTable } from '../lib/useTable'
import { readExcel, downloadTemplate } from '../lib/excel'

const NIVELES = ['Primaria', 'Secundaria']
const empty = { nombre: '', apellido: '', cedula: '', nivel: 'Primaria', grado: '', seccion: '', representante_id: '', moroso: false, monto_deuda: 0, usuario: '', pass: '' }

export default function Alumnos () {
  const alumnos = useTable('alumnos')
  const representantes = useTable('representantes')
  const usuarios = useTable('usuarios')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [q, setQ] = useState('')
  const [newRep, setNewRep] = useState(false)
  const [repForm, setRepForm] = useState({ nombre: '', apellido: '', cedula: '', telefono: '', email: '', parentesco: 'Madre' })
  const [importing, setImporting] = useState(false)

  const repName = (id) => {
    const r = representantes.rows.find(x => x.id === id)
    return r ? `${r.nombre} ${r.apellido}` : '—'
  }

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return alumnos.rows.filter(a =>
      `${a.nombre} ${a.apellido} ${a.cedula} ${a.grado}`.toLowerCase().includes(s))
  }, [alumnos.rows, q])

  function set (k, v) { setForm(f => ({ ...f, [k]: v })) }

  // Abre el modal en modo edición con los datos del alumno (incluido su login si lo tiene).
  function editar (a) {
    const u = usuarios.rows.find(x => x.id === a.usuario_id)
    setEditId(a.id)
    setForm({
      nombre: a.nombre || '', apellido: a.apellido || '', cedula: a.cedula || '',
      nivel: a.nivel || 'Primaria', grado: a.grado || '', seccion: a.seccion || '',
      representante_id: a.representante_id || '', moroso: !!a.moroso, monto_deuda: a.monto_deuda || 0,
      usuario: u?.usuario || '', pass: '',
    })
    setModal(true)
  }

  async function guardar () {
    if (!form.nombre || !form.apellido) return alert('Nombre y apellido son obligatorios.')
    let repId = form.representante_id
    // Si el usuario creó un representante nuevo en línea, lo guardamos primero.
    if (newRep && repForm.nombre) {
      const r = await representantes.insert(repForm)
      repId = r.id
    }
    // Acceso al portal del alumno (opcional): reutiliza el usuario si ya existe,
    // o crea uno nuevo con rol "alumno" cuando se indica usuario y contraseña.
    let usuario_id = editId ? (alumnos.rows.find(a => a.id === editId)?.usuario_id || null) : null
    if (form.usuario) {
      const existente = usuarios.rows.find(u => u.usuario?.toLowerCase() === form.usuario.trim().toLowerCase())
      if (existente) {
        usuario_id = existente.id
        // Si se escribió una nueva contraseña, la actualizamos en el usuario.
        if (form.pass && form.pass !== existente.pass) await usuarios.update(existente.id, { pass: form.pass })
      } else if (form.pass) {
        const u = await usuarios.insert({ nombre: `${form.nombre} ${form.apellido}`, usuario: form.usuario.trim(), pass: form.pass, rol: 'alumno' })
        usuario_id = u.id
      }
    }
    const { usuario, pass, ...datos } = form
    const payload = { ...datos, representante_id: repId, usuario_id, monto_deuda: Number(form.monto_deuda) || 0 }
    if (editId) await alumnos.update(editId, payload)
    else await alumnos.insert(payload)
    cerrar()
  }

  function cerrar () {
    setModal(false); setEditId(null); setForm(empty); setNewRep(false)
    setRepForm({ nombre: '', apellido: '', cedula: '', telefono: '', email: '', parentesco: 'Madre' })
  }

  async function importar (e) {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    try {
      const rows = await readExcel(file)
      for (const r of rows) {
        // Permite que el Excel traiga datos del representante para vincularlo/crearlo.
        let repId = ''
        const repCedula = r.representante_cedula || r.rep_cedula
        if (repCedula) {
          const existing = representantes.rows.find(x => x.cedula === String(repCedula))
          if (existing) repId = existing.id
          else if (r.representante_nombre) {
            const nr = await representantes.insert({
              nombre: r.representante_nombre || '', apellido: r.representante_apellido || '',
              cedula: String(repCedula), telefono: String(r.representante_telefono || ''),
              email: r.representante_email || '', parentesco: r.parentesco || 'Representante',
            })
            repId = nr.id
          }
        }
        await alumnos.insert({
          nombre: r.nombre || '', apellido: r.apellido || '', cedula: String(r.cedula || ''),
          nivel: r.nivel || 'Primaria', grado: r.grado || '', seccion: r.seccion || '',
          representante_id: repId, moroso: false, monto_deuda: 0,
        })
      }
      await representantes.refresh()
      alert(`Importados ${rows.length} alumnos.`)
    } catch (err) { alert('Error al leer el archivo: ' + err.message) }
    finally { setImporting(false); e.target.value = '' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Alumnos</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>{alumnos.rows.length} inscritos · gestiona altas individuales o por Excel.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => downloadTemplate('plantilla_alumnos.xlsx',
            ['nombre', 'apellido', 'cedula', 'nivel', 'grado', 'seccion', 'representante_nombre', 'representante_apellido', 'representante_cedula', 'representante_telefono', 'parentesco'])}>
            <Download size={16} /> Plantilla
          </button>
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> {importing ? 'Importando…' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={importar} />
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nuevo alumno</button>
        </div>
      </header>

      <div className="card">
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="var(--text-faint)" />
          <input className="input" style={{ border: 'none', background: 'transparent', padding: 4 }}
            placeholder="Buscar por nombre, cédula o grado…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="scroll-x">
          {filtered.length ? (
            <table className="table">
              <thead>
                <tr><th>Alumno</th><th>Cédula</th><th>Nivel</th><th>Grado / Sección</th><th>Representante</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {a.nombre} {a.apellido}
                        {a.usuario_id && <span title="Tiene acceso al portal del alumno"><KeyRound size={13} color="var(--primary)" /></span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-soft)' }}>{a.cedula || '—'}</td>
                    <td><span className="badge badge-neutral">{a.nivel}</span></td>
                    <td>{a.grado} {a.seccion && `· ${a.seccion}`}</td>
                    <td>{repName(a.representante_id)}</td>
                    <td>{a.moroso
                      ? <span className="badge badge-danger">Moroso · ${a.monto_deuda}</span>
                      : <span className="badge badge-success">Al día</span>}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => editar(a)} title="Editar / vincular acceso">
                          <Pencil size={15} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => confirm('¿Eliminar alumno?') && alumnos.remove(a.id)} title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty icon={GraduationCap} title="Sin alumnos" hint="Agrega uno nuevo o importa desde Excel." />}
        </div>
      </div>

      {modal && (
        <Modal title={editId ? 'Editar alumno' : 'Nuevo alumno'} onClose={cerrar} wide
          footer={<>
            <button className="btn btn-ghost" onClick={cerrar}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar}>{editId ? 'Guardar cambios' : 'Guardar alumno'}</button>
          </>}>
          <div className="grid-form">
            <div className="field"><label>Nombre *</label><input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
            <div className="field"><label>Apellido *</label><input className="input" value={form.apellido} onChange={e => set('apellido', e.target.value)} /></div>
            <div className="field"><label>Cédula / ID</label><input className="input" value={form.cedula} onChange={e => set('cedula', e.target.value)} /></div>
            <div className="field"><label>Nivel</label>
              <select className="select" value={form.nivel} onChange={e => set('nivel', e.target.value)}>
                {NIVELES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="field"><label>Grado / Año</label><input className="input" value={form.grado} onChange={e => set('grado', e.target.value)} placeholder="Ej: 3er Grado" /></div>
            <div className="field"><label>Sección</label><input className="input" value={form.seccion} onChange={e => set('seccion', e.target.value)} placeholder="A, B, U…" /></div>
          </div>

          {/* Representante: vincula uno existente o crea en línea (poblará la sección Representantes) */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-soft)' }}>Representante legal</label>
              <button className="btn btn-ghost btn-sm" onClick={() => setNewRep(v => !v)}>
                <UserPlus size={15} /> {newRep ? 'Elegir existente' : 'Crear nuevo'}
              </button>
            </div>

            {!newRep ? (
              <select className="select" value={form.representante_id} onChange={e => set('representante_id', e.target.value)}>
                <option value="">— Sin asignar —</option>
                {representantes.rows.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre} {r.apellido} · {r.cedula}</option>
                ))}
              </select>
            ) : (
              <div className="grid-form">
                <div className="field"><label>Nombre</label><input className="input" value={repForm.nombre} onChange={e => setRepForm({ ...repForm, nombre: e.target.value })} /></div>
                <div className="field"><label>Apellido</label><input className="input" value={repForm.apellido} onChange={e => setRepForm({ ...repForm, apellido: e.target.value })} /></div>
                <div className="field"><label>Cédula</label><input className="input" value={repForm.cedula} onChange={e => setRepForm({ ...repForm, cedula: e.target.value })} /></div>
                <div className="field"><label>Teléfono</label><input className="input" value={repForm.telefono} onChange={e => setRepForm({ ...repForm, telefono: e.target.value })} placeholder="+58..." /></div>
                <div className="field"><label>Email</label><input className="input" value={repForm.email} onChange={e => setRepForm({ ...repForm, email: e.target.value })} /></div>
                <div className="field"><label>Parentesco</label>
                  <select className="select" value={repForm.parentesco} onChange={e => setRepForm({ ...repForm, parentesco: e.target.value })}>
                    {['Madre', 'Padre', 'Tutor', 'Abuelo/a', 'Otro'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Acceso al portal del alumno (opcional) */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <KeyRound size={14} /> Acceso al portal del alumno <span style={{ fontWeight: 400 }}>(opcional)</span>
            </p>
            <div className="grid-form">
              <div className="field"><label>Usuario</label><input className="input" value={form.usuario} onChange={e => set('usuario', e.target.value)} placeholder="Ej: sofia" /></div>
              <div className="field"><label>Contraseña</label><input className="input" value={form.pass} onChange={e => set('pass', e.target.value)} placeholder={editId ? 'Dejar en blanco para conservar' : ''} /></div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8, display: 'block' }}>
              Si el usuario ya existe, se vincula a este alumno. Para crear uno nuevo, escribe usuario y contraseña.
            </span>
          </div>
        </Modal>
      )}
    </div>
  )
}
