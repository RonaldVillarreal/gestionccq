import { useState } from 'react'
import { Plus, ClipboardList } from 'lucide-react'
import { Modal, Empty } from '../../components/UI'
import { EditorItems, PedidoCard } from '../../components/Mantenimiento'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'

/* El jefe de mantenimiento pide implementos de limpieza al director.
   El director los arma y los envía al proveedor desde su panel. */
export default function MantPedidos () {
  const { user } = useAuth()
  const pedidos = useTable('mant_pedidos')
  const [nuevo, setNuevo] = useState(null)

  const enCurso = pedidos.rows.filter(p => p.estado !== 'realizado')
  const historial = pedidos.rows.filter(p => p.estado === 'realizado')

  async function enviar () {
    const items = nuevo.items
      .map(it => ({ nombre: it.nombre.trim(), cantidad: Number(it.cantidad) || 0, unidad: it.unidad.trim() }))
      .filter(it => it.nombre && it.cantidad > 0)
    if (!items.length) return alert('Agrega al menos un insumo con cantidad.')
    await pedidos.insert({
      items: JSON.stringify(items), nota: nuevo.nota.trim(), urgencia: nuevo.urgencia,
      estado: 'pendiente', solicitado_por: user.id, solicitante: user.nombre,
    })
    setNuevo(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Pedidos de implementos</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Pide al director lo que haga falta. Verás aquí cuando se envíe al proveedor y cuando se realice.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setNuevo({ items: [], nota: '', urgencia: 'normal' })}><Plus size={16} /> Nuevo pedido</button>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 17 }}>En curso ({enCurso.length})</h3>
        {enCurso.length ? enCurso.map(p => (
          <PedidoCard key={p.id} pedido={p}>
            {p.estado === 'pendiente' && (
              <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}
                onClick={() => confirm('¿Cancelar este pedido?') && pedidos.remove(p.id)}>Cancelar pedido</button>
            )}
          </PedidoCard>
        )) : <div className="card"><Empty icon={ClipboardList} title="No hay pedidos en curso" /></div>}
      </section>

      {historial.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 17 }}>Realizados</h3>
          {historial.map(p => <PedidoCard key={p.id} pedido={p} />)}
        </section>
      )}

      {nuevo && (
        <Modal wide title="Nuevo pedido" onClose={() => setNuevo(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setNuevo(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={enviar}>Enviar al director</button>
          </>}>
          <EditorItems items={nuevo.items} onChange={items => setNuevo({ ...nuevo, items })} />
          <div className="grid-form">
            <div className="field"><label>Urgencia</label>
              <select className="select" value={nuevo.urgencia} onChange={e => setNuevo({ ...nuevo, urgencia: e.target.value })}>
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Nota para el director</label>
              <textarea className="textarea" value={nuevo.nota} onChange={e => setNuevo({ ...nuevo, nota: e.target.value })} placeholder="Ej: El cloro de los baños se acaba esta semana." />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
