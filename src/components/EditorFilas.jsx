import { Trash2 } from 'lucide-react'

/* ============================================================
   Tabla de fichas configurable. Las columnas las define la materia
   en el registro (materiasEspeciales.js), así Geografía, Historia
   y Religión comparten este componente cambiando solo su config.

   Solo dibuja la tabla: el contenedor decide dónde va y cómo se guarda.
============================================================ */
export default function EditorFilas ({ columnas, marcador, filas, onChange }) {
  const nCols = columnas.length

  // Fila fantasma al final: siempre hay dónde escribir, y al teclear se crea.
  const visibles = [...filas, Array(nCols).fill('')]

  function setCelda (i, j, texto) {
    const copia = visibles.map(f => [...f])
    copia[i][j] = texto
    // Descarta filas totalmente vacías salvo la fantasma.
    onChange(copia.filter((f, k) => k < copia.length - 1 || f.some(c => c.trim())))
  }

  const grid = columnas.map(c => c.ancho || '1fr').join(' ') + ' 36px'

  return (
    <div className="filas-tabla">
      <div className="filas-fila filas-head" style={{ gridTemplateColumns: grid }}>
        {columnas.map(c => <span key={c.key}>{c.label}</span>)}
        <span />
      </div>

      {visibles.map((fila, i) => {
        const esFantasma = i === visibles.length - 1
        return (
          <div key={i} className="filas-fila" style={{ gridTemplateColumns: grid }}>
            {columnas.map((c, j) => {
              // Una columna puede validar lo que se escribe (ej: una cita bíblica)
              // y mostrar el resultado interpretado debajo.
              const chip = c.validar ? c.validar(fila[j]) : null
              return (
                <div key={c.key} className="filas-celda">
                  <input className="filas-input"
                    value={fila[j] ?? ''} onChange={e => setCelda(i, j, e.target.value)}
                    placeholder={esFantasma ? c.placeholder : ''}
                    spellCheck={false} autoComplete="off" />
                  {chip && <span className={`filas-chip chip-${chip.tono}`}>{chip.texto}</span>}
                </div>
              )
            })}
            {esFantasma
              ? <span className="filas-marca" title="Escribe para agregar una ficha">{marcador}</span>
              : <button className="filas-borrar" type="button" title="Borrar ficha" tabIndex={-1}
                  onClick={() => onChange(filas.filter((_, k) => k !== i))}>
                  <Trash2 size={14} />
                </button>}
          </div>
        )
      })}
    </div>
  )
}
