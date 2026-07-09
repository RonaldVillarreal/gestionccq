import { useEffect, useState } from 'react'
import { X, Search, CornerDownLeft, ZoomIn, ZoomOut, Loader } from 'lucide-react'
import { urlMapaEmbed } from '../lib/contenidoMateria'

/* Buscador de lugares con OpenStreetMap (Nominatim).
   No requiere API key ni registro. Al insertar, guarda una línea de
   texto plano con nombre + coordenadas + zoom, así el mapa se puede
   volver a dibujar sin depender de una nueva búsqueda. */

async function buscarLugar (q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=es&q=${encodeURIComponent(q)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('No se pudo buscar el lugar')
  return (await res.json()).map(r => ({
    nombre: r.display_name.split(',').slice(0, 2).join(',').trim(),
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
  }))
}

export default function MapaBuscador ({ onInsertar, onClose }) {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState([])
  const [sel, setSel] = useState(null)
  const [zoom, setZoom] = useState(5)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  async function buscar (e) {
    e?.preventDefault()
    if (!q.trim()) return
    setCargando(true); setError(''); setSel(null)
    try {
      const r = await buscarLugar(q.trim())
      setResultados(r)
      if (!r.length) setError('No encontré ese lugar. Prueba con otro nombre.')
      else setSel(r[0])
    } catch (err) {
      setError('No hay conexión con el buscador de mapas. Intenta de nuevo.')
    } finally { setCargando(false) }
  }

  return (
    <div className="mapa-panel">
      <div className="calc-head">
        <strong style={{ fontSize: 14 }}>🗺️ Insertar mapa</strong>
        <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>
      </div>

      <form onSubmit={buscar} style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Ej: Venezuela, Los Andes, Río Orinoco" autoFocus />
        <button className="btn btn-primary btn-sm" type="submit" disabled={cargando}>
          {cargando ? <Loader size={15} /> : <Search size={15} />}
        </button>
      </form>

      {error && <div className="badge badge-warning" style={{ alignSelf: 'flex-start' }}>{error}</div>}

      {resultados.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 110, overflowY: 'auto' }}>
          {resultados.map((r, i) => (
            <button key={i} onClick={() => setSel(r)}
              className={`btn btn-sm ${sel === r ? 'btn-primary' : 'btn-ghost'}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left', fontSize: 12.5 }}>
              {r.nombre}
            </button>
          ))}
        </div>
      )}

      {sel && (
        <>
          <iframe title="Vista previa del mapa" className="mapa-preview"
            src={urlMapaEmbed({ ...sel, zoom })} loading="lazy" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.max(2, z - 1))} title="Alejar"><ZoomOut size={14} /></button>
            <input type="range" min={2} max={14} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
            <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.min(14, z + 1))} title="Acercar"><ZoomIn size={14} /></button>
          </div>
          <button className="btn btn-primary btn-sm" style={{ justifyContent: 'center', width: '100%' }}
            onClick={() => { onInsertar({ ...sel, zoom }); onClose() }}>
            <CornerDownLeft size={14} /> Insertar en la planificación
          </button>
        </>
      )}
    </div>
  )
}
