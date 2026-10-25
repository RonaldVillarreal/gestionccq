import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAlumno } from '../../lib/useAlumno'
import { notasPorMateria, promedio, fmtNota, diasHasta, fechaLarga, saludo } from '../../lib/secundaria'
import { PUNTOS_POR_NIVEL } from '../../lib/gamification'
import { NotaChip, TareaFila, MateriaChip, Vacio, SinFicha, Toast, useMarcarTarea } from '../../components/Secundaria'

export default function SecInicio () {
  const datos = useAlumno()
  const { alumno, misTareas, misMaterias, misCalificaciones, misMedallas, progreso } = datos
  const { alternar, guardando, toast, entregaDe } = useMarcarTarea(datos)

  const pendientes = useMemo(() => misTareas.filter(t => !entregaDe(t.id))
    .sort((a, b) => (a.fecha_entrega || '9999').localeCompare(b.fecha_entrega || '9999')), [misTareas, datos.misEntregas])
  const vencidas = pendientes.filter(t => diasHasta(t.fecha_entrega) < 0)
  const semana = pendientes.filter(t => { const d = diasHasta(t.fecha_entrega); return d != null && d >= 0 && d <= 7 })
  const materiasNotas = useMemo(() => notasPorMateria(misCalificaciones, misMaterias), [misCalificaciones, misMaterias])
  const general = promedio(materiasNotas.map(m => m.promedio))
  const enRiesgo = materiasNotas.filter(m => m.promedio != null && m.promedio < 10)

  if (!alumno) return <SinFicha />

  const resumen = [
    semana.length ? `${semana.length} ${semana.length === 1 ? 'entrega' : 'entregas'} en los próximos 7 días` : 'Sin entregas en los próximos 7 días',
    vencidas.length ? `${vencidas.length} ${vencidas.length === 1 ? 'vencida' : 'vencidas'}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <Toast msg={toast} />
      <div className="sec-head">
        <div>
          <div className="sec-eyebrow">{fechaLarga()}</div>
          <h1 style={{ marginTop: 6 }}>{saludo()}, {alumno.nombre}</h1>
          <p>{resumen}.</p>
        </div>
      </div>

      <div className="sec-kpis">
        <div className="sec-card sec-kpi">
          <small>Promedio general</small>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><NotaChip nota={general} grande /></div>
          <small>{general == null ? 'Aún sin notas' : `sobre 20 · ${materiasNotas.filter(m => m.promedio != null).length} materias`}</small>
        </div>
        <div className="sec-card sec-kpi">
          <small>Por entregar</small>
          <div className="num">{pendientes.length}</div>
          <small>{semana.length} esta semana</small>
        </div>
        <div className="sec-card sec-kpi">
          <small>Vencidas</small>
          <div className="num" style={{ color: vencidas.length ? 'var(--danger)' : undefined }}>{vencidas.length}</div>
          <small>{vencidas.length ? 'Ponte al día con tus profesores' : 'Vas al día'}</small>
        </div>
        <div className="sec-card sec-kpi">
          <small>Nivel {progreso.nivel}</small>
          <div className="num">{progreso.puntos}<span className="sec-faint" style={{ fontSize: 14, fontWeight: 600 }}> XP</span></div>
          <div className="sec-bar" aria-label={`${progreso.puntosEnNivel} de ${PUNTOS_POR_NIVEL} XP para el siguiente nivel`}><span style={{ width: `${progreso.progresoPct}%` }} /></div>
        </div>
      </div>

      <div className="sec-grid-main">
        <section className="sec-card">
          <div className="sec-section-title">
            <h3>Próximas entregas</h3>
            <Link to="/alumno/tareas" className="sec-link">Ver todas <ArrowRight size={14} /></Link>
          </div>
          <div className="sec-list">
            {pendientes.slice(0, 6).map(t => (
              <TareaFila key={t.id} tarea={t} materia={misMaterias.find(m => m.id === t.materia_id)}
                hecha={false} guardando={guardando === t.id} onAlternar={alternar} />
            ))}
            {!pendientes.length && <Vacio titulo="Todo entregado" texto="No tienes tareas pendientes." />}
          </div>
        </section>

        <div className="sec-col">
          <section className="sec-card">
            <div className="sec-section-title">
              <h3>Notas por materia</h3>
              <Link to="/alumno/notas" className="sec-link">Detalle <ArrowRight size={14} /></Link>
            </div>
            <div className="sec-list">
              {materiasNotas.map(m => (
                <div key={m.nombre} className="sec-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                  <div style={{ minWidth: 0 }}>
                    <MateriaChip materia={{ nombre: m.nombre, color: m.color }} />
                    <div className="sec-faint" style={{ fontSize: 12, marginTop: 2 }}>{m.evals.length} {m.evals.length === 1 ? 'evaluación' : 'evaluaciones'}</div>
                  </div>
                  <NotaChip nota={m.promedio} />
                </div>
              ))}
              {!materiasNotas.length && <Vacio titulo="Sin notas todavía" texto="Aparecerán cuando tus profesores las carguen." />}
            </div>
            {enRiesgo.length > 0 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--sec-border)', fontSize: 13 }} className="sec-soft">
                Promedio por debajo de 10 en <b style={{ color: 'var(--danger)' }}>{enRiesgo.map(m => m.nombre).join(', ')}</b>.{' '}
                <Link to="/alumno/herramientas" className="sec-link">Calcula qué nota necesitas</Link>
              </div>
            )}
          </section>

          <section className="sec-card sec-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 16 }}>Reconocimientos</h3>
            {misMedallas.length ? misMedallas.slice(0, 3).map(m => (
              <div key={m.id} style={{ fontSize: 13.5 }}>
                <b>{m.titulo}</b> <span className="sec-faint">· +{m.puntos} XP</span>
                {m.mensaje && <div className="sec-soft" style={{ marginTop: 2 }}>“{m.mensaje}”</div>}
              </div>
            )) : <p className="sec-soft" style={{ fontSize: 13.5 }}>Tus profesores pueden reconocer tus trabajos. Cada reconocimiento suma XP.</p>}
            <div className="sec-faint" style={{ fontSize: 12.5 }}>
              {progreso.completadas} {progreso.completadas === 1 ? 'tarea completada' : 'tareas completadas'} · {progreso.racha} {progreso.racha === 1 ? 'día' : 'días'} con entregas · promedio actual {fmtNota(general)}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
