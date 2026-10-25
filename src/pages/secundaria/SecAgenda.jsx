import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAlumno } from '../../lib/useAlumno'
import { lunesDe, diasSemana, isoDia, hoyISO } from '../../lib/secundaria'
import { SinFicha } from '../../components/Secundaria'

/* Semana de entregas: cada tarea aparece el día que se entrega. */
export default function SecAgenda () {
  const { alumno, misTareas, misMaterias, misEntregas } = useAlumno()
  // Sábado y domingo la semana en curso ya pasó: se abre la siguiente.
  const inicial = [0, 6].includes(new Date().getDay()) ? 1 : 0
  const [offset, setOffset] = useState(inicial)

  if (!alumno) return <SinFicha />

  const lunes = lunesDe(offset)
  const dias = diasSemana(lunes)
  const hoy = hoyISO()
  const hechas = new Set(misEntregas.filter(e => e.status === 'entregada').map(e => e.tarea_id))
  const delDia = (iso) => misTareas.filter(t => t.fecha_entrega === iso)
  const totalSemana = dias.reduce((s, d) => s + delDia(isoDia(d)).length, 0)
  const rango = `${dias[0].toLocaleDateString('es', { day: 'numeric', month: 'short' })} – ${dias[6].toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <>
      <div className="sec-head">
        <div>
          <h1>Agenda</h1>
          <p>{totalSemana ? `${totalSemana} ${totalSemana === 1 ? 'entrega' : 'entregas'} ${offset === 0 ? 'esta semana' : 'en la semana mostrada'}.` : 'Semana sin entregas.'} Planifica con tiempo lo que viene.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setOffset(o => o - 1)} aria-label="Semana anterior"><ChevronLeft size={16} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => setOffset(inicial)} disabled={offset === inicial}>{inicial ? 'Próxima' : 'Esta semana'}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setOffset(o => o + 1)} aria-label="Semana siguiente"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="sec-eyebrow" aria-live="polite">{rango}</div>

      <div className="sec-card sec-week">
        {dias.map(d => {
          const iso = isoDia(d)
          const tareas = delDia(iso)
          return (
            <div key={iso} className="sec-day" data-hoy={iso === hoy}>
              <div className="sec-day-head">
                {d.toLocaleDateString('es', { weekday: 'short' }).replace('.', '')}
                <b>{d.getDate()}</b>
              </div>
              <div className="sec-day-body">
                {tareas.map(t => {
                  const mat = misMaterias.find(m => m.id === t.materia_id)
                  return (
                    <div key={t.id} className="sec-event" data-hecha={hechas.has(t.id)} style={{ '--c': mat?.color || t.color }}>
                      {t.titulo}
                      <small>{mat?.nombre || 'Materia'}{hechas.has(t.id) ? ' · hecha' : ''}</small>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
