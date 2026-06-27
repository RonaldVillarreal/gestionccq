import { useMemo } from 'react'
import { BookOpen, CalendarRange, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard } from '../../components/UI'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'

export default function MaestroDashboard () {
  const { user } = useAuth()
  const materias = useTable('materias')
  const planes = useTable('planificaciones')

  const aprobadas = planes.rows.filter(p => p.status === 'aprobada').length
  const pendientes = planes.rows.filter(p => p.status === 'pendiente').length
  const correccion = planes.rows.filter(p => p.status === 'correccion').length

  const serie = useMemo(() => {
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
    return dias.map((d, i) => ({ dia: d, planes: planes.rows.filter((_, idx) => idx % 5 === i).length + (i % 2) }))
  }, [planes.rows])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28 }}>Hola, {user?.nombre?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Este es el resumen de tu actividad docente.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: 16 }}>
        <StatCard icon={BookOpen} label="Materias" value={materias.rows.length} tone="primary" />
        <StatCard icon={CalendarRange} label="Planificaciones" value={planes.rows.length} tone="accent" />
        <StatCard icon={CheckCircle2} label="Aprobadas" value={aprobadas} tone="success" />
        <StatCard icon={Clock} label="Pendientes" value={pendientes} tone="warning" />
        <StatCard icon={RefreshCw} label="En corrección" value={correccion} tone="danger" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20 }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 18 }}>Carga semanal de planificación</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={serie}>
              <defs>
                <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" stroke="var(--text-faint)" fontSize={13} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
              <Area type="monotone" dataKey="planes" stroke="var(--primary)" strokeWidth={2.5} fill="url(#ar)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Tus materias</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {materias.rows.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: m.color }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{m.nombre}</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-faint)' }}>
                  {planes.rows.filter(p => p.materia_id === m.id).length} planes
                </span>
              </div>
            ))}
            {!materias.rows.length && <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Crea tu primera materia en Planificación.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
