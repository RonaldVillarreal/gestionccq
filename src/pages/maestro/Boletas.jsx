import { useState } from 'react'
import { FileText, Download, Search } from 'lucide-react'
import { Empty } from '../../components/UI'
import { useTable } from '../../lib/useTable'

// Boletas: vista por alumno para registrar/imprimir boletines. Base lista para
// ampliar con notas reales en fase 2.
export default function Boletas () {
  const alumnos = useTable('alumnos')
  const [q, setQ] = useState('')
  const filtered = alumnos.rows.filter(a => `${a.nombre} ${a.apellido}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header>
        <h1 style={{ fontSize: 28 }}>Boletas</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Genera y consulta boletines por alumno.</p>
      </header>
      <div className="card">
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="var(--text-faint)" />
          <input className="input" style={{ border: 'none', background: 'transparent', padding: 4 }} placeholder="Buscar alumno…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="scroll-x">
          {filtered.length ? (
            <table className="table">
              <thead><tr><th>Alumno</th><th>Nivel</th><th>Grado</th><th>Boleta</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.nombre} {a.apellido}</td>
                    <td><span className="badge badge-neutral">{a.nivel}</span></td>
                    <td>{a.grado} {a.seccion}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => alert('Generación de PDF: disponible en fase 2.')}><Download size={14} /> Generar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty icon={FileText} title="Sin alumnos" hint="Los alumnos cargados por el admin aparecerán aquí." />}
        </div>
      </div>
    </div>
  )
}
