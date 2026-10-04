import { useMemo, useState } from 'react'
import { Plus, Trash2, FileText, Send, CheckCircle2, MessageCircle, Mail, Search } from 'lucide-react'
import { Modal, Empty, useNombreInstitucion } from '../../components/UI'
import { useTable } from '../../lib/useTable'
import { ESTADOS, esDeuda, deudaDeAlumno, mensajeCobranza, etiquetaPeriodo } from '../../lib/finanzas'

const hoy = () => new Date().toISOString().slice(0, 10)
const periodoActual = () => new Date().toISOString().slice(0, 7)
const empty = () => ({ alumno_id: '', concepto: 'Mensualidad', monto: '', periodo: periodoActual() })

/* Ficha del alumno elegido en el buscador, con opción de cambiarlo. */
function SeleccionAlumno ({ a, r, deuda, onCambiar }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-soft)', border: '1px solid var(--primary)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{a?.nombre} {a?.apellido}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
          {a?.grado}{a?.seccion && ` · ${a.seccion}`} · Rep: {r ? `${r.nombre} ${r.apellido}` : 'sin asignar'}
          {deuda > 0 && <> · Deuda actual: <strong>${deuda}</strong></>}
        </div>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onCambiar}>Cambiar</button>
    </div>
  )
}

export default function Facturacion () {
  const nombreInst = useNombreInstitucion()
  const facturas = useTable('facturas')
  const alumnos = useTable('alumnos')
  const representantes = useTable('representantes')

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty())
  const [q, setQ] = useState('')
  const [busca, setBusca] = useState('')   // buscador de alumno/representante en el modal

  const alumno = (id) => alumnos.rows.find(a => a.id === id)
  const rep = (id) => representantes.rows.find(r => r.id === id)
  const nombreAlumno = (id) => { const a = alumno(id); return a ? `${a.nombre} ${a.apellido}` : '—' }
  const repDeAlumno = (a) => (a ? rep(a.representante_id) : null)
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  // Candidatos del buscador: filtra por nombre/cédula/grado del alumno
  // O por el nombre del representante. Sin texto, no muestra nada (evita
  // listar cientos). Con texto, muestra hasta 8 coincidencias.
  const candidatos = useMemo(() => {
    const s = norm(busca).trim()
    if (s.length < 2) return []
    return alumnos.rows.filter(a => {
      const r = repDeAlumno(a)
      const heno = norm(`${a.nombre} ${a.apellido} ${a.cedula} ${a.grado} ${a.seccion} ${r ? r.nombre + ' ' + r.apellido + ' ' + r.cedula : ''}`)
      return heno.includes(s)
    }).slice(0, 8)
  }, [busca, alumnos.rows, representantes.rows])

  const lista = useMemo(() => {
    const s = q.toLowerCase()
    return [...facturas.rows]
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .filter(f => `${nombreAlumno(f.alumno_id)} ${f.concepto} ${f.periodo}`.toLowerCase().includes(s))
  }, [facturas.rows, alumnos.rows, q])

  // Mantiene el estado de morosidad del alumno sincronizado con sus facturas.
  async function sincronizarMoroso (alumnoId, listaFacturas) {
    const deuda = listaFacturas
      .filter(f => f.alumno_id === alumnoId && esDeuda(f))
      .reduce((s, f) => s + (Number(f.monto) || 0), 0)
    const a = alumno(alumnoId)
    if (a) await alumnos.update(alumnoId, { moroso: deuda > 0, monto_deuda: deuda })
  }

  function set (k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar () {
    if (!form.alumno_id) return alert('Elige el alumno.')
    if (!(Number(form.monto) > 0)) return alert('Ingresa un monto válido.')
    const a = alumno(form.alumno_id)
    const nueva = await facturas.insert({
      alumno_id: form.alumno_id, representante_id: a?.representante_id || '',
      concepto: form.concepto.trim() || 'Mensualidad', monto: Number(form.monto),
      periodo: form.periodo, estado: 'pendiente', fecha_emision: hoy(), fecha_pago: '',
    })
    await sincronizarMoroso(form.alumno_id, [...facturas.rows, nueva])
    setModal(false); setForm(empty()); setBusca('')
  }

  async function cambiarEstado (f, estado) {
    const patch = { estado, fecha_pago: estado === 'pagada' ? hoy() : '' }
    await facturas.update(f.id, patch)
    await sincronizarMoroso(f.alumno_id, facturas.rows.map(x => x.id === f.id ? { ...x, ...patch } : x))
  }

  async function eliminar (f) {
    if (!confirm('¿Eliminar esta factura?')) return
    await facturas.remove(f.id)
    await sincronizarMoroso(f.alumno_id, facturas.rows.filter(x => x.id !== f.id))
  }

  function contactos (f) {
    const r = rep(f.representante_id) || (alumno(f.alumno_id) ? rep(alumno(f.alumno_id).representante_id) : null)
    const msg = mensajeCobranza({
      repNombre: r ? `${r.nombre} ${r.apellido}` : '', alumnoNombre: nombreAlumno(f.alumno_id),
      concepto: f.concepto, monto: f.monto, periodo: f.periodo, institucion: nombreInst,
    })
    return { r, msg }
  }

  async function enviarWhatsApp (f) {
    const { r, msg } = contactos(f)
    if (!r?.telefono) return alert('El representante no tiene teléfono cargado.')
    window.open(`https://wa.me/${r.telefono.replace(/[^\d]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
    if (f.estado === 'pendiente') await cambiarEstado(f, 'enviada')
  }
  async function enviarMail (f) {
    const { r, msg } = contactos(f)
    if (!r?.email) return alert('El representante no tiene correo cargado.')
    window.open(`mailto:${r.email}?subject=${encodeURIComponent('Recordatorio de pago · ' + nombreInst)}&body=${encodeURIComponent(msg)}`)
    if (f.estado === 'pendiente') await cambiarEstado(f, 'enviada')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Facturación</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Emite facturas y envíalas al representante por WhatsApp o correo.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setForm(empty()); setBusca(''); setModal(true) }}>
          <Plus size={16} /> Nueva factura
        </button>
      </header>

      <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={16} color="var(--text-faint)" />
        <input className="input" style={{ border: 'none', background: 'transparent', padding: 4 }}
          placeholder="Buscar por alumno, concepto o periodo…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="card">
        <div className="scroll-x">
          {lista.length ? (
            <table className="table">
              <thead>
                <tr><th>Alumno</th><th>Concepto</th><th>Periodo</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {lista.map(f => {
                  const st = ESTADOS[f.estado] || ESTADOS.pendiente
                  return (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 600 }}>{nombreAlumno(f.alumno_id)}</td>
                      <td style={{ color: 'var(--text-soft)' }}>{f.concepto}</td>
                      <td>{etiquetaPeriodo(f.periodo)}</td>
                      <td><strong>${f.monto}</strong></td>
                      <td><span className={`badge ${st.badge}`}>{st.label}</span></td>
                      <td>
                        <div className="row-actions">
                          {esDeuda(f) && <>
                            <button className="btn-wa" onClick={() => enviarWhatsApp(f)} title="Enviar por WhatsApp"><MessageCircle size={15} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => enviarMail(f)} title="Enviar por correo"><Mail size={15} /></button>
                            <button className="btn btn-primary btn-sm" onClick={() => cambiarEstado(f, 'pagada')} title="Marcar como pagada"><CheckCircle2 size={15} /></button>
                          </>}
                          {f.estado === 'pagada' && <button className="btn btn-ghost btn-sm" onClick={() => cambiarEstado(f, 'pendiente')}>Reabrir</button>}
                          <button className="btn btn-ghost btn-sm" onClick={() => eliminar(f)} title="Eliminar"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : <Empty icon={FileText} title="Sin facturas" hint="Crea la primera factura con el botón «Nueva factura»." />}
        </div>
      </div>

      {modal && (
        <Modal title="Nueva factura" onClose={() => setModal(false)} wide
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar}><Send size={16} /> Emitir factura</button>
          </>}>
          {/* Buscador de alumno/representante (doble filtro) */}
          <div className="field">
            <label>Alumno o representante *</label>
            {form.alumno_id ? (
              <SeleccionAlumno a={alumno(form.alumno_id)} r={repDeAlumno(alumno(form.alumno_id))}
                deuda={deudaDeAlumno(facturas.rows, form.alumno_id)}
                onCambiar={() => { set('alumno_id', ''); setBusca('') }} />
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)' }}>
                  <Search size={16} color="var(--text-faint)" />
                  <input className="input" style={{ border: 'none', background: 'transparent', padding: '8px 4px' }} autoFocus
                    placeholder="Escribe el nombre del alumno o del representante…" value={busca} onChange={e => setBusca(e.target.value)} />
                </div>
                {busca.trim().length >= 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, maxHeight: 240, overflowY: 'auto' }}>
                    {candidatos.length ? candidatos.map(a => {
                      const r = repDeAlumno(a)
                      return (
                        <button key={a.id} type="button" onClick={() => { set('alumno_id', a.id); setBusca('') }}
                          style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{a.nombre} {a.apellido}</div>
                            <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>
                              {a.grado}{a.seccion && ` · ${a.seccion}`} · Rep: {r ? `${r.nombre} ${r.apellido}` : 'sin asignar'}
                            </div>
                          </div>
                          {a.moroso && <span className="badge badge-danger">Debe ${a.monto_deuda}</span>}
                        </button>
                      )
                    }) : <span style={{ fontSize: 13, color: 'var(--text-faint)', padding: '6px 4px' }}>Sin coincidencias para «{busca}».</span>}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid-form">
            <div className="field"><label>Concepto</label><input className="input" value={form.concepto} onChange={e => set('concepto', e.target.value)} placeholder="Ej: Mensualidad, Inscripción" /></div>
            <div className="field"><label>Monto (USD) *</label><input className="input" type="number" min="0" step="0.01" value={form.monto} onChange={e => set('monto', e.target.value)} placeholder="Ej: 45" /></div>
            <div className="field"><label>Periodo</label><input className="input" type="month" value={form.periodo} onChange={e => set('periodo', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
