import { DEFAULT_TENANT } from './db'

/* ============================================================
   Instituciones (sistemas de gestión) — utilidades compartidas
   entre el panel de Super Admin y el tema de cada institución.
============================================================ */

export const TIPOS = [
  { id: 'colegio', label: 'Colegio' },
  { id: 'escuela', label: 'Escuela' },
  { id: 'universidad', label: 'Universidad' },
]

/* La institución original. Si aún no existe su registro en
   `instituciones`, se usa esto (logo y colores actuales del sistema). */
export const PRINCIPAL = {
  slug: DEFAULT_TENANT,
  nombre: 'Colegio Cardenal Quintero',
  tipo: 'colegio',
  estado: 'activo',
  logo: '/logo.png',
  color_primario: '#2A2F6B',
  color_acento: '#C99A2E',
  ciudad: '', direccion: '', telefono: '', email: '', responsable: '',
}

/* Paletas sugeridas: [nombre, primario, acento] */
export const PALETAS = [
  ['Índigo y oro', '#2A2F6B', '#C99A2E'],
  ['Azul marino', '#1F3A5F', '#E0A526'],
  ['Verde bosque', '#1E5631', '#D4A72C'],
  ['Vino', '#6B1E2E', '#C9A24B'],
  ['Petróleo', '#0F5257', '#E07A3F'],
  ['Grafito', '#2E3440', '#5E9ED6'],
  ['Morado', '#4B2A7B', '#F2B134'],
  ['Rojo ladrillo', '#9A3324', '#2F4858'],
]

export function slugify (txt) {
  return (txt || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/* ---------- Color ---------- */
const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const rgbToHex = (rgb) => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
/** Mezcla `hex` con `con` en proporción `t` (0 = hex, 1 = con). */
const mix = (hex, con, t) => {
  const a = hexToRgb(hex), b = hexToRgb(con)
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * t))
}
const valido = (hex) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex || '')

/** CSS que sobreescribe los tokens de color del sistema para una institución. */
export function cssTema ({ color_primario: p, color_acento: a }) {
  if (!valido(p) || !valido(a)) return ''
  return `
:root, [data-theme="light"] {
  --primary: ${p}; --primary-soft: ${mix(p, '#FFFFFF', 0.88)};
  --accent: ${a}; --accent-soft: ${mix(a, '#FFFFFF', 0.82)};
}
[data-theme="dark"] {
  --primary: ${mix(p, '#FFFFFF', 0.45)}; --primary-soft: ${mix(p, '#1C1F2B', 0.7)};
  --accent: ${mix(a, '#FFFFFF', 0.2)}; --accent-soft: ${mix(a, '#1C1F2B', 0.8)};
}`
}

/* ---------- Logo ----------
   Se reduce en el navegador (máx. 256 px) y se guarda como data-URL,
   así no hace falta un bucket de Storage. */
export function leerLogo (file, max = 256) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('El archivo debe ser una imagen.'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Formato de imagen no soportado.'))
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/png'))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/** Ruta pública del login de una institución. */
export const rutaLogin = (slug) => (!slug || slug === DEFAULT_TENANT ? '/' : `/i/${slug}`)
