/* ============================================================
   Formato del campo `contenido` de una planificación.

   Todo se guarda como TEXTO PLANO, así el aprobador y el alumno lo
   siguen leyendo sin cambios y no hay que migrar la base de datos.
   Conviven tres tipos de línea:

     📍 Venezuela | Caracas | Allí está el Salto Ángel   <- ficha (opcional)
     🕰️ 1810 | Firma del acta | Se inicia la independencia <- ficha de Historia
     🗺️ Venezuela | 8.0 | -66.0 | 6                       <- mapa (opcional)
     Cualquier otra línea                                 <- notas de la clase

   Cada materia elige su marcador de ficha (📍 lugares, 🕰️ fechas…).
   Las fichas y los mapas son herramientas; si la maestra no las usa,
   el contenido es simplemente su texto.
============================================================ */

export const MARCA_FICHA = '📍'
export const MARCA_LINEA = '🕰️'
export const MARCA_MAPA = '🗺️'
const SEP = ' | '

const num = (v, def) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : def)

export function parsearContenido (value, nCols = 3, marcaFicha = MARCA_FICHA) {
  const fichas = []
  const mapas = []
  const notas = []

  for (const linea of (value ?? '').split('\n')) {
    const t = linea.trimStart()

    if (marcaFicha && t.startsWith(marcaFicha)) {
      const p = t.slice(marcaFicha.length).split('|').map(s => s.trim())
      fichas.push(Array.from({ length: nCols }, (_, i) => p[i] ?? ''))
    } else if (t.startsWith(MARCA_MAPA)) {
      const p = t.slice(MARCA_MAPA.length).split('|').map(s => s.trim())
      if (p[0]) mapas.push({ nombre: p[0], lat: num(p[1], 0), lon: num(p[2], 0), zoom: num(p[3], 5) })
    } else if (linea.trim()) {
      notas.push(linea)
    }
  }
  return { fichas, mapas, notas: notas.join('\n') }
}

export function serializarContenido ({ fichas = [], mapas = [], notas = '' }, marcaFicha = MARCA_FICHA) {
  const lineas = []

  for (const f of fichas) {
    if (!f.some(c => c.trim())) continue               // descarta fichas vacías
    // Quita separadores sobrantes si las últimas columnas van vacías.
    lineas.push(`${marcaFicha} ${f.join(SEP)}`.replace(/(\s*\|)+\s*$/, ''))
  }
  for (const m of mapas) {
    lineas.push(`${MARCA_MAPA} ${m.nombre}${SEP}${m.lat}${SEP}${m.lon}${SEP}${m.zoom}`)
  }

  const n = (notas || '').trim()
  if (n) { if (lineas.length) lineas.push(''); lineas.push(n) }
  return lineas.join('\n')
}

/* ============================================================
   Valor numérico de una fecha escrita a mano, para ordenar una línea
   de tiempo. Entiende "1810", "1810-04-19" y "500 a.C." (negativo).
   Lo que no se pueda interpretar se va al final, sin estorbar.
============================================================ */
export function valorCronologico (texto) {
  const t = (texto || '').trim()
  if (!t) return Infinity

  const m = t.match(/-?\d+/)
  if (!m) return Infinity

  let anio = parseInt(m[0], 10)

  // "a.C." / "a. C." / "aC" -> antes de Cristo, por tanto negativo.
  const normal = t.toLowerCase().replace(/[.\s]/g, '')
  if (normal.includes('ac') && !normal.includes('dc')) anio = -Math.abs(anio)

  return anio
}

/** Ordena filas de línea de tiempo por su primera columna (la fecha). */
export const ordenarCronologico = (filas) =>
  [...filas].sort((a, b) => valorCronologico(a[0]) - valorCronologico(b[0]))

/* URL de mapa embebido de OpenStreetMap (sin API key ni registro). */
export function urlMapaEmbed ({ lat, lon, zoom }) {
  const d = 180 / Math.pow(2, zoom)
  const bbox = [lon - d, lat - d / 2, lon + d, lat + d / 2].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
}

export const urlMapaGrande = ({ lat, lon, zoom }) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`
