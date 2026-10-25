import { useMemo } from 'react'
import { useTable } from './useTable'
import { useAuth } from '../context/AuthContext'
import { calcularProgreso } from './gamification'

/* ============================================================
   Hook central del portal del alumno.
   Resuelve toda la sincronización a partir del usuario logueado:
   alumno → su grado/sección → su maestra → materias → tareas → libros,
   más sus entregas y el progreso de gamificación.
   Devuelve también los handles de tabla para mutar (marcar entregas).
============================================================ */
export function useAlumno () {
  const { user } = useAuth()
  const alumnos  = useTable('alumnos')
  const maestros = useTable('maestros')
  const materias = useTable('materias')
  const tareas   = useTable('tareas')
  const libros   = useTable('libros')
  const entregas = useTable('entregas')
  const medallas = useTable('medallas')
  const items    = useTable('items_alumno')

  const alumno = useMemo(
    () => alumnos.rows.find(a => a.usuario_id === user?.id) || null,
    [alumnos.rows, user]
  )

  // La maestra del alumno = la asignada a su mismo grado (y sección si aplica).
  const maestro = useMemo(() => {
    if (!alumno?.grado) return null
    return maestros.rows.find(m =>
      m.grado === alumno.grado && (!m.seccion || !alumno.seccion || m.seccion === alumno.seccion)
    ) || null
  }, [maestros.rows, alumno])

  const esSecundaria = (alumno?.nivel || '').toLowerCase() === 'secundaria'

  const coincideGrado = (x) =>
    x.grado === alumno?.grado && (!x.seccion || !alumno?.seccion || x.seccion === alumno.seccion)

  // En secundaria hay un profesor por materia: todos los asignados a su año/sección.
  const misMaestros = useMemo(
    () => (alumno?.grado ? maestros.rows.filter(coincideGrado) : []),
    [maestros.rows, alumno]
  )

  const misTareas = useMemo(
    () => (alumno?.grado ? tareas.rows.filter(coincideGrado) : []),
    [tareas.rows, alumno]
  )
  const misLibros = useMemo(
    () => (alumno?.grado ? libros.rows.filter(coincideGrado) : []),
    [libros.rows, alumno]
  )

  // Primaria: las materias de su maestra. Secundaria: las de todos sus
  // profesores más las que aparezcan en sus tareas o libros.
  const misMaterias = useMemo(() => {
    if (!esSecundaria) return maestro ? materias.rows.filter(m => m.maestro_id === maestro.id) : []
    const ids = new Set(misMaestros.map(m => m.id))
    const usadas = new Set([...misTareas, ...misLibros].map(x => x.materia_id))
    return materias.rows.filter(m => ids.has(m.maestro_id) || usadas.has(m.id))
  }, [materias.rows, maestro, esSecundaria, misMaestros, misTareas, misLibros])

  // Calificaciones que los profesores cargan en la ficha del alumno.
  const misCalificaciones = useMemo(
    () => (alumno ? items.rows.filter(i => i.alumno_id === alumno.id && i.categoria === 'calificacion') : []),
    [items.rows, alumno]
  )
  const misEntregas = useMemo(
    () => (alumno ? entregas.rows.filter(e => e.alumno_id === alumno.id) : []),
    [entregas.rows, alumno]
  )
  const misMedallas = useMemo(
    () => (alumno ? medallas.rows.filter(m => m.alumno_id === alumno.id)
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')) : []),
    [medallas.rows, alumno]
  )

  const progreso = useMemo(() => calcularProgreso(misEntregas, misMedallas), [misEntregas, misMedallas])

  const loading = alumnos.loading || maestros.loading || tareas.loading || entregas.loading

  return {
    user, alumno, maestro, misMaterias, misTareas, misLibros, misEntregas, misMedallas, progreso, loading,
    esSecundaria, misMaestros, misCalificaciones,
    tablas: { alumnos, maestros, materias, tareas, libros, entregas, medallas },
  }
}
