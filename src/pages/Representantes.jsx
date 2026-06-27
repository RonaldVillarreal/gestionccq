import { useState } from 'react'
import { Plus, Trash2, Users, ChevronDown, ChevronRight, Phone, Mail, GraduationCap } from 'lucide-react'
import { Modal, Empty, WhatsAppButton } from '../components/UI'
import { useTable } from '../lib/useTable'

const empty = { nombre: '', apellido: '', cedula: '', telefono: '', email: '', parentesco: 'Madre' }

export default function Representantes () {
  const representantes = useTable('representantes')
  const alumnos = useTable('alumnos')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [openId, setOpenId] = useState(null)

  function set (k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar () {
    if (!form.nombre || !form.apellido) return alert('Nombre y apellido obligatorios.')
    await representantes.insert(form)
    setModal(false); setForm(empty)
  }

  const childrenOf = (repId) => alumnos.rows.filter(a => a.representante_id === repId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Representantes</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>{representantes.rows.length} representantes · cada uno puede tener varios alumnos a cargo.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nuevo representante</button>
      </header>

      {representantes.rows.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {representantes.rows.map(r => {
            const childs = childrenOf(r.id)
            const open = openId === r.id
            return (
              <div key={r.id} className="card">
                <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                  onClick={() => setOpenId(open ? null : r.id)}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 6 }}>
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontWeight: 700, fontFamily: 'Fraunces, serif' }}>
                    {r.nombre?.[0]}{r.apellido?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{r.nombre} {r.apellido}</div>
                    <div style={{ color: 'var(--text-soft)', fontSize: 13, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span>{r.parentesco}</span>
                      {r.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{r.telefono}</span>}
                      {r.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} />{r.email}</span>}
                    </div>
                  </div>
                  <span className="badge badge-primary"><GraduationCap size={13} /> {childs.length} alumno{childs.length !== 1 && 's'}</span>
                  <WhatsAppButton phone={r.telefono} message={`Hola ${r.nombre}, le escribimos desde el colegio.`} />
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); confirm('¿Eliminar representante?') && representantes.remove(r.id) }}>
                    <Trash2 size={15} />
                  </button>
                </div>

                {open && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--surface-2)' }}>
                    {childs.length ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {childs.map(a => (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, padding: '6px 0' }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>
                              {a.nombre?.[0]}
                            </div>
                            <span style={{ fontWeight: 600 }}>{a.nombre} {a.apellido}</span>
                            <span className="badge badge-neutral">{a.nivel} · {a.grado}</span>
                            {a.moroso && <span className="badge badge-danger">Moroso ${a.monto_deuda}</span>}
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Aún no tiene alumnos vinculados. Asígnalos desde la sección Alumnos.</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : <div className="card"><Empty icon={Users} title="Sin representantes" hint="Se crean aquí o automáticamente al cargar un alumno." /></div>}

      {modal && (
        <Modal title="Nuevo representante" onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar}>Guardar</button>
          </>}>
          <div className="grid-form">
            <div className="field"><label>Nombre *</label><input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
            <div className="field"><label>Apellido *</label><input className="input" value={form.apellido} onChange={e => set('apellido', e.target.value)} /></div>
            <div className="field"><label>Cédula</label><input className="input" value={form.cedula} onChange={e => set('cedula', e.target.value)} /></div>
            <div className="field"><label>Teléfono (WhatsApp)</label><input className="input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+58..." /></div>
            <div className="field"><label>Email</label><input className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="field"><label>Parentesco</label>
              <select className="select" value={form.parentesco} onChange={e => set('parentesco', e.target.value)}>
                {['Madre', 'Padre', 'Tutor', 'Abuelo/a', 'Otro'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
