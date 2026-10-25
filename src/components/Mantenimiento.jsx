import { Trash2, Plus, MapPin } from 'lucide-react'
import { Empty } from './UI'
import { INSUMOS, ESTADOS_PEDIDO, itemsDe, textoDias, textoHora, textoItem, fechaCorta, hoy, diasDe } from '../lib/mantenimiento'

/* ---------- Editor de insumos (cantidad + unidad + nombre) ----------
   Lo usan el jefe al pedir y el director al armar el pedido al proveedor. */
export function EditorItems ({ items, onChange }) {
  const set = (i, k, v) => onChange(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)))
  const quitar = (i) => onChange(items.filter((_, j) => j !== i))
  const agregar = (nombre = '', unidad = 'unidades') => onChange([...items, { nombre, cantidad: 1, unidad }])
  const yaEsta = (n) => items.some(it => it.nombre.trim().toLowerCase() === n.toLowerCase())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it, i) => (
        <div key={i} className="mt-item">
          <input className="input" type="number" min="0" step="any" value={it.cantidad} onChange={e => set(i, 'cantidad', e.target.value)} aria-label="Cantidad" />
          <input className="input" value={it.unidad} onChange={e => set(i, 'unidad', e.target.value)} placeholder="unidad" aria-label="Unidad" />
          <input className="input" value={it.nombre} onChange={e => set(i, 'nombre', e.target.value)} placeholder="Insumo" aria-label="Insumo" />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => quitar(i)} aria-label="Quitar"><Trash2 size={15} /></button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => agregar()}><Plus size={15} /> Agregar insumo</button>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>Frecuentes:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {INSUMOS.filter(([n]) => !yaEsta(n)).map(([n, u]) => (
            <button key={n} type="button" className="badge badge-neutral" style={{ cursor: 'pointer' }} onClick={() => agregar(n, u)}>+ {n}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ListaItems ({ pedido, items }) {
  const lista = items || itemsDe(pedido)
  if (!lista.length) return <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sin insumos</span>
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
      {lista.map((it, i) => <li key={i}>{textoItem(it)}</li>)}
    </ul>
  )
}

/* ---------- Tarjeta de pedido ---------- */
export function PedidoCard ({ pedido, proveedor, children, seleccion }) {
  const est = ESTADOS_PEDIDO[pedido.estado] || ESTADOS_PEDIDO.pendiente
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: pedido.urgencia === 'urgente' && pedido.estado === 'pendiente' ? '4px solid var(--danger)' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {seleccion}
          <div>
            <div style={{ fontWeight: 600 }}>Pedido del {fechaCorta(pedido.created_at)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>
              {pedido.solicitante || 'Jefe de mantenimiento'}
              {proveedor && ` · ${proveedor.nombre}`}
              {pedido.fecha_realizado && ` · realizado el ${fechaCorta(pedido.fecha_realizado)}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {pedido.urgencia === 'urgente' && <span className="badge badge-danger">Urgente</span>}
          <span className={`badge ${est.badge}`}>{est.label}</span>
        </div>
      </div>
      <ListaItems pedido={pedido} />
      {pedido.nota && <p style={{ fontSize: 13, color: 'var(--text-soft)', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 8 }}>{pedido.nota}</p>}
      {children}
    </div>
  )
}

/* ---------- Zonas con sus turnos ----------
   Solo lectura para el director; el jefe pasa `acciones` y `onTurno`
   para editar zonas y turnos. */
export function ResumenZonas ({ zonas, horarios, personal, acciones, onTurno }) {
  if (!zonas.length) return <Empty icon={MapPin} title="Sin zonas registradas" hint="El jefe de mantenimiento aún no ha cargado las zonas." />
  const persona = (id) => personal.find(p => p.id === id)
  const dHoy = hoy()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
      {zonas.map(z => {
        const turnos = horarios.filter(h => h.zona_id === z.id).sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))
        return (
          <div key={z.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{z.nombre}</div>
                <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{[z.area, z.descripcion].filter(Boolean).join(' · ') || '—'}</div>
              </div>
              {acciones && acciones(z)}
            </div>
            {turnos.length ? turnos.map(h => {
              const p = persona(h.personal_id)
              return (
                <div key={h.id} className="mt-turno" {...(onTurno && { role: 'button', tabIndex: 0, title: 'Editar turno', style: { cursor: 'pointer' }, onClick: () => onTurno(h), onKeyDown: e => e.key === 'Enter' && onTurno(h) })}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p ? `${p.nombre} ${p.apellido || ''}` : 'Sin asignar'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>
                    {textoDias(h)} · {textoHora(h)}
                    {diasDe(h).includes(dHoy) && <span className="badge badge-success" style={{ marginLeft: 6 }}>Hoy</span>}
                  </div>
                  {h.tarea && <div style={{ fontSize: 13 }}>{h.tarea}</div>}
                </div>
              )
            }) : <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Sin turnos asignados.</div>}
          </div>
        )
      })}
    </div>
  )
}
