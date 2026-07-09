/* ============================================================
   Registro de materias con comportamiento especial.

   En vez de repartir `if (materia === 'Matemática')` por la app,
   cada materia declara aquí qué editor usa y qué herramientas activa.
   Para sumar otra materia basta con agregar una entrada: el editor de
   Planificación se adapta solo.

   editor:
     'cuaderno' -> papel cuadriculado con operaciones que se calculan
     'materia'  -> notas + herramientas OPCIONALES (fichas, mapa…)
     (ausente)  -> caja de texto normal

   Las herramientas de 'materia' arrancan apagadas: no toda clase de
   Geografía va de capitales. La maestra enciende solo lo que el tema pide.
============================================================ */

import { validarCita } from './biblia'

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
    insignia: 'Cuaderno + calculadora',
    editor: 'cuaderno',
    calculadora: true,
    // Acepta: Matemática, Matematicas, Mate, Matemática I…
    coincide: (n) => n.includes('matematic') || n === 'mate',
  },
  {
    key: 'geografia',
    label: 'Geografía',
    emoji: '🌎',
    insignia: 'Mapa + fichas',
    editor: 'materia',
    mapa: true,                     // herramienta: insertar mapas
    fichas: {                       // herramienta: tabla de lugares (opcional)
      label: 'Fichas de lugares',
      ayuda: 'Úsala cuando el tema trate de lugares concretos.',
      columnas: [
        { key: 'lugar',   label: 'Lugar',      placeholder: 'Ej: Venezuela', ancho: '1fr' },
        { key: 'capital', label: 'Capital',    placeholder: 'Ej: Caracas',   ancho: '1fr' },
        { key: 'dato',    label: 'Dato clave', placeholder: 'Ej: Allí está el Salto Ángel, la cascada más alta del mundo', ancho: '2fr' },
      ],
    },
    // Acepta: Geografía, Geografia, Geografía e Historia…
    coincide: (n) => n.includes('geografi'),
  },
  {
    key: 'historia',
    label: 'Historia',
    emoji: '🏛️',
    insignia: 'Línea de tiempo + mapa',
    editor: 'materia',
    mapa: true,                     // los hechos históricos ocurren en lugares
    fichas: {
      label: 'Línea de tiempo',
      marca: '🕰️',
      ayuda: 'Úsala cuando el tema tenga hechos con fecha.',
      ordenar: true,                // se puede ordenar cronológicamente
      columnas: [
        { key: 'fecha',  label: 'Año / Fecha', placeholder: 'Ej: 1810 · o 500 a.C.', ancho: '150px' },
        { key: 'evento', label: 'Hecho',       placeholder: 'Ej: Firma del acta de independencia', ancho: '1fr' },
        { key: 'detalle', label: 'Detalle',    placeholder: 'Ej: Marca el inicio del proceso independentista', ancho: '1.4fr' },
      ],
    },
    // Acepta: Historia, Historia de Venezuela, Historia Universal…
    coincide: (n) => n.includes('histori'),
  },
  {
    key: 'religion',
    label: 'Religión',
    emoji: '✝️',
    insignia: 'Citas bíblicas + mapa',
    editor: 'materia',
    mapa: true,                     // lugares de Tierra Santa: Belén, Nazaret…
    fichas: {
      label: 'Citas bíblicas',
      marca: '✝️',
      ayuda: 'Úsala cuando el tema se apoye en pasajes concretos.',
      columnas: [
        { key: 'cita',      label: 'Cita',      placeholder: 'Ej: Mt 5,9', ancho: '160px', validar: validarCita },
        { key: 'mensaje',   label: 'Mensaje',   placeholder: 'Ej: Bienaventurados los que trabajan por la paz', ancho: '1.4fr' },
        { key: 'reflexion', label: 'Reflexión', placeholder: 'Ej: ¿Cómo puedo ser constructor de paz en el aula?', ancho: '1.4fr' },
      ],
    },
    // Acepta: Religión, Religion, Educación Religiosa, Catequesis…
    coincide: (n) => n.includes('religi') || n.includes('catequesis'),
  },
]

/** Devuelve el tipo especial de una materia, o null si es una materia normal. */
export function tipoDeMateria (nombre) {
  const n = normalizar(nombre)
  if (!n) return null
  return TIPOS.find(t => t.coincide(n)) || null
}

export const esMatematica = (nombre) => tipoDeMateria(nombre)?.key === 'matematica'
