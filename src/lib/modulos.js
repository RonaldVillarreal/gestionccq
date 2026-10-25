/* ============================================================
   Módulos por institución.
   El Super Admin los activa/desactiva en cada sistema. Si una institución
   nunca guardó su lista (`modulos` vacío), se usan los `porDefecto`:
   así las instituciones existentes conservan todo lo que ya tenían.
============================================================ */

export const MODULOS = [
  { id: 'administracion', label: 'Administración y finanzas', desc: 'Portal de la administradora: facturación y cobranzas.', porDefecto: true },
  { id: 'portal_alumno', label: 'Portal del alumno', desc: 'Acceso de alumnos a tareas, biblioteca y logros.', porDefecto: true },
  { id: 'portal_secundaria', label: 'Portal de secundaria', desc: 'Diseño y herramientas para alumnos de secundaria: notas, agenda, apuntes, temporizador de estudio. Requiere el portal del alumno.', porDefecto: true },
  { id: 'planificacion', label: 'Planificación y aprobaciones', desc: 'Planificaciones del maestro y portal del aprobador.', porDefecto: true },
  { id: 'fichas', label: 'Fichas del maestro', desc: 'Fichas de observación, cotejo y registro anecdótico.', porDefecto: true },
  { id: 'mantenimiento', label: 'Mantenimiento', desc: 'Jefe de mantenimiento: personal, zonas, horarios, pedidos de limpieza y proveedores.', porDefecto: false },
]

export const modulosPorDefecto = () => MODULOS.filter(m => m.porDefecto).map(m => m.id)

/* Módulos que existían cuando se guardaba solo la lista de activos (formato viejo). */
const CONOCIDOS_LEGADO = ['administracion', 'portal_alumno', 'planificacion', 'fichas', 'mantenimiento']

/** Lista efectiva de módulos activos de una institución.
    Se guarda como JSON { activos, conocidos }: un módulo que no estaba en
    `conocidos` cuando se guardó (porque se creó después) toma su valor por
    defecto, en vez de quedar apagado sin que nadie lo decidiera.
    null = nunca configurado → todos los valores por defecto. */
export function modulosDe (inst) {
  let guardado = null
  try { guardado = JSON.parse(inst?.modulos) } catch { /* sin configurar */ }
  if (!guardado) return modulosPorDefecto()
  const activos = Array.isArray(guardado) ? guardado : guardado.activos || []
  const conocidos = Array.isArray(guardado) ? CONOCIDOS_LEGADO : guardado.conocidos || []
  return MODULOS.filter(m => (conocidos.includes(m.id) ? activos.includes(m.id) : m.porDefecto)).map(m => m.id)
}

/** Valor a guardar en `instituciones.modulos`. */
export const serializarModulos = (activos) => JSON.stringify({ activos, conocidos: MODULOS.map(m => m.id) })

/* Módulo que necesita cada rol para poder entrar a su portal. */
export const MODULO_DE_ROL = {
  administradora: 'administracion',
  alumno: 'portal_alumno',
  aprobador: 'planificacion',
  mantenimiento: 'mantenimiento',
}
