import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import VistaContenido from '../../components/VistaContenido'
import { useAlumno } from '../../lib/useAlumno'
import { diasHasta } from '../../lib/secundaria'
import { TareaFila, Vacio, SinFicha, Toast, useMarcarTarea } from '../../components/Secundaria'

/* Tareas de todas las materias, agrupadas por urgencia. */
const GRUPOS = [
  ['vencidas', 'Vencidas', d => d != null && d < 0],
  ['semana', 'Próximos 7 días', d => d != null && d >= 0 && d <= 7],
  ['despues', 'Más adelante', d => d != null && d > 7],
  ['sinfecha', 'Sin fecha', d => d == null],
]

export default function SecTareas () {
  const datos = useAlumno()
  const { alumno, misTareas, misMaterias } = datos
  const { alternar, guardando, toast, entregaDe } = useMarcarTarea(datos)
  const [ver, setVer] = useState('pendientes')
  const [materia, setMateria] = useState('')
  const [q, setQ] = useState('')
  const [abierta, setAbierta] = useState(null)

  const filtradas = useMemo(() => misTareas
    .filter(t => (ver === 'pendientes' ? !entregaDe(t.id) : ver === 'hechas' ? !!entregaDe(t.id) : true))
    .filter(t => !materia || t.materia_id === materia)
    .filter(t => !q || `${t.titulo} ${t.descripcion}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.fecha_entrega || '9999').localeCompare(b.fecha_entrega || '9999')),
  [misTareas, datos.misEntregas, ver, materia, q])

  if (!alumno) return <SinFicha />

  const pendientesN = misTareas.filter(t => !entregaDe(t.id)).length
  const grupos = ver === 'pendientes'
    ? GRUPOS.map(([id, label, f]) => ({ id, label, tareas: filtradas.filter(t => f(diasHasta(t.fecha_entrega))) })).filter(g => g.tareas.length)
    : [{ id: 'todas', label: ver === 'hechas' ? 'Completadas' : 'Todas', tareas: filtradas }]

  const fila = (t) => (
    <TareaFila key={t.id} tarea={t} materia={misMaterias.find(m => m.id === t.materia_id)}
      hecha={!!entregaDe(t.id)} guardando={guardando === t.id} onAlternar={alternar}
      detalle={t.descripcion && (
        <>
          <button type="button" className="sec-link" style={{ marginTop: 6 }} aria-expanded={abierta === t.id}
            onClick={() => setAbierta(a => (a === t.id ? null : t.id))}>
            {abierta === t.id ? 'Ocultar indicaciones' : 'Ver indicaciones'}
            <ChevronDown size={14} style={{ transform: abierta === t.id ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
          </button>
          {abierta === t.id && <div className="sec-soft" style={{ marginTop: 8, fontSize: 14 }}><VistaContenido texto={t.descripcion} vacio="" /></div>}
        </>
      )} />
  )

  return (
    <>
      <Toast msg={toast} />
      <div className="sec-head">
        <div>
          <h1>Tareas</h1>
          <p>{pendientesN} por entregar de {misTareas.length} asignadas. Márcalas cuando las completes y tu profesor recibirá el aviso.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="sec-seg" role="group" aria-label="Filtrar por estado">
          {[['pendientes', 'Por entregar'], ['hechas', 'Hechas'], ['todas', 'Todas']].map(([k, l]) => (
            <button key={k} aria-pressed={ver === k} onClick={() => setVer(k)}>{l}</button>
          ))}
        </div>
        <select className="select" style={{ width: 'auto', minWidth: 170 }} value={materia} onChange={e => setMateria(e.target.value)} aria-label="Filtrar por materia">
          <option value="">Todas las materias</option>
          {misMaterias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <input className="input" style={{ flex: '1 1 180px', maxWidth: 280 }} placeholder="Buscar tarea" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar tarea" />
      </div>

      <div className="sec-card">
        {grupos.length ? grupos.map(g => (
          <div key={g.id}>
            <div className="sec-group-label"><span>{g.label}</span><span>{g.tareas.length}</span></div>
            <div className="sec-list">{g.tareas.map(fila)}</div>
          </div>
        )) : (
          <Vacio titulo={ver === 'pendientes' ? 'Nada por entregar' : 'Sin tareas'}
            texto={materia || q ? 'Prueba con otro filtro.' : ver === 'pendientes' ? 'Estás al día con todas tus materias.' : 'Aún no hay tareas en esta vista.'} />
        )}
      </div>
    </>
  )
}
