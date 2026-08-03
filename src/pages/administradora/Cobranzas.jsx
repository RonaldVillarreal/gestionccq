import { useMemo } from 'react'
import { AlertTriangle, MessageCircle, Mail, CheckCircle2, Receipt } from 'lucide-react'
import { Empty } from '../../components/UI'
import { useTable } from '../../lib/useTable'
import { esDeuda, mensajeCobranza, etiquetaPeriodo, deudaDeAlumno } from '../../lib/finanzas'

/* Cobranzas: agrupa la deuda por alumno para gestionarla en un solo lugar.
   Enviar recordatorios (WhatsApp/correo) y registrar el pago. */
export default function Cobranzas () {
  const facturas = useTable('facturas')
  const alumnos = useTable('alumnos')
  const representantes = useTable('representantes')

  const alumno = (id) => alumnos.rows.find(a => a.id === id)
  const rep = (id) => representantes.rows.find(r => r.id === id)

  // Un grupo por alumno con facturas pendientes, con su deuda total.
  const grupos = useMemo(() => {
    const deuda = facturas.rows.filter(esDeuda)
    const porAlumno = {}
    for (const f of deuda) (porAlumno[f.alumno_id] ||= []).push(f)
    return Object.entries(porAlumno).map(([alumnoId, fs]) => {
      const a = alumno(alumnoId)
      const r = a ? rep(a.representante_id) : null
      const total = fs.reduce((s, f) => s + (Number(f.monto) || 0), 0)
      return { alumnoId, a, r, fs, total }
    }).sort((x, y) => y.total - x.total)
  }, [facturas.rows, alumnos.rows, representantes.rows])

  const totalDeuda = grupos.reduce((s, g) => s + g.total, 0)

  async function sincronizarMoroso (alumnoId, listaFacturas) {
    const d = listaFacturas.filter(f => f.alumno_id === alumnoId && esDeuda(f)).reduce((s, f) => s + (Number(f.monto) || 0), 0)
    if (alumno(alumnoId)) await alumnos.update(alumnoId, { moroso: d > 0, monto_deuda: d })
  }

  function mensajeGrupo (g) {
    const conceptos = g.fs.map(f => etiquetaPeriodo(f.periodo)).join(', ')
    return mensajeCobranza({
      repNombre: g.r ? `${g.r.nombre} ${g.r.apellido}` : '',
      alumnoNombre: g.a ? `${g.a.nombre} ${g.a.apellido}` : 'su representado',
      concepto: conceptos, monto: g.total, periodo: '',
    })
  }

  function whatsapp (g) {
    if (!g.r?.telefono) return alert('El representante no tiene teléfono cargado.')
    window.open(`https://wa.me/${g.r.telefono.replace(/[^\d]/g, '')}?text=${encodeURIComponent(mensajeGrupo(g))}`, '_blank')
    marcarEnviadas(g)
  }
  function correo (g) {
    if (!g.r?.email) return alert('El representante no tiene correo cargado.')
    window.open(`mailto:${g.r.email}?subject=${encodeURIComponent('Recordatorio de pago · Colegio Cardenal Quintero')}&body=${encodeURIComponent(mensajeGrupo(g))}`)
    marcarEnviadas(g)
  }
  async function marcarEnviadas (g) {
    for (const f of g.fs.filter(f => f.estado === 'pendiente')) await facturas.update(f.id, { estado: 'enviada' })
  }
  async function registrarPago (g) {
    if (!confirm(`¿Registrar como pagadas las ${g.fs.length} factura(s) de ${g.a?.nombre || 'este alumno'} ($${g.total})?`)) return
    const hoy = new Date().toISOString().slice(0, 10)
    for (const f of g.fs) await facturas.update(f.id, { estado: 'pagada', fecha_pago: hoy })
    await sincronizarMoroso(g.alumnoId, facturas.rows.map(f => g.fs.some(x => x.id === f.id) ? { ...f, estado: 'pagada' } : f))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h1 style={{ fontSize: 28 }}>Cobranzas</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Representantes con pagos pendientes. Envía el recordatorio y registra el pago.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
        <div className="card card-pad">
          <div style={{ color: 'var(--text-soft)', fontSize: 13 }}>Representantes con deuda</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700, color: 'var(--danger)' }}>{grupos.length}</div>
        </div>
        <div className="card card-pad">
          <div style={{ color: 'var(--text-soft)', fontSize: 13 }}>Total por cobrar</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700 }}>${totalDeuda}</div>
        </div>
      </div>

      {grupos.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 16 }}>
          {grupos.map(g => (
            <div key={g.alumnoId} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{g.a ? `${g.a.nombre} ${g.a.apellido}` : 'Alumno'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{g.a?.grado} · Rep: {g.r ? `${g.r.nombre} ${g.r.apellido}` : '—'}</div>
                </div>
                <span className="badge badge-danger">${g.total}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {g.fs.map(f => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 10px', borderRadius: 8, background: 'var(--surface-2)' }}>
                    <span>{f.concepto} · {etiquetaPeriodo(f.periodo)}</span>
                    <strong>${f.monto}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                <button className="btn-wa" onClick={() => whatsapp(g)} title="Recordatorio por WhatsApp"><MessageCircle size={16} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => correo(g)} title="Recordatorio por correo"><Mail size={15} /></button>
                <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => registrarPago(g)}>
                  <CheckCircle2 size={15} /> Registrar pago
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="card"><Empty icon={CheckCircle2} title="¡Todo al día!" hint="No hay pagos pendientes por cobrar." /></div>}
    </div>
  )
}
