import { useState } from 'react'
import { Receipt, Bell, Send, AlertTriangle, Plus, Trash2, ShieldCheck, KeyRound } from 'lucide-react'
import { Modal, Empty, WhatsAppButton } from '../components/UI'
import { useTable } from '../lib/useTable'

/* La acción "Enviar recordatorio" está lista para conectarse a n8n en la fase 2.
   Cambia N8N_WEBHOOK por tu URL de webhook y se enviarán los datos del alumno
   moroso + su representante. Mientras tanto, abre WhatsApp directo. */
const N8N_WEBHOOK = '' // ej: 'https://tu-n8n.com/webhook/recordatorio-pago'

export default function Administrativo () {
  const alumnos = useTable('alumnos')
  const representantes = useTable('representantes')
  const usuarios = useTable('usuarios')
  const [tab, setTab] = useState('morosos')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', usuario: '', pass: '', rol: 'admin', email: '' })

  const morosos = alumnos.rows.filter(a => a.moroso)
  const totalDeuda = morosos.reduce((s, a) => s + (Number(a.monto_deuda) || 0), 0)
  const repOf = (id) => representantes.rows.find(r => r.id === id)

  async function enviarRecordatorio (alumno) {
    const rep = repOf(alumno.representante_id)
    const payload = {
      alumno: `${alumno.nombre} ${alumno.apellido}`, deuda: alumno.monto_deuda,
      representante: rep ? `${rep.nombre} ${rep.apellido}` : null,
      telefono: rep?.telefono || null, email: rep?.email || null,
    }
    if (N8N_WEBHOOK) {
      try {
        await fetch(N8N_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        alert('Recordatorio enviado a la automatización (n8n).')
      } catch { alert('No se pudo contactar al webhook de n8n.') }
    } else {
      // Fallback: abrir WhatsApp del representante
      if (rep?.telefono) {
        const msg = `Estimado/a ${rep.nombre}, le recordamos el pago pendiente de ${alumno.nombre} ${alumno.apellido} por $${alumno.monto_deuda}. Gracias.`
        window.open(`https://wa.me/${rep.telefono.replace(/[^\d]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
      } else alert('El representante no tiene teléfono cargado. Configura N8N_WEBHOOK para envío automático.')
    }
  }

  async function guardarUsuario () {
    if (!form.nombre || !form.usuario || !form.pass) return alert('Completa nombre, usuario y clave.')
    await usuarios.insert(form)
    setModal(false); setForm({ nombre: '', usuario: '', pass: '', rol: 'admin', email: '' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header>
        <h1 style={{ fontSize: 28 }}>Administrativo</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Cobranzas, recordatorios y gestión de accesos.</p>
      </header>

      <div style={{ display: 'flex', gap: 8 }}>
        {[['morosos', 'Morosos', Receipt], ['usuarios', 'Usuarios y roles', ShieldCheck]].map(([k, label, Icon]) => (
          <button key={k} className={`btn btn-sm ${tab === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(k)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'morosos' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
            <div className="card card-pad">
              <div style={{ color: 'var(--text-soft)', fontSize: 13 }}>Alumnos morosos</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700, color: 'var(--danger)' }}>{morosos.length}</div>
            </div>
            <div className="card card-pad">
              <div style={{ color: 'var(--text-soft)', fontSize: 13 }}>Total adeudado</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700 }}>${totalDeuda}</div>
            </div>
          </div>

          <div className="card">
            <div className="scroll-x">
              {morosos.length ? (
                <table className="table">
                  <thead><tr><th>Alumno</th><th>Grado</th><th>Representante</th><th>Deuda</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {morosos.map(a => {
                      const rep = repOf(a.representante_id)
                      return (
                        <tr key={a.id}>
                          <td style={{ fontWeight: 600 }}>{a.nombre} {a.apellido}</td>
                          <td>{a.nivel} · {a.grado}</td>
                          <td>{rep ? `${rep.nombre} ${rep.apellido}` : '—'}</td>
                          <td><span className="badge badge-danger">${a.monto_deuda}</span></td>
                          <td>
                            <div className="row-actions">
                              <button className="btn btn-accent btn-sm" onClick={() => enviarRecordatorio(a)}>
                                <Bell size={14} /> Recordatorio
                              </button>
                              <WhatsAppButton phone={rep?.telefono} message={`Estimado/a ${rep?.nombre || ''}, le recordamos el pago pendiente de ${a.nombre} por $${a.monto_deuda}.`} />
                              <button className="btn btn-ghost btn-sm" onClick={() => alumnos.update(a.id, { moroso: false, monto_deuda: 0 })}>Marcar pagado</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : <Empty icon={AlertTriangle} title="Sin morosos" hint="Todos los alumnos están al día." />}
            </div>
          </div>

          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
            <Send size={22} color="var(--accent)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Fase 2 · Automatización con n8n</div>
              <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
                Define <code>N8N_WEBHOOK</code> en <code>src/pages/Administrativo.jsx</code> para enviar recordatorios automáticos por WhatsApp/email. Sin webhook, el botón abre WhatsApp del representante.
              </p>
            </div>
          </div>
        </>
      )}

      {tab === 'usuarios' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nuevo usuario</button>
          </div>
          <div className="card scroll-x">
            <table className="table">
              <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Email</th><th></th></tr></thead>
              <tbody>
                {usuarios.rows.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                    <td style={{ color: 'var(--text-soft)' }}><KeyRound size={13} style={{ verticalAlign: -2 }} /> {u.usuario}</td>
                    <td><span className={`badge ${u.rol === 'admin' ? 'badge-primary' : u.rol === 'aprobador' ? 'badge-warning' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{u.rol}</span></td>
                    <td style={{ color: 'var(--text-soft)' }}>{u.email || '—'}</td>
                    <td>{u.usuario !== 'Ronald' && <button className="btn btn-ghost btn-sm" onClick={() => confirm('¿Eliminar usuario?') && usuarios.remove(u.id)}><Trash2 size={15} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal && (
        <Modal title="Nuevo usuario" onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarUsuario}>Crear acceso</button>
          </>}>
          <div className="grid-form">
            <div className="field"><label>Nombre completo *</label><input className="input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
            <div className="field"><label>Rol *</label>
              <select className="select" value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                <option value="admin">Administrador</option>
                <option value="maestro">Maestro</option>
                <option value="aprobador">Aprobador</option>
              </select>
            </div>
            <div className="field"><label>Usuario *</label><input className="input" value={form.usuario} onChange={e => setForm({ ...form, usuario: e.target.value })} /></div>
            <div className="field"><label>Contraseña *</label><input className="input" value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Email</label><input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
