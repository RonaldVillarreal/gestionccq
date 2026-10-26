import { useState } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { Modal, Empty, WhatsAppButton } from '../../components/UI'
import { useTable } from '../../lib/useTable'
import { TIPO_PERSONAL, esEquipoMant, textoDias, textoHora } from '../../lib/mantenimiento'

/* Personas a cargo del jefe de mantenimiento. Se guardan en `personal`
   con tipo "Mantenimiento", así el director también las ve en Personal. */
const VACIO = { nombre: '', apellido: '', cargo: 'Aseador(a)', telefono: '', email: '' }

export default function MantPersonal () {
  const personal = useTable('personal')
  const zonas = useTable('mant_zonas')
  const horarios = useTable('mant_horarios')
  const [form, setForm] = useState(null) // null | registro (con o sin id)

  const equipo = personal.rows.filter(esEquipoMant)
    .sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const zona = (id) => zonas.rows.find(z => z.id === id)

  async function guardar () {
    if (!form.nombre.trim()) return alert('El nombre es obligatorio.')
    const datos = { nombre: form.nombre.trim(), apellido: form.apellido.trim(), cargo: form.cargo, telefono: form.telefono, email: form.email, tipo: TIPO_PERSONAL }
    if (form.id) await personal.update(form.id, datos)
    else await personal.insert(datos)
    setForm(null)
  }

  async function eliminar (p) {
    const turnos = horarios.rows.filter(h => h.personal_id === p.id)
    const aviso = turnos.length ? `\nTambién se quitarán sus ${turnos.length} turno(s) asignado(s).` : ''
    if (!confirm(`¿Eliminar a ${p.nombre} ${p.apellido || ''}?${aviso}`)) return
    for (const h of turnos) await horarios.remove(h.id)
    await personal.remove(p.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Mi personal</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>{equipo.length} {equipo.length === 1 ? 'persona' : 'personas'} a tu cargo.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setForm(VACIO)}><Plus size={16} /> Agregar persona</button>
      </header>

      {equipo.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {equipo.map(p => {
            const turnos = horarios.rows.filter(h => h.personal_id === p.id)
            return (
              <div key={p.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{p.nombre[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.nombre} {p.apellido}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{p.cargo || 'Mantenimiento'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <WhatsAppButton phone={p.telefono} message={`Hola ${p.nombre}, `} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6 }}>ZONAS A CARGO</div>
                  {turnos.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {turnos.map(h => (
                        <div key={h.id} style={{ fontSize: 13 }}>
                          <b>{zona(h.zona_id)?.nombre || 'Zona eliminada'}</b>
                          <span style={{ color: 'var(--text-soft)' }}> · {textoDias(h)} · {textoHora(h)}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Sin zonas asignadas. Asígnalas en Zonas y horarios.</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setForm(p)}><Pencil size={14} /> Editar</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => eliminar(p)}><Trash2 size={14} /> Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : <div className="card"><Empty icon={Users} title="Aún no tienes personal registrado" hint="Agrega a las personas de limpieza y mantenimiento a tu cargo." /></div>}

      {form && (
        <Modal title={form.id ? 'Editar persona' : 'Agregar persona'} onClose={() => setForm(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar}>Guardar</button>
          </>}>
          <div className="grid-form">
            <div className="field"><label>Nombre *</label><input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} autoFocus /></div>
            <div className="field"><label>Apellido</label><input className="input" value={form.apellido || ''} onChange={e => set('apellido', e.target.value)} /></div>
            <div className="field"><label>Cargo</label><input className="input" value={form.cargo || ''} onChange={e => set('cargo', e.target.value)} placeholder="Ej: Aseador(a), Jardinero" /></div>
            <div className="field"><label>Teléfono (WhatsApp)</label><input className="input" value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} placeholder="+58..." /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Email</label><input className="input" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
