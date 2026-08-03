import { Link } from 'react-router-dom'
import { DollarSign, AlertTriangle, FileText, TrendingUp, Receipt, ChevronRight, GraduationCap, UserPlus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { StatCard } from '../../components/UI'
import ControlesFinanzas from '../../components/ControlesFinanzas'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'
import { resumenFacturas, ingresosPorPeriodo, facturasDeAnioEscolar, etiquetaAnioEscolar } from '../../lib/finanzas'
import { useVistaFinanzas } from '../../lib/useVistaFinanzas'

export default function AdminvaInicio () {
  const { user } = useAuth()
  const facturas = useTable('facturas')
  const alumnos = useTable('alumnos')

  const vista = useVistaFinanzas(facturas.rows)
  const facturasAnio = facturasDeAnioEscolar(facturas.rows, vista.anioEscolar)
  const r = resumenFacturas(facturasAnio)
  const serie = ingresosPorPeriodo(facturasAnio)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Hola, {user?.nombre?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>
            Año escolar {etiquetaAnioEscolar(vista.anioEscolar)}{vista.esArchivo && ' · archivo'} · estado financiero del colegio.
          </p>
        </div>
        <ControlesFinanzas vista={vista} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: 16 }}>
        <StatCard icon={DollarSign} label="Recaudado" value={vista.money(r.recaudado)} tone="success" sub={`${r.pagadas} factura${r.pagadas === 1 ? '' : 's'} pagada${r.pagadas === 1 ? '' : 's'}`} />
        <StatCard icon={TrendingUp} label="Por cobrar" value={vista.money(r.porCobrar)} tone="warning" sub={`${r.pendientes + r.enviadas} pendientes`} />
        <StatCard icon={AlertTriangle} label="Alumnos morosos" value={r.alumnosMorosos} tone="danger" />
        <StatCard icon={FileText} label="Facturas emitidas" value={r.total} tone="primary" />
        <StatCard icon={GraduationCap} label="Alumnos inscritos" value={alumnos.rows.length} tone="accent" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 20 }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 18 }}>Recaudación por mes</h3>
          {!vista.verMontos ? (
            <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Montos ocultos · toca el ojo para mostrarlos.</p>
          ) : serie.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={serie}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="periodo" stroke="var(--text-faint)" fontSize={13} />
                <YAxis stroke="var(--text-faint)" fontSize={13} />
                <Tooltip formatter={(v) => [`$${v}`, 'Recaudado']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
                <Bar dataKey="total" fill="var(--success)" radius={[8, 8, 0, 0]} maxBarSize={70} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Sin pagos registrados en este año escolar.</p>}
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 14 }}>Accesos rápidos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <QuickLink to="/administracion/cobranzas" icon={Receipt} titulo="Cobranzas" sub={`${vista.money(r.porCobrar)} por cobrar`} />
            <QuickLink to="/administracion/facturacion" icon={FileText} titulo="Facturación" sub="Emitir y enviar facturas" />
            <QuickLink to="/administracion/alumnos" icon={UserPlus} titulo="Inscribir alumno" sub="Registrar un nuevo alumno" />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLink ({ to, icon: Icon, titulo, sub }) {
  return (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--primary-soft)', color: 'var(--primary)' }}><Icon size={20} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{titulo}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{sub}</div>
      </div>
      <ChevronRight size={18} color="var(--text-faint)" />
    </Link>
  )
}
