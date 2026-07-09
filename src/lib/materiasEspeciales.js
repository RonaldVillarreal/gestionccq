/* ============================================================
   Registro de materias con comportamiento especial.

   En vez de repartir `if (materia === 'Matemática')` por la app,
   cada materia especial declara aquí sus capacidades. Para sumar
   otra materia (Química, Música…) basta con agregar una entrada:
   el editor de Planificación se adapta solo.
============================================================ */

/** Quita tildes y normaliza para comparar nombres escritos de cualquier forma. */
export function normalizar (nombre) {
  return (nombre || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
}

const TIPOS = [
  {
    key: 'matematica',
    label: 'Matemática',
    emoji: '🔢',
    // Capacidades que activa en el editor de Planificación:
    cuaderno: true,      // editor de cuaderno cuadriculado con operaciones
    calculadora: true,   // herramienta de calculadora
    // Acepta: Matemática, Matematicas, Mate, Matemática I…
    coincide: (n) => n.includes('matematic') || n === 'mate',
  },
]

/** Devuelve el tipo especial de una materia, o null si es una materia normal. */
export function tipoDeMateria (nombre) {
  const n = normalizar(nombre)
  if (!n) return null
  return TIPOS.find(t => t.coincide(n)) || null
}

export const esMatematica = (nombre) => tipoDeMateria(nombre)?.key === 'matematica'
