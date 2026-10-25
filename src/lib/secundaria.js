/* ============================================================
   Portal de secundaria — utilidades.
   Escala venezolana de 1 a 20 (aprueba con 10). Las notas llegan
   como texto libre que escribe el profesor ("18/20", "18", "9,5/10")
   y aquí se normalizan a base 20.
============================================================ */

export const ESCALA = 20
export const APRUEBA = 10

/** "18/20" → 18 · "9,5/10" → 19 · "17" → 17 · texto no numérico → null */
export function notaSobre20 (valor) {
  const m = String(valor ?? '').replace(',', '.').match(/(-?\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/)
  if (!m) return null
  const n = Number(m[1])
  const base = m[2] ? Number(m[2]) : ESCALA
  if (!base || Number.isNaN(n)) return null
  const v = (n / base) * ESCALA
  return v < 0 || v > ESCALA ? null : Math.round(v * 100) / 100
}

export const promedio = (notas) => {
  const v = notas.filter(n => n != null)
  return v.length ? Math.round((v.reduce((s, n) => s + n, 0) / v.length) * 100) / 100 : null
}

export const fmtNota = (n) => (n == null ? '—' : Number.isInteger(n) ? String(n) : n.toFixed(1))

/** Tono según la nota: rojo si reprueba, ámbar si está cerca del límite. */
export const tonoNota = (n) => (n == null ? 'neutral' : n < APRUEBA ? 'danger' : n < 14 ? 'warning' : 'success')

/** Agrupa calificaciones por materia con su promedio. */
export function notasPorMateria (calificaciones, materias = []) {
  const grupos = new Map()
  for (const c of calificaciones) {
    const nombre = (c.materia || 'Sin materia').trim()
    if (!grupos.has(nombre)) grupos.set(nombre, [])
    grupos.get(nombre).push({ ...c, nota: notaSobre20(c.valor) })
  }
  // Las materias sin notas también aparecen, para ver el panorama completo.
  for (const m of materias) if (!grupos.has(m.nombre)) grupos.set(m.nombre, [])
  return [...grupos.entries()].map(([nombre, evals]) => ({
    nombre,
    color: materias.find(m => m.nombre === nombre)?.color,
    evals: evals.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')),
    promedio: promedio(evals.map(e => e.nota)),
  })).sort((a, b) => a.nombre.localeCompare(b.nombre))
}

/** Nota promedio necesaria en las evaluaciones que faltan para llegar a `meta`.
    Todas las evaluaciones pesan igual. Devuelve null si no se puede calcular. */
export function notaNecesaria ({ notas, restantes, meta }) {
  const r = Number(restantes)
  if (!r || r < 1) return null
  const suma = notas.filter(n => n != null).reduce((s, n) => s + n, 0)
  const total = notas.filter(n => n != null).length + r
  return Math.round(((meta * total - suma) / r) * 100) / 100
}

/* ---------- Fechas ---------- */
const DIA = 86400000
export const isoDia = (d) => {
  const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset())
  return x.toISOString().slice(0, 10)
}
export const hoyISO = () => isoDia(new Date())
export const diasHasta = (fecha) => {
  if (!fecha) return null
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const d = Math.round((new Date(fecha + 'T00:00:00') - hoy) / DIA)
  return Number.isNaN(d) ? null : d
}

/** Texto corto de vencimiento: "Vencida hace 2 d", "Hoy", "Mañana", "En 5 d". */
export function vence (fecha) {
  const d = diasHasta(fecha)
  if (d == null) return { txt: 'Sin fecha', tono: 'neutral' }
  if (d < 0) return { txt: `Vencida hace ${-d} d`, tono: 'danger' }
  if (d === 0) return { txt: 'Hoy', tono: 'warning' }
  if (d === 1) return { txt: 'Mañana', tono: 'warning' }
  return { txt: `En ${d} d`, tono: d <= 3 ? 'primary' : 'neutral' }
}

/** Lunes de la semana de `fecha` + `offset` semanas. */
export function lunesDe (offset = 0, fecha = new Date()) {
  const d = new Date(fecha); d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
  return d
}
export const diasSemana = (lunes) => Array.from({ length: 7 }, (_, i) => { const d = new Date(lunes); d.setDate(d.getDate() + i); return d })

export const fechaLarga = (d = new Date()) => d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })

export function saludo () {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

/** Siglas de una materia para chips compactos: "Matemática" → "MAT". */
export const siglas = (nombre = '') => nombre.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-zA-Z ]/g, '').trim().slice(0, 3).toUpperCase() || '—'
