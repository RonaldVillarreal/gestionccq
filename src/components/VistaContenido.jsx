import { ExternalLink } from 'lucide-react'
import { MARCA_FICHA, MARCA_LINEA, MARCA_MAPA, urlMapaEmbed, urlMapaGrande } from '../lib/contenidoMateria'

/* ============================================================
   Vista de solo lectura del contenido de una planificación o tarea.
   Lo que la maestra escribió como texto plano se dibuja de verdad:
   los mapas como mapas, las fichas como fichas.

   Reconoce los marcadores de cualquier materia, así no necesita
   saber de qué materia viene el texto.
============================================================ */

const MARCA_CITA = '✝️'
const FICHAS = [MARCA_FICHA, MARCA_LINEA, MARCA_CITA]

const num = (v) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0)

/* Agrupa las líneas en bloques: texto seguido, fichas y mapas. */
function analizar (texto) {
  const bloques = []
  const empujarTexto = (linea) => {
    const ultimo = bloques[bloques.length - 1]
    if (ultimo?.tipo === 'texto') ultimo.lineas.push(linea)
    else bloques.push({ tipo: 'texto', lineas: [linea] })
  }

  for (const linea of (texto ?? '').split('\n')) {
    const t = linea.trimStart()
    const marca = FICHAS.find(m => t.startsWith(m))

    if (marca) {
      const partes = t.slice(marca.length).split('|').map(s => s.trim()).filter(Boolean)
      bloques.push({ tipo: 'ficha', marca, partes })
    } else if (t.startsWith(MARCA_MAPA)) {
      const p = t.slice(MARCA_MAPA.length).split('|').map(s => s.trim())
      if (p[0]) bloques.push({ tipo: 'mapa', nombre: p[0], lat: num(p[1]), lon: num(p[2]), zoom: num(p[3]) || 5 })
    } else if (linea.trim()) {
      empujarTexto(linea)
    }
  }
  return bloques
}

export default function VistaContenido ({ texto, vacio = 'Sin contenido.' }) {
  const bloques = analizar(texto)
  if (!bloques.length) return <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>{vacio}</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {bloques.map((b, i) => {
        if (b.tipo === 'texto') {
          return (
            <p key={i} style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>
              {b.lineas.join('\n')}
            </p>
          )
        }

        if (b.tipo === 'ficha') {
          const [principal, ...resto] = b.partes
          return (
            <div key={i} className="vc-ficha">
              <span className="vc-marca">{b.marca}</span>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{principal}</span>
                {resto.length > 0 && (
                  <span style={{ fontSize: 13.5, color: 'var(--text-soft)' }}> · {resto.join(' · ')}</span>
                )}
              </div>
            </div>
          )
        }

        return (
          <div key={i} className="mapa-card">
            <iframe title={`Mapa de ${b.nombre}`} src={urlMapaEmbed(b)} loading="lazy" />
            <div className="mapa-card-pie">
              <span style={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🗺️ {b.nombre}
              </span>
              <a className="btn btn-ghost btn-sm" href={urlMapaGrande(b)} target="_blank" rel="noreferrer" title="Ver más grande">
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
