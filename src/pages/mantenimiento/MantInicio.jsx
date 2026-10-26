import { Link } from 'react-router-dom'
import { Users, MapPin, Clock, ClipboardList, ChevronRight } from 'lucide-react'
import { StatCard, Empty } from '../../components/UI'
import { PedidoCard } from '../../components/Mantenimiento'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'
import { esEquipoMant, DIAS, hoy, diasDe, textoHora } from '../../lib/mantenimiento'

export default function MantInicio () {
  const { user } = useAuth()
  const personal = useTable('personal')
  const zonas = useTable('mant_zonas')
  const horarios = useTable('mant_horarios')
  const pedidos = useTable('mant_pedidos')

  const equipo = personal.rows.filter(esEquipoMant)
  const dHoy = hoy()
  const turnosHoy = horarios.rows
    .filter(h => diasDe(h).includes(dHoy))
    .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))
  const pendientes = pedidos.rows.filter(p => p.estado !== 'realizado')
  const persona = (id) => personal.rows.find(p => p.id === id)
  const zona = (id) => zonas.rows.find(z => z.id === id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28 }}>Hola, {user?.nombre?.split(' ')[0]}</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Hoy es {DIAS.find(d => d.id === dHoy).label.toLowerCase()} · resumen del mantenimiento.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: 16 }}>
        <StatCard icon={Users} label="Personas a cargo" value={equipo.length} tone="primary" />
        <StatCard icon={MapPin} label="Zonas" value={zonas.rows.length} tone="accent" />
        <StatCard icon={Clock} label="Turnos hoy" value={turnosHoy.length} tone="success" />
        <StatCard icon={ClipboardList} label="Pedidos en curso" value={pendientes.length} tone="warning" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'start' }}>
        <section className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 17 }}>Turnos de hoy</h3>
            <Link to="/mantenimiento/zonas" className="btn btn-ghost btn-sm">Ver todo <ChevronRight size={15} /></Link>
          </div>
          {turnosHoy.length ? turnosHoy.map(h => {
            const p = persona(h.personal_id); const z = zona(h.zona_id)
            return (
              <div key={h.id} className="mt-turno" style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{z?.nombre || 'Zona eliminada'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{p ? `${p.nombre} ${p.apellido || ''}` : 'Sin asignar'}{h.tarea ? ` · ${h.tarea}` : ''}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{textoHora(h)}</div>
              </div>
            )
          }) : <Empty icon={Clock} title="Sin turnos para hoy" />}
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 17 }}>Pedidos en curso</h3>
            <Link to="/mantenimiento/pedidos" className="btn btn-primary btn-sm">Nuevo pedido</Link>
          </div>
          {pendientes.length
            ? pendientes.slice(0, 3).map(p => <PedidoCard key={p.id} pedido={p} />)
            : <div className="card"><Empty icon={ClipboardList} title="Sin pedidos en curso" hint="Cuando falten implementos, haz un pedido al director." /></div>}
        </section>
      </div>
    </div>
  )
}
