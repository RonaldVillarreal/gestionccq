/* ============================================================
   Módulo Mantenimiento — utilidades compartidas entre el portal
   del jefe de mantenimiento y la vista del director.
============================================================ */

export const TIPO_PERSONAL = 'Mantenimiento'

export const DIAS = [
  { id: 'lun', corto: 'Lu', label: 'Lunes' },
  { id: 'mar', corto: 'Ma', label: 'Martes' },
  { id: 'mie', corto: 'Mi', label: 'Miércoles' },
  { id: 'jue', corto: 'Ju', label: 'Jueves' },
  { id: 'vie', corto: 'Vi', label: 'Viernes' },
  { id: 'sab', corto: 'Sá', label: 'Sábado' },
  { id: 'dom', corto: 'Do', label: 'Domingo' },
]
const ORDEN_DIAS = DIAS.map(d => d.id)

/** id del día de hoy (lun…dom). */
export const hoy = () => ORDEN_DIAS[(new Date().getDay() + 6) % 7]

export const diasDe = (h) => (h?.dias || '').split(',').filter(Boolean)
export const textoDias = (h) => {
  const d = diasDe(h)
  if (d.length === 5 && ORDEN_DIAS.slice(0, 5).every(x => d.includes(x))) return 'Lunes a viernes'
  if (d.length === 7) return 'Todos los días'
  return ORDEN_DIAS.filter(x => d.includes(x)).map(x => DIAS.find(y => y.id === x).corto).join(' · ') || '—'
}
export const textoHora = (h) => (h.hora_inicio || h.hora_fin ? `${h.hora_inicio || '?'}–${h.hora_fin || '?'}` : 'Sin hora')

/* Insumos frecuentes para armar pedidos con un clic. */
export const INSUMOS = [
  ['Cloro', 'galones'], ['Desinfectante', 'galones'], ['Jabón líquido', 'galones'],
  ['Detergente en polvo', 'kg'], ['Papel higiénico', 'bultos'], ['Toallas de papel', 'paquetes'],
  ['Bolsas de basura grandes', 'paquetes'], ['Escobas', 'unidades'], ['Coletos / mopas', 'unidades'],
  ['Guantes', 'pares'], ['Esponjas', 'unidades'], ['Ambientador', 'unidades'],
]

export const ESTADOS_PEDIDO = {
  pendiente: { label: 'Pendiente', badge: 'badge-warning' },
  enviado: { label: 'Enviado al proveedor', badge: 'badge-primary' },
  realizado: { label: 'Pedido realizado', badge: 'badge-success' },
}

export function itemsDe (pedido) {
  try {
    const items = JSON.parse(pedido?.items || '[]')
    return Array.isArray(items) ? items : []
  } catch { return [] }
}

/** Une los ítems de varios pedidos sumando cantidades del mismo insumo. */
export function unirItems (pedidos) {
  const mapa = new Map()
  for (const p of pedidos) {
    for (const it of itemsDe(p)) {
      const key = `${it.nombre.trim().toLowerCase()}|${(it.unidad || '').trim().toLowerCase()}`
      const prev = mapa.get(key)
      if (prev) prev.cantidad = (Number(prev.cantidad) || 0) + (Number(it.cantidad) || 0)
      else mapa.set(key, { nombre: it.nombre.trim(), cantidad: Number(it.cantidad) || 0, unidad: it.unidad || '' })
    }
  }
  return [...mapa.values()]
}

const SINGULAR = { galones: 'galón', paquetes: 'paquete', bultos: 'bulto', pares: 'par', unidades: 'unidad', litros: 'litro', cajas: 'caja' }
export function textoItem (it) {
  const unidad = Number(it.cantidad) === 1 ? (SINGULAR[(it.unidad || '').toLowerCase()] || it.unidad) : it.unidad
  return `${it.cantidad} ${unidad || ''} de ${it.nombre}`.replace(/\s+/g, ' ')
}

/** Mensaje de pedido para WhatsApp. */
export function mensajePedido ({ proveedor, items, institucion, nota }) {
  const saludo = proveedor?.contacto ? `Hola ${proveedor.contacto}` : 'Hola'
  return `${saludo}, le escribimos de ${institucion} para hacer el siguiente pedido:\n\n` +
    items.filter(it => it.nombre && Number(it.cantidad) > 0).map(it => `• ${textoItem(it)}`).join('\n') +
    (nota ? `\n\nNota: ${nota}` : '') +
    '\n\n¿Nos confirma disponibilidad, precio y fecha de entrega? ¡Gracias!'
}

export const linkWhatsApp = (telefono, msg) =>
  `https://wa.me/${(telefono || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(msg)}`

export const fechaCorta = (iso) => (iso ? new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : '')
