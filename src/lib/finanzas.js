/* ============================================================
   Lógica financiera compartida.
   La usa el portal de la Administradora (cobranzas/facturación) y
   el dashboard del Admin, para que ambos vean los mismos números.
============================================================ */

export const ESTADOS = {
  pendiente: { label: 'Pendiente', badge: 'badge-warning' },
  enviada:   { label: 'Enviada',   badge: 'badge-primary' },
  pagada:    { label: 'Pagada',    badge: 'badge-success' },
}

export const esDeuda = (f) => f.estado !== 'pagada'      // pendiente o enviada
const monto = (f) => Number(f.monto) || 0

/** Resumen de facturación para tarjetas y gráficos. */
export function resumenFacturas (facturas = []) {
  const pagadas = facturas.filter(f => f.estado === 'pagada')
  const deuda = facturas.filter(esDeuda)
  const recaudado = pagadas.reduce((s, f) => s + monto(f), 0)
  const porCobrar = deuda.reduce((s, f) => s + monto(f), 0)

  // Alumnos distintos con al menos una factura sin pagar.
  const alumnosMorosos = new Set(deuda.map(f => f.alumno_id)).size

  return {
    total: facturas.length,
    pagadas: pagadas.length,
    pendientes: facturas.filter(f => f.estado === 'pendiente').length,
    enviadas: facturas.filter(f => f.estado === 'enviada').length,
    recaudado, porCobrar, alumnosMorosos,
  }
}

/** Recaudación por periodo (YYYY-MM) para el gráfico de barras. */
export function ingresosPorPeriodo (facturas = []) {
  const acc = {}
  for (const f of facturas.filter(f => f.estado === 'pagada')) {
    const p = f.periodo || (f.fecha_pago || f.created_at || '').slice(0, 7)
    if (!p) continue
    acc[p] = (acc[p] || 0) + monto(f)
  }
  return Object.entries(acc)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, total]) => ({ periodo: etiquetaPeriodo(periodo), total }))
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export function etiquetaPeriodo (p) {
  const m = /^(\d{4})-(\d{2})$/.exec(p || '')
  if (!m) return p || '—'
  return `${MESES[Number(m[2]) - 1] || m[2]} ${m[1].slice(2)}`
}

/* ============================================================
   Año escolar. En Venezuela arranca en septiembre, así que un
   año escolar va de sep (año N) a ago (año N+1). Se identifica por
   su año de inicio: sep 2025 … ago 2026 => año escolar 2025.
============================================================ */
export const MES_INICIO_ESCOLAR = 9  // septiembre

export function anioEscolarActual (hoy = new Date()) {
  return (hoy.getMonth() + 1) >= MES_INICIO_ESCOLAR ? hoy.getFullYear() : hoy.getFullYear() - 1
}

/** Año escolar (año de inicio) al que pertenece un periodo "YYYY-MM". */
export function anioEscolarDe (periodo) {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo || '')
  if (!m) return null
  const anio = Number(m[1]), mes = Number(m[2])
  return mes >= MES_INICIO_ESCOLAR ? anio : anio - 1
}

export const etiquetaAnioEscolar = (inicio) => `${inicio}–${inicio + 1}`

const periodoDe = (f) => f.periodo || (f.fecha_emision || f.fecha_pago || f.created_at || '').slice(0, 7)

/** Filtra las facturas que pertenecen a un año escolar (por su año de inicio). */
export function facturasDeAnioEscolar (facturas = [], inicio) {
  return facturas.filter(f => anioEscolarDe(periodoDe(f)) === inicio)
}

/** Deuda total de un alumno según sus facturas sin pagar. */
export function deudaDeAlumno (facturas, alumnoId) {
  return facturas
    .filter(f => f.alumno_id === alumnoId && esDeuda(f))
    .reduce((s, f) => s + monto(f), 0)
}

/** Mensaje de cobranza listo para WhatsApp o correo. */
export function mensajeCobranza ({ repNombre, alumnoNombre, concepto, monto: m, periodo }) {
  const saludo = repNombre ? `Estimado/a ${repNombre}` : 'Estimado/a representante'
  return `${saludo}, le recordamos el pago pendiente de ${alumnoNombre}` +
    `${concepto ? ` por "${concepto}"` : ''}${periodo ? ` (${etiquetaPeriodo(periodo)})` : ''}` +
    ` por un monto de $${m}. Puede acercarse a administración o responder este mensaje. ¡Gracias!` +
    `\n\nColegio Cardenal Quintero`
}
