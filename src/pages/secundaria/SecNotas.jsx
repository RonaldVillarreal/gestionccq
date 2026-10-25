import { useMemo, useState } from 'react'
import { useAlumno } from '../../lib/useAlumno'
import { notasPorMateria, promedio, notaNecesaria, fmtNota, APRUEBA, ESCALA } from '../../lib/secundaria'
import { NotaChip, MateriaChip, Vacio, SinFicha } from '../../components/Secundaria'

/* Calificaciones por materia (las carga cada profesor en la ficha del alumno). */
export default function SecNotas () {
  const { alumno, misCalificaciones, misMaterias } = useAlumno()
  const materias = useMemo(() => notasPorMateria(misCalificaciones, misMaterias), [misCalificaciones, misMaterias])
  const [abierta, setAbierta] = useState(null)

  if (!alumno) return <SinFicha />

  const conNota = materias.filter(m => m.promedio != null)
  const general = promedio(conNota.map(m => m.promedio))
  const aprobadas = conNota.filter(m => m.promedio >= APRUEBA).length
  const mejor = [...conNota].sort((a, b) => b.promedio - a.promedio)[0]

  return (
    <>
      <div className="sec-head">
        <div>
          <h1>Notas</h1>
          <p>Escala de 1 a 20 · se aprueba con {APRUEBA}. Los promedios se calculan con las evaluaciones cargadas hasta hoy.</p>
        </div>
      </div>

      <div className="sec-kpis">
        <div className="sec-card sec-kpi"><small>Promedio general</small><NotaChip nota={general} grande /></div>
        <div className="sec-card sec-kpi"><small>Materias aprobadas</small><div className="num">{aprobadas}<span className="sec-faint" style={{ fontSize: 16 }}>/{conNota.length}</span></div></div>
        <div className="sec-card sec-kpi"><small>Mejor materia</small><div style={{ fontWeight: 700, fontFamily: 'var(--sec-font)', fontSize: 17 }}>{mejor?.nombre || '—'}</div><small>{mejor ? `${fmtNota(mejor.promedio)} de promedio` : 'Sin notas aún'}</small></div>
        <div className="sec-card sec-kpi"><small>Evaluaciones</small><div className="num">{misCalificaciones.length}</div><small>cargadas por tus profesores</small></div>
      </div>

      {materias.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: 16, alignItems: 'start' }}>
          {materias.map(m => (
            <section key={m.nombre} className="sec-card">
              <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <MateriaChip materia={{ nombre: m.nombre, color: m.color }} />
                  <div className="sec-faint" style={{ fontSize: 12.5, marginTop: 4 }}>{m.evals.length} {m.evals.length === 1 ? 'evaluación' : 'evaluaciones'}</div>
                </div>
                <NotaChip nota={m.promedio} grande />
              </div>
              {m.evals.length > 1 && <Tendencia evals={m.evals} />}
              <div className="sec-list">
                {m.evals.map(e => (
                  <div key={e.id} className="sec-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="sec-row-title" style={{ fontSize: 14 }}>{e.titulo || 'Evaluación'}</div>
                      <div className="sec-row-meta">
                        {e.created_at && <span>{new Date(e.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>}
                        {e.detalle && <span className="sec-soft">{e.detalle}</span>}
                        {e.nota == null && e.valor && <span>Calificación: {e.valor}</span>}
                      </div>
                    </div>
                    <NotaChip nota={e.nota} />
                  </div>
                ))}
                {!m.evals.length && <div className="sec-row sec-faint" style={{ gridTemplateColumns: '1fr', fontSize: 13.5 }}>Sin evaluaciones cargadas.</div>}
              </div>
              {m.evals.length > 0 && (
                <div style={{ borderTop: '1px solid var(--sec-border)', padding: '12px 16px' }}>
                  <button type="button" className="sec-link" aria-expanded={abierta === m.nombre} onClick={() => setAbierta(a => (a === m.nombre ? null : m.nombre))}>
                    {abierta === m.nombre ? 'Cerrar calculadora' : '¿Qué nota necesito?'}
                  </button>
                  {abierta === m.nombre && <NotaNecesaria notas={m.evals.map(e => e.nota)} />}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="sec-card"><Vacio titulo="Aún no tienes notas" texto="Cuando tus profesores carguen tus evaluaciones las verás aquí, organizadas por materia." /></div>
      )}
    </>
  )
}

/* Mini gráfico de barras: cada evaluación en orden, con la línea de aprobación. */
function Tendencia ({ evals }) {
  const alto = 56
  return (
    <div style={{ padding: '0 16px 12px' }} aria-hidden="true">
      <div style={{ position: 'relative', height: alto, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: (APRUEBA / ESCALA) * alto, borderTop: '1px dashed var(--sec-faint)', opacity: .6 }} />
        {evals.map(e => (
          <div key={e.id} title={`${e.titulo}: ${fmtNota(e.nota)}`} style={{
            flex: 1, maxWidth: 28, height: `${((e.nota ?? 0) / ESCALA) * 100}%`, minHeight: 2, borderRadius: '3px 3px 0 0',
            background: e.nota == null ? 'var(--sec-border)' : e.nota < APRUEBA ? 'var(--danger)' : 'var(--primary)', opacity: .85,
          }} />
        ))}
      </div>
    </div>
  )
}

/** "¿Qué nota necesito?": promedio requerido en las evaluaciones que faltan. */
export function NotaNecesaria ({ notas = [], editable = false }) {
  const [restantes, setRestantes] = useState(1)
  const [meta, setMeta] = useState(APRUEBA)
  const [manual, setManual] = useState('')
  // En modo editable las notas las escribe el alumno: "12, 9.5 15".
  const actuales = editable
    ? manual.split(/[\s;]+|,(?!\d)/).filter(Boolean).map(x => Number(x.replace(',', '.'))).filter(n => !Number.isNaN(n) && n >= 0 && n <= ESCALA)
    : notas.filter(n => n != null)
  const necesaria = notaNecesaria({ notas: actuales, restantes, meta: Number(meta) })
  const actual = promedio(actuales)

  let mensaje = null
  if (necesaria != null) {
    if (necesaria <= 1) mensaje = <>Ya tienes asegurado el {fmtNota(Number(meta))} aunque saques 1 en lo que falta.</>
    else if (necesaria > ESCALA) mensaje = <>Con {restantes} {Number(restantes) === 1 ? 'evaluación' : 'evaluaciones'} más no alcanza para llegar a {fmtNota(Number(meta))}. Habla con tu profesor sobre opciones de recuperación.</>
    else mensaje = <>Necesitas un promedio de <NotaChip nota={Math.ceil(necesaria * 10) / 10} /> en {Number(restantes) === 1 ? 'la próxima evaluación' : `las próximas ${restantes} evaluaciones`}.</>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
      {editable && (
        <div className="field">
          <label>Tus notas hasta ahora (sobre 20, separadas por coma)</label>
          <input className="input" value={manual} onChange={e => setManual(e.target.value)} placeholder="Ej: 12, 9, 15" inputMode="decimal" />
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: '1 1 140px' }}>
          <label>Evaluaciones que faltan</label>
          <input className="input" type="number" min="1" max="20" value={restantes} onChange={e => setRestantes(e.target.value)} />
        </div>
        <div className="field" style={{ flex: '1 1 140px' }}>
          <label>Promedio que quieres</label>
          <input className="input" type="number" min="1" max="20" step="0.5" value={meta} onChange={e => setMeta(e.target.value)} />
        </div>
      </div>
      <div className="sec-soft" style={{ fontSize: 13.5, lineHeight: 1.6 }} aria-live="polite">
        {actuales.length ? <>Promedio actual: <b>{fmtNota(actual)}</b>. </> : editable ? 'Escribe tus notas para calcular. ' : null}
        {actuales.length > 0 && mensaje}
      </div>
    </div>
  )
}
