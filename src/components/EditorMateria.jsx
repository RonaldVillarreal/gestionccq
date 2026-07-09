import { useState } from 'react'
import { Map, Table2, Trash2, ExternalLink, ArrowDownNarrowWide } from 'lucide-react'
import EditorFilas from './EditorFilas'
import MapaBuscador from './MapaBuscador'
import {
  parsearContenido, serializarContenido, urlMapaEmbed, urlMapaGrande,
  ordenarCronologico, MARCA_FICHA,
} from '../lib/contenidoMateria'

/* ============================================================
   Editor de una materia con herramientas OPCIONALES.

   Lo principal siempre son las notas de la clase. Las fichas y los
   mapas se activan solo si la maestra los necesita para ese tema
   — no toda clase de Geografía va de capitales, ni toda clase de
   Historia tiene fechas.

   Qué herramientas ofrece cada materia lo decide el registro
   (materiasEspeciales.js).
============================================================ */
export default function EditorMateria ({ tipo, value, onChange }) {
  const conf = tipo.fichas
  const marca = conf?.marca || MARCA_FICHA
  const nCols = conf?.columnas.length || 0

  const { fichas, mapas, notas } = parsearContenido(value, nCols, marca)

  // Las fichas se muestran si ya hay alguna, o si la maestra las enciende.
  const [verFichas, setVerFichas] = useState(fichas.length > 0)
  const [buscarMapa, setBuscarMapa] = useState(false)

  const emitir = (cambios) =>
    onChange(serializarContenido({ fichas, mapas, notas, ...cambios }, marca))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Notas: lo principal, siempre presente */}
      <textarea className="textarea" style={{ minHeight: 150 }} value={notas}
        onChange={e => emitir({ notas: e.target.value })}
        placeholder="Describe objetivos, actividades, recursos, evaluación…" />

      {/* Barra de herramientas de la materia */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {conf && (
          <button type="button" onClick={() => setVerFichas(v => !v)}
            className={`btn btn-sm ${verFichas ? 'btn-primary' : 'btn-ghost'}`}>
            <Table2 size={14} /> {conf.label}
          </button>
        )}
        {tipo.mapa && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBuscarMapa(true)}>
            <Map size={14} /> Insertar mapa
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          Herramientas opcionales · úsalas solo si el tema las pide
        </span>
      </div>

      {/* Fichas / línea de tiempo (opcional) */}
      {conf && verFichas && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <EditorFilas
            columnas={conf.columnas} marcador={marca} filas={fichas}
            onChange={(f) => emitir({ fichas: f })}
          />

          {conf.ordenar && fichas.length > 1 && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}
              onClick={() => emitir({ fichas: ordenarCronologico(fichas) })}>
              <ArrowDownNarrowWide size={14} /> Ordenar cronológicamente
            </button>
          )}

          {conf.ordenar && fichas.length > 1 && <LineaTiempo filas={fichas} />}

          {fichas.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              {conf.ayuda} Si no la usas, apágala y no se guardará nada.
            </span>
          )}
        </div>
      )}

      {/* Mapas insertados */}
      {mapas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 12 }}>
          {mapas.map((m, i) => (
            <div key={i} className="mapa-card">
              <iframe title={`Mapa de ${m.nombre}`} src={urlMapaEmbed(m)} loading="lazy" />
              <div className="mapa-card-pie">
                <span style={{ fontWeight: 600, fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  🗺️ {m.nombre}
                </span>
                <a className="btn btn-ghost btn-sm" href={urlMapaGrande(m)} target="_blank" rel="noreferrer" title="Ver más grande">
                  <ExternalLink size={13} />
                </a>
                <button className="btn btn-ghost btn-sm" type="button" title="Quitar mapa"
                  onClick={() => emitir({ mapas: mapas.filter((_, k) => k !== i) })}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {buscarMapa && (
        <MapaBuscador onClose={() => setBuscarMapa(false)}
          onInsertar={(m) => emitir({ mapas: [...mapas, m] })} />
      )}
    </div>
  )
}

/* Vista previa: cómo se verá la línea de tiempo, siempre en orden,
   sin reordenar la tabla mientras la maestra escribe. */
function LineaTiempo ({ filas }) {
  const orden = ordenarCronologico(filas).filter(f => f[0]?.trim() || f[1]?.trim())
  if (!orden.length) return null

  return (
    <div className="linea-tiempo">
      <div className="linea-tiempo-titulo">Vista previa · orden cronológico</div>
      {orden.map((f, i) => (
        <div key={i} className="lt-item">
          <span className="lt-punto" />
          <span className="lt-fecha">{f[0] || '—'}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{f[1]}</div>
            {f[2] && <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{f[2]}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
