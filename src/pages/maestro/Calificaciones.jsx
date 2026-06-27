import { useMemo, useState } from 'react'
import { ClipboardList, Save } from 'lucide-react'
import { Empty } from '../../components/UI'
import { useTable } from '../../lib/useTable'

// Registro rápido de calificaciones por materia. Persiste en la tabla local;
// en Supabase se puede mover a una tabla `calificaciones` dedicada.
export default function Calificaciones () {
  const materias = useTable('materias')
  const alumnos = useTable('alumnos')
  const [matId, setMatId] = useState('')
  const [notas, setNotas] = useState({})

  const lista = useMemo(() => alumnos.rows, [alumnos.rows])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Calificaciones</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Carga las notas de tus alumnos por materia.</p>
        </div>
        <select className="select" style={{ width: 'auto' }} value={matId} onChange={e => setMatId(e.target.value)}>
          <option value="">Selecciona materia…</option>
          {materias.rows.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </header>

      {matId ? (
        <div className="card scroll-x">
          <table className="table">
            <thead><tr><th>Alumno</th><th>Grado</th><th style={{ width: 140 }}>Nota (0-20)</th></tr></thead>
            <tbody>
              {lista.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.nombre} {a.apellido}</td>
                  <td>{a.nivel} · {a.grado}</td>
                  <td>
                    <input className="input" type="number" min="0" max="20" style={{ width: 90 }}
                      value={notas[a.id] ?? ''} onChange={e => setNotas({ ...notas, [a.id]: e.target.value })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => alert('Notas guardadas (demo). En fase 2 se persisten en Supabase.')}><Save size={16} /> Guardar notas</button>
          </div>
        </div>
      ) : <div className="card"><Empty icon={ClipboardList} title="Elige una materia" hint="Selecciona arriba para cargar notas." /></div>}
    </div>
  )
}
