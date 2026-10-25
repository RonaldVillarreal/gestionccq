import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { notificar } from '../lib/inbox'
import { PUNTOS_POR_TAREA } from '../lib/gamification'
import { fmtNota, tonoNota, vence, hoyISO } from '../lib/secundaria'

/* Piezas reutilizables del portal de secundaria. */

export function MateriaChip ({ materia, nombre }) {
  const n = materia?.nombre || nombre || 'Sin materia'
  return <span className="sec-mat" style={{ '--c': materia?.color }}><i />{n}</span>
}

export function NotaChip ({ nota, grande }) {
  return (
    <span className={`sec-nota${grande ? ' sec-nota-lg' : ''}`} data-tono={tonoNota(nota)}
      aria-label={nota == null ? 'Sin nota' : `Nota ${fmtNota(nota)} de 20`}>
      {fmtNota(nota)}
    </span>
  )
}

export function VenceTag ({ fecha }) {
  const v = vence(fecha)
  return <span className="sec-tag" data-tono={v.tono}>{v.txt}</span>
}

export function Vacio ({ titulo, texto }) {
  return <div className="sec-empty"><b>{titulo}</b>{texto}</div>
}

export function SinFicha () {
  return (
    <div className="sec-card">
      <Vacio titulo="Tu usuario aún no está vinculado a una ficha de alumno"
        texto="Pide en la administración que conecten tu usuario con tu ficha para ver tus tareas y notas." />
    </div>
  )
}

export function Toast ({ msg }) {
  return msg ? <div className="sec-toast" role="status">{msg}</div> : null
}

/** Marca/desmarca una tarea como entregada y avisa al profesor de esa materia. */
export function useMarcarTarea ({ user, alumno, misEntregas, tablas }) {
  const [guardando, setGuardando] = useState(null)
  const [toast, setToast] = useState('')
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2200); return () => clearTimeout(t) }, [toast])

  const entregaDe = (tareaId) => misEntregas.find(e => e.tarea_id === tareaId && e.status === 'entregada')

  async function alternar (tarea) {
    if (guardando || !alumno) return
    setGuardando(tarea.id)
    try {
      const existente = entregaDe(tarea.id)
      if (existente) {
        await tablas.entregas.remove(existente.id)
        setToast('Tarea marcada como pendiente')
      } else {
        const ent = await tablas.entregas.insert({ alumno_id: alumno.id, tarea_id: tarea.id, status: 'entregada', comentario: '', fecha: hoyISO() })
        const profe = tablas.maestros.rows.find(m => m.id === tarea.maestro_id)
        if (profe?.usuario_id) {
          await notificar({
            para: profe.usuario_id, de: user?.id, tipo: 'tarea_entregada',
            titulo: 'Tarea completada',
            cuerpo: `${alumno.nombre} ${alumno.apellido} completó «${tarea.titulo}».`, ref_id: ent?.id || '',
          })
        }
        setToast(`Tarea completada · +${PUNTOS_POR_TAREA} XP`)
      }
    } finally { setGuardando(null) }
  }

  return { alternar, guardando, toast, entregaDe }
}

/** Fila de tarea con casilla para marcarla como hecha. */
export function TareaFila ({ tarea, materia, hecha, guardando, onAlternar, detalle }) {
  return (
    <div className="sec-row" data-hecha={hecha}>
      <button type="button" className="sec-check" role="checkbox" aria-checked={hecha} disabled={guardando}
        aria-label={hecha ? `Marcar «${tarea.titulo}» como pendiente` : `Marcar «${tarea.titulo}» como hecha`}
        onClick={() => onAlternar(tarea)}>
        {hecha && <Check size={15} strokeWidth={3} />}
      </button>
      <div style={{ minWidth: 0 }}>
        <div className="sec-row-title">{tarea.titulo}</div>
        <div className="sec-row-meta">
          <MateriaChip materia={materia} />
          {tarea.fecha_entrega && <span>Entrega {new Date(tarea.fecha_entrega + 'T00:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
        </div>
        {detalle}
      </div>
      {hecha ? <span className="sec-tag" data-tono="success">Hecha</span> : <VenceTag fecha={tarea.fecha_entrega} />}
    </div>
  )
}
