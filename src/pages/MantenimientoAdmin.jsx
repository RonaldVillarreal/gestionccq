import { useMemo, useState } from 'react'
import { ClipboardList, Users, Plus, Pencil, Trash2, Store, MessageCircle } from 'lucide-react'
import { Modal, Empty, WhatsAppButton, useNombreInstitucion } from '../components/UI'
import { EditorItems, PedidoCard, ResumenZonas } from '../components/Mantenimiento'
import { useTable } from '../lib/useTable'
import { TIPO_PERSONAL, unirItems, mensajePedido, linkWhatsApp, textoDias, textoHora } from '../lib/mantenimiento'

/* Vista del director para el módulo Mantenimiento:
   pedidos del jefe de mantenimiento → armar pedido al proveedor por WhatsApp,
   zonas y horarios de limpieza, personal y proveedores. */
const TABS = [
  ['pedidos', 'Pedidos'],
  ['zonas', 'Zonas y horarios'],
  ['personal', 'Personal'],
  ['proveedores', 'Proveedores'],
]

export default function MantenimientoAdmin () {
  const pedidos = useTable('mant_pedidos')
  const proveedores = useTable('proveedores')
  const zonas = useTable('mant_zonas')
  const horarios = useTable('mant_horarios')
  const personal = useTable('personal')
  const [tab, setTab] = useState('pedidos')

  const pendientes = pedidos.rows.filter(p => p.estado === 'pendiente').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header>
        <h1 style={{ fontSize: 28 }}>Mantenimiento</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Pedidos de limpieza, zonas, horarios y proveedores.</p>
      </header>

      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} className={`btn btn-sm ${tab === k ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(k)}>
            {label}
            {k === 'pedidos' && pendientes > 0 && <span className="badge badge-danger" style={{ padding: '0 7px', marginLeft: 2 }}>{pendientes}</span>}
          </button>
        ))}
      </div>

      {tab === 'pedidos' && <Pedidos pedidos={pedidos} proveedores={proveedores} irAProveedores={() => setTab('proveedores')} />}
      {tab === 'zonas' && (
        <ResumenZonas zonas={[...zonas.rows].sort((a, b) => a.nombre.localeCompare(b.nombre))} horarios={horarios.rows} personal={personal.rows} />
      )}
      {tab === 'personal' && <Personal personal={personal} horarios={horarios} zonas={zonas} />}
      {tab === 'proveedores' && <Proveedores proveedores={proveedores} />}
    </div>
  )
}

/* ---------------- Pedidos ---------------- */
function Pedidos ({ pedidos, proveedores, irAProveedores }) {
  const nombreInst = useNombreInstitucion()
  const [ver, setVer] = useState('curso')
  const [sel, setSel] = useState([])
  const [armado, setArmado] = useState(null) // { ids, items, proveedor_id, nota }

  const lista = pedidos.rows.filter(p => (ver === 'curso' ? p.estado !== 'realizado' : p.estado === 'realizado'))
  const prov = (id) => proveedores.rows.find(p => p.id === id)
  const alternar = (id) => setSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))

  function armar (ids) {
    const elegidos = pedidos.rows.filter(p => ids.includes(p.id))
    setArmado({
      ids,
      items: unirItems(elegidos),
      proveedor_id: elegidos.find(p => p.proveedor_id)?.proveedor_id || proveedores.rows[0]?.id || '',
      nota: '',
    })
  }

  const proveedor = armado && prov(armado.proveedor_id)
  const mensaje = armado ? mensajePedido({ proveedor, items: armado.items, institucion: nombreInst, nota: armado.nota }) : ''

  async function enviarWhatsApp () {
    if (!proveedor) return alert('Elige un proveedor.')
    if (!proveedor.telefono) return alert('Este proveedor no tiene teléfono cargado.')
    if (!armado.items.some(it => it.nombre && Number(it.cantidad) > 0)) return alert('El pedido no tiene insumos.')
    // Se abre antes de guardar para que el navegador no bloquee la ventana.
    window.open(linkWhatsApp(proveedor.telefono, mensaje), '_blank')
    const fecha = new Date().toISOString()
    for (const id of armado.ids) {
      const p = pedidos.rows.find(x => x.id === id)
      await pedidos.update(id, { proveedor_id: proveedor.id, fecha_envio: fecha, ...(p?.estado === 'pendiente' && { estado: 'enviado' }) })
    }
    setArmado(null); setSel([])
  }

  async function marcarRealizado (p, hecho) {
    await pedidos.update(p.id, hecho
      ? { estado: 'realizado', fecha_realizado: new Date().toISOString() }
      : { estado: p.proveedor_id ? 'enviado' : 'pendiente', fecha_realizado: '' })
    setSel(s => s.filter(x => x !== p.id))
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tabs">
          <button className={`btn btn-sm ${ver === 'curso' ? 'btn-accent' : 'btn-ghost'}`} onClick={() => { setVer('curso'); setSel([]) }}>En curso</button>
          <button className={`btn btn-sm ${ver === 'hechos' ? 'btn-accent' : 'btn-ghost'}`} onClick={() => { setVer('hechos'); setSel([]) }}>Realizados</button>
        </div>
        {ver === 'curso' && sel.length > 1 && (
          <button className="btn btn-primary btn-sm" onClick={() => armar(sel)}>Armar un pedido con {sel.length} solicitudes</button>
        )}
      </div>
      {ver === 'curso' && lista.length > 1 && <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: -10 }}>Marca varias solicitudes para unirlas en un solo pedido al proveedor.</p>}

      {lista.length ? lista.map(p => {
        const hecho = p.estado === 'realizado'
        return (
          <PedidoCard key={p.id} pedido={p} proveedor={prov(p.proveedor_id)}
            seleccion={!hecho && <input type="checkbox" checked={sel.includes(p.id)} onChange={() => alternar(p.id)} style={{ marginTop: 4, width: 16, height: 16 }} aria-label="Seleccionar para armar pedido" />}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {!hecho && (
                <button className="btn btn-primary btn-sm" onClick={() => armar([p.id])}>
                  {p.estado === 'enviado' ? 'Volver a enviar' : 'Armar pedido'}
                </button>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
                <input type="checkbox" checked={hecho} onChange={e => marcarRealizado(p, e.target.checked)} style={{ width: 18, height: 18 }} />
                Pedido realizado
              </label>
            </div>
          </PedidoCard>
        )
      }) : <div className="card"><Empty icon={ClipboardList} title={ver === 'curso' ? 'No hay pedidos en curso' : 'Aún no hay pedidos realizados'} hint={ver === 'curso' ? 'Aquí aparecen los pedidos que haga el jefe de mantenimiento.' : undefined} /></div>}

      {armado && (
        <Modal wide title="Armar pedido al proveedor" onClose={() => setArmado(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setArmado(null)}>Cancelar</button>
            <button className="btn btn-wa" style={{ padding: '10px 16px', fontWeight: 600, display: 'inline-flex', gap: 8, alignItems: 'center' }} onClick={enviarWhatsApp}>
              <MessageCircle size={16} /> Enviar por WhatsApp
            </button>
          </>}>
          {proveedores.rows.length ? (
            <div className="field"><label>Proveedor</label>
              <select className="select" value={armado.proveedor_id} onChange={e => setArmado({ ...armado, proveedor_id: e.target.value })}>
                {proveedores.rows.map(p => <option key={p.id} value={p.id}>{p.nombre}{p.telefono ? '' : ' (sin teléfono)'}</option>)}
              </select>
            </div>
          ) : (
            <div className="badge badge-warning" style={{ alignSelf: 'flex-start', padding: '8px 12px' }}>
              No tienes proveedores cargados.&nbsp;
              <button className="sa-link" onClick={() => { setArmado(null); irAProveedores() }}>Agregar uno</button>
            </div>
          )}
          <div className="field"><label>Insumos (puedes ajustar cantidades)</label>
            <EditorItems items={armado.items} onChange={items => setArmado({ ...armado, items })} />
          </div>
          <div className="field"><label>Nota para el proveedor (opcional)</label>
            <input className="input" value={armado.nota} onChange={e => setArmado({ ...armado, nota: e.target.value })} placeholder="Ej: Entregar en la entrada principal" />
          </div>
          <div className="field"><label>Mensaje que se enviará</label>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, margin: 0 }}>{mensaje}</pre>
          </div>
        </Modal>
      )}
    </>
  )
}

/* ---------------- Personal de mantenimiento (solo lectura) ---------------- */
function Personal ({ personal, horarios, zonas }) {
  const equipo = personal.rows.filter(p => p.tipo === TIPO_PERSONAL)
  const zona = (id) => zonas.rows.find(z => z.id === id)
  if (!equipo.length) return <div className="card"><Empty icon={Users} title="Sin personal de mantenimiento" hint="El jefe de mantenimiento lo registra desde su portal." /></div>
  return (
    <div className="card scroll-x">
      <table className="table">
        <thead><tr><th>Nombre</th><th>Cargo</th><th>Zonas y horarios</th><th>Contacto</th></tr></thead>
        <tbody>
          {equipo.map(p => {
            const turnos = horarios.rows.filter(h => h.personal_id === p.id)
            return (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.nombre} {p.apellido}</td>
                <td>{p.cargo || '—'}</td>
                <td style={{ fontSize: 13 }}>
                  {turnos.length ? turnos.map(h => (
                    <div key={h.id}><b>{zona(h.zona_id)?.nombre || '—'}</b> <span style={{ color: 'var(--text-soft)' }}>· {textoDias(h)} · {textoHora(h)}</span></div>
                  )) : <span style={{ color: 'var(--text-faint)' }}>Sin asignar</span>}
                </td>
                <td><WhatsAppButton phone={p.telefono} message={`Hola ${p.nombre}, `} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ---------------- Proveedores ---------------- */
const PROV_VACIO = { nombre: '', contacto: '', telefono: '', email: '', productos: '', notas: '' }

function Proveedores ({ proveedores }) {
  const nombreInst = useNombreInstitucion()
  const [form, setForm] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const ordenados = useMemo(() => [...proveedores.rows].sort((a, b) => a.nombre.localeCompare(b.nombre)), [proveedores.rows])

  async function guardar () {
    if (!form.nombre.trim()) return alert('Escribe el nombre del negocio.')
    if (!form.telefono.trim()) return alert('El teléfono (WhatsApp) es necesario para enviarle pedidos.')
    const datos = { nombre: form.nombre.trim(), contacto: form.contacto, telefono: form.telefono.trim(), email: form.email, productos: form.productos, notas: form.notas }
    if (form.id) await proveedores.update(form.id, datos)
    else await proveedores.insert(datos)
    setForm(null)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary btn-sm" onClick={() => setForm(PROV_VACIO)}><Plus size={16} /> Nuevo proveedor</button>
      </div>
      {ordenados.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {ordenados.map(p => (
            <div key={p.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{[p.contacto, p.telefono].filter(Boolean).join(' · ')}</div>
                </div>
                <WhatsAppButton phone={p.telefono} message={`Hola${p.contacto ? ` ${p.contacto}` : ''}, le escribimos de ${nombreInst}.`} />
              </div>
              {p.productos && <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-faint)' }}>Productos:</span> {p.productos}</div>}
              {p.notas && <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{p.notas}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setForm(p)}><Pencil size={14} /> Editar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => confirm(`¿Eliminar a ${p.nombre}?`) && proveedores.remove(p.id)}><Trash2 size={14} /> Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="card"><Empty icon={Store} title="Sin proveedores" hint="Agrega los negocios que surten los implementos de limpieza." /></div>}

      {form && (
        <Modal title={form.id ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={() => setForm(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar}>Guardar</button>
          </>}>
          <div className="grid-form">
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Negocio *</label><input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Distribuidora La Limpieza" autoFocus /></div>
            <div className="field"><label>Persona de contacto</label><input className="input" value={form.contacto || ''} onChange={e => set('contacto', e.target.value)} /></div>
            <div className="field"><label>Teléfono (WhatsApp) *</label><input className="input" value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} placeholder="+58..." /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Email</label><input className="input" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Productos que vende</label><input className="input" value={form.productos || ''} onChange={e => set('productos', e.target.value)} placeholder="Ej: Cloro, desinfectante, papel, bolsas" /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Notas</label><textarea className="textarea" value={form.notas || ''} onChange={e => set('notas', e.target.value)} placeholder="Ej: Entrega en 24 h, acepta pago móvil" /></div>
          </div>
        </Modal>
      )}
    </>
  )
}
