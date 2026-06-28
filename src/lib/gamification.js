/* ============================================================
   Gamificación del portal del alumno.
   La idea: mantener a los niños de primaria y secundaria atentos
   con estrellas, niveles, racha y logros — todo derivado de sus
   "entregas" reales (tareas marcadas como hechas), así el progreso
   queda sincronizado con la base de datos, no inventado.
============================================================ */

export const PUNTOS_POR_TAREA = 10
export const PUNTOS_POR_NIVEL = 50

/* Calcula puntos/nivel/racha a partir de las entregas del alumno. */
export function calcularProgreso (entregas = []) {
  const hechas = entregas.filter(e => e.status === 'entregada')
  const puntos = hechas.length * PUNTOS_POR_TAREA
  const nivel = Math.floor(puntos / PUNTOS_POR_NIVEL) + 1
  const puntosEnNivel = puntos % PUNTOS_POR_NIVEL
  const faltanParaSubir = PUNTOS_POR_NIVEL - puntosEnNivel
  const progresoPct = Math.round((puntosEnNivel / PUNTOS_POR_NIVEL) * 100)

  // Racha = días distintos en los que entregó algo (motiva la constancia).
  const dias = new Set(hechas.map(e => (e.fecha || e.created_at || '').slice(0, 10)).filter(Boolean))
  const racha = dias.size

  return { puntos, nivel, puntosEnNivel, faltanParaSubir, progresoPct, completadas: hechas.length, racha }
}

/* Título amistoso según el nivel. */
export function tituloNivel (nivel) {
  const titulos = [
    'Explorador', 'Aprendiz', 'Curioso', 'Estudioso', 'Aventurero',
    'Campeón', 'Experto', 'Maestro del saber', 'Súper estrella', 'Leyenda',
  ]
  return titulos[Math.min(nivel - 1, titulos.length - 1)]
}

/* Mensajes que animan según cuántas tareas pendientes quedan. */
export function mensajeAnimo ({ pendientes, completadas }) {
  if (completadas === 0 && pendientes > 0) return '¡A darle! Tu primera estrella te espera ⭐'
  if (pendientes === 0) return '¡Increíble! No tienes tareas pendientes 🎉'
  if (pendientes === 1) return '¡Solo te queda una tarea! Tú puedes 💪'
  return `Llevas muy bien tu ritmo. ¡Vamos por las ${pendientes} que faltan! 🚀`
}

/* Catálogo de logros. Cada uno se "desbloquea" según el progreso real. */
export const LOGROS = [
  { id: 'primera',  emoji: '🌟', titulo: 'Primera estrella',  desc: 'Completa tu primera tarea',        cumple: p => p.completadas >= 1 },
  { id: 'tres',     emoji: '📚', titulo: 'Buen comienzo',      desc: 'Completa 3 tareas',                 cumple: p => p.completadas >= 3 },
  { id: 'cinco',    emoji: '🏅', titulo: 'Dedicado',           desc: 'Completa 5 tareas',                 cumple: p => p.completadas >= 5 },
  { id: 'diez',     emoji: '🏆', titulo: 'Imparable',          desc: 'Completa 10 tareas',                cumple: p => p.completadas >= 10 },
  { id: 'racha3',   emoji: '🔥', titulo: 'En racha',           desc: 'Entrega tareas 3 días distintos',   cumple: p => p.racha >= 3 },
  { id: 'nivel3',   emoji: '🦉', titulo: 'Sabio curioso',      desc: 'Llega al nivel 3',                  cumple: p => p.nivel >= 3 },
]

export function logrosDesbloqueados (progreso) {
  return LOGROS.map(l => ({ ...l, listo: l.cumple(progreso) }))
}

/* Emoji representativo según el nombre de la materia. */
export function materiaEmoji (nombre = '') {
  const n = nombre.toLowerCase()
  if (n.includes('matem')) return '🔢'
  if (n.includes('lengua') || n.includes('liter') || n.includes('castellano') || n.includes('lectura')) return '📖'
  if (n.includes('cien') || n.includes('natural') || n.includes('biolog') || n.includes('quím') || n.includes('físic')) return '🔬'
  if (n.includes('histor') || n.includes('social') || n.includes('geograf')) return '🌎'
  if (n.includes('ingl') || n.includes('idioma')) return '🗣️'
  if (n.includes('art') || n.includes('plást') || n.includes('dibujo')) return '🎨'
  if (n.includes('educ') && n.includes('fís')) return '⚽'
  if (n.includes('deporte') || n.includes('fisic')) return '⚽'
  if (n.includes('music') || n.includes('músic')) return '🎵'
  if (n.includes('comput') || n.includes('tecno') || n.includes('informá')) return '💻'
  if (n.includes('valor') || n.includes('religi') || n.includes('moral')) return '💛'
  return '✏️'
}

/* Colores festivos para alternar en tarjetas (se mezclan con el color real
   de la materia cuando existe). Mantienen la identidad pero suman alegría. */
export const COLORES_ALEGRES = ['#2A2F6B', '#C0392B', '#2E7D52', '#C99A2E', '#7B4BBF', '#0E8C8C', '#D9568A', '#E07A23']
