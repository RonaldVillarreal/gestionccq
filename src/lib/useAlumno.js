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

  const misMaterias = useMemo(
    () => (maestro ? materias.rows.filter(m => m.maestro_id === maestro.id) : []),
    [materias.rows, maestro]
  )

  const coincideGrado = (x) =>
    x.grado === alumno?.grado && (!x.seccion || !alumno?.seccion || x.seccion === alumno.seccion)

  const misTareas = useMemo(
    () => (alumno?.grado ? tareas.rows.filter(coincideGrado) : []),
    [tareas.rows, alumno]
  )
  const misLibros = useMemo(
    () => (alumno?.grado ? libros.rows.filter(coincideGrado) : []),
    [libros.rows, alumno]
  )
  const misEntregas = useMemo(
    () => (alumno ? entregas.rows.filter(e => e.alumno_id === alumno.id) : []),
    [entregas.rows, alumno]
  )

  const progreso = useMemo(() => calcularProgreso(misEntregas), [misEntregas])

  const loading = alumnos.loading || maestros.loading || tareas.loading || entregas.loading

  return {
    user, alumno, maestro, misMaterias, misTareas, misLibros, misEntregas, progreso, loading,
    tablas: { alumnos, maestros, materias, tareas, libros, entregas },
  }
}
