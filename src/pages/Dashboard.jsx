import { GraduationCap, UserCog, Users, Briefcase, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { StatCard } from '../components/UI'
import ControlesFinanzas from '../components/ControlesFinanzas'
import { useTable } from '../lib/useTable'
import { resumenFacturas, ingresosPorPeriodo, facturasDeAnioEscolar, etiquetaAnioEscolar } from '../lib/finanzas'
import { useVistaFinanzas } from '../lib/useVistaFinanzas'

export default function Dashboard () {
  const alumnos = useTable('alumnos')
  const maestros = useTable('maestros')
  const representantes = useTable('representantes')
  const personal = useTable('personal')
  const facturas = useTable('facturas')

  const vista = useVistaFinanzas(facturas.rows)
  const facturasAnio = facturasDeAnioEscolar(facturas.rows, vista.anioEscolar)
  const fin = resumenFacturas(facturasAnio)
  const ingresos = ingresosPorPeriodo(facturasAnio)
  const morosos = alumnos.rows.filter(a => a.moroso)
  const porNivel = ['Primaria', 'Secundaria'].map(n => ({
    nivel: n, alumnos: alumnos.rows.filter(a => a.nivel === n).length,
  }))
  const personalTipo = Object.entries(
    personal.rows.reduce((acc, p) => { acc[p.tipo] = (acc[p.tipo] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  const COLORS = ['#2A2F6B', '#C99A2E', '#2E7D52', '#C0392B', '#8B92E8']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 28 }}>Resumen general</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Vista rápida del estado del colegio.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard icon={GraduationCap} label="Alumnos inscritos" value={alumnos.rows.length} tone="primary" />
        <StatCard icon={UserCog} label="Maestros" value={maestros.rows.length} tone="success" />
        <StatCard icon={Users} label="Representantes" value={representantes.rows.length} tone="accent" />
        <StatCard icon={Briefcase} label="Personal" value={personal.rows.length} tone="primary" />
        <StatCard icon={AlertTriangle} label="Alumnos morosos" value={morosos.length} tone="danger"
          sub={morosos.length ? `${vista.money(morosos.reduce((s, a) => s + (Number(a.monto_deuda) || 0), 0))} adeudados` : 'Al día'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 18 }}>Alumnos por nivel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porNivel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="nivel" stroke="var(--text-faint)" fontSize={13} />
              <YAxis stroke="var(--text-faint)" fontSize={13} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
              <Bar dataKey="alumnos" fill="var(--primary)" radius={[8, 8, 0, 0]} maxBarSize={80} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 18 }}>Composición del personal</h3>
          {personalTipo.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={personalTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {personalTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-faint)' }}>Sin datos de personal.</p>}
        </div>
      </div>

      {/* ---------- Finanzas (alimentado por la Administradora) ---------- */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Finanzas</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 14 }}>
            Año escolar {etiquetaAnioEscolar(vista.anioEscolar)}{vista.esArchivo && ' · archivo'} · gestionado por Administración.
          </p>
        </div>
        <ControlesFinanzas vista={vista} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard icon={DollarSign} label="Recaudado" value={vista.money(fin.recaudado)} tone="success" sub={`${fin.pagadas} pagadas`} />
        <StatCard icon={TrendingUp} label="Por cobrar" value={vista.money(fin.porCobrar)} tone="warning" sub={`${fin.pendientes + fin.enviadas} pendientes`} />
        <StatCard icon={AlertTriangle} label="Facturas emitidas" value={fin.total} tone="primary" />
      </div>

      <div className="card card-pad">
        <h3 style={{ fontSize: 17, marginBottom: 18 }}>Recaudación por mes</h3>
        {!vista.verMontos ? (
          <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Montos ocultos · toca el ojo para mostrarlos.</p>
        ) : ingresos.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ingresos}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="periodo" stroke="var(--text-faint)" fontSize={13} />
              <YAxis stroke="var(--text-faint)" fontSize={13} />
              <Tooltip formatter={(v) => [`$${v}`, 'Recaudado']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
              <Bar dataKey="total" fill="var(--success)" radius={[8, 8, 0, 0]} maxBarSize={70} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Sin pagos registrados en este año escolar.</p>}
      </div>
    </div>
  )
}
