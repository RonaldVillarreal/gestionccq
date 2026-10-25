import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useAlumno } from '../../lib/useAlumno'
import { MateriaChip, Vacio, SinFicha } from '../../components/Secundaria'

/* Libros y PDF que comparten los profesores, filtrables por materia. */
export default function SecBiblioteca () {
  const { alumno, misLibros, misMaterias } = useAlumno()
  const [materia, setMateria] = useState('')
  const [q, setQ] = useState('')

  const lista = useMemo(() => misLibros
    .filter(l => !materia || l.materia_id === materia)
    .filter(l => !q || `${l.titulo} ${l.autor} ${l.descripcion}`.toLowerCase().includes(q.toLowerCase())),
  [misLibros, materia, q])

  if (!alumno) return <SinFicha />

  return (
    <>
      <div className="sec-head">
        <div>
          <h1>Biblioteca</h1>
          <p>{misLibros.length} {misLibros.length === 1 ? 'recurso compartido' : 'recursos compartidos'} por tus profesores.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select className="select" style={{ width: 'auto', minWidth: 170 }} value={materia} onChange={e => setMateria(e.target.value)} aria-label="Filtrar por materia">
          <option value="">Todas las materias</option>
          {misMaterias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <input className="input" style={{ flex: '1 1 180px', maxWidth: 300 }} placeholder="Buscar título o autor" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar libro" />
      </div>

      <div className="sec-card">
        <div className="sec-list">
          {lista.map(l => (
            <div key={l.id} className="sec-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', borderTop: 'none', borderBottom: '1px solid var(--sec-border)' }}>
              <div style={{ minWidth: 0 }}>
                <div className="sec-row-title">{l.titulo}</div>
                <div className="sec-row-meta">
                  <MateriaChip materia={misMaterias.find(m => m.id === l.materia_id)} />
                  {l.autor && <span>{l.autor}</span>}
                </div>
                {l.descripcion && <div className="sec-soft" style={{ fontSize: 13.5, marginTop: 4 }}>{l.descripcion}</div>}
              </div>
              {l.url
                ? <a className="btn btn-ghost btn-sm" href={l.url} target="_blank" rel="noreferrer">Abrir <ExternalLink size={14} /></a>
                : <span className="sec-faint" style={{ fontSize: 13 }}>Sin enlace</span>}
            </div>
          ))}
          {!lista.length && <Vacio titulo={misLibros.length ? 'Sin resultados' : 'Aún no hay libros'} texto={misLibros.length ? 'Prueba con otro filtro.' : 'Tus profesores pueden compartir libros y PDF por materia.'} />}
        </div>
      </div>
    </>
  )
}
