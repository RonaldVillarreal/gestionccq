import { useMemo } from 'react'
import { db } from './db'
import { useTable } from './useTable'
import { useAuth } from '../context/AuthContext'

/* ============================================================
   Bandeja de entrada.
   Las notificaciones se dirigen a un usuario por su id de login
   (`para`). Se crean desde donde ocurre el evento (nueva tarea,
   entrega, medalla) con `notificar(...)`, y cada usuario las lee
   en su bandeja con `useInbox()`.
============================================================ */

/** Crea una notificación (una escritura directa; no necesita un handle de tabla). */
export async function notificar ({ para, de = '', tipo, titulo, cuerpo = '', ref_id = '' }) {
  if (!para) return null
  return db.insert('notificaciones', { para, de, tipo, titulo, cuerpo, ref_id, leido: false })
}

/** Envía la misma notificación a varios destinatarios (ej: todo el grado). */
export async function notificarVarios (paraIds, base) {
  const unicos = [...new Set((paraIds || []).filter(Boolean))]
  await Promise.all(unicos.map(para => notificar({ ...base, para })))
}

/* Iconos y tono por tipo de notificación, para la bandeja. */
export const TIPOS_NOTI = {
  tarea_nueva:      { emoji: '📌', tono: 'badge-primary' },
  tarea_entregada:  { emoji: '✅', tono: 'badge-success' },
  medalla:          { emoji: '🎖️', tono: 'badge-accent' },
}

/** Bandeja del usuario logueado: sus notificaciones, contador y acciones. */
export function useInbox () {
  const { user } = useAuth()
  const noti = useTable('notificaciones')

  const mias = useMemo(
    () => noti.rows
      .filter(n => n.para === user?.id)
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [noti.rows, user]
  )
  const noLeidas = mias.filter(n => !n.leido).length

  return {
    mias, noLeidas, loading: noti.loading, refresh: noti.refresh,
    marcarLeido: (id) => noti.update(id, { leido: true }),
    marcarTodo: async () => { for (const n of mias.filter(n => !n.leido)) await noti.update(n.id, { leido: true }) },
    eliminar: (id) => noti.remove(id),
  }
}
