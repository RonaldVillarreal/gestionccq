import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Check, X, Equal, Info } from 'lucide-react'
import { analizarRenglon } from '../lib/mathEval'

/* ============================================================
   Cuaderno cuadriculado para planificaciones de Matemática.
   Cada renglón puede ser texto libre (objetivos, actividades) o una
   operación. Si es operación, se calcula en vivo; si el maestro
   escribe el resultado ("2+3 = 6") le avisamos si está mal.

   Se guarda como texto plano (una línea por renglón) en el mismo
   campo `contenido`, así el aprobador y el alumno lo leen sin cambios
   y no hace falta tocar el esquema de la base de datos.
============================================================ */
export default function CuadernoMatematico ({ value, onChange }) {
  const lineas = (value ?? '').split('\n')
  if (!lineas.length) lineas.push('')

  const refs = useRef([])
  const [focoPendiente, setFocoPendiente] = useState(null)

  useEffect(() => {
    if (focoPendiente != null) {
      refs.current[focoPendiente]?.focus()
      setFocoPendiente(null)
    }
  }, [focoPendiente])

  const escribir = (ls) => onChange(ls.join('\n'))

  function setLinea (i, texto) {
    const ls = [...lineas]; ls[i] = texto; escribir(ls)
  }
  function agregar (i) {
    const ls = [...lineas]; ls.splice(i + 1, 0, ''); escribir(ls); setFocoPendiente(i + 1)
  }
  function borrar (i) {
    if (lineas.length === 1) return escribir([''])
    escribir(lineas.filter((_, j) => j !== i))
    setFocoPendiente(Math.max(0, i - 1))
  }
  /* Completa el renglón con su resultado: "2+3" -> "2+3 = 5" */
  function completar (i, resultado) {
    const izq = lineas[i].split('=')[0].trim()
    setLinea(i, `${izq} = ${resultado}`)
  }

  function onKeyDown (e, i) {
    if (e.key === 'Enter') { e.preventDefault(); agregar(i) }
    else if (e.key === 'Backspace' && lineas[i] === '' && lineas.length > 1) { e.preventDefault(); borrar(i) }
    else if (e.key === 'ArrowDown' && refs.current[i + 1]) { e.preventDefault(); refs.current[i + 1].focus() }
    else if (e.key === 'ArrowUp' && refs.current[i - 1]) { e.preventDefault(); refs.current[i - 1].focus() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="cuaderno">
        <div className="cuaderno-margen" />
        {lineas.map((linea, i) => {
          const a = analizarRenglon(linea)
          return (
            <div key={i} className="cuaderno-fila">
              <span className="cuaderno-num">{i + 1}</span>
              <input
                ref={el => (refs.current[i] = el)}
                className="cuaderno-input"
                value={linea}
                onChange={e => setLinea(i, e.target.value)}
                onKeyDown={e => onKeyDown(e, i)}
                placeholder={i === 0 ? 'Escribe una operación (2+3) o una nota…' : ''}
                spellCheck={false}
                autoComplete="off"
              />
              <Resultado a={a} onCompletar={(r) => completar(i, r)} />
              <button className="cuaderno-borrar" onClick={() => borrar(i)} title="Borrar renglón" tabIndex={-1}>
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => agregar(lineas.length - 1)}>
          <Plus size={14} /> Agregar renglón
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={13} /> Enter = nuevo renglón · Se aceptan + − × ÷ ^ ( ), raiz(9), sen(30), pi
        </span>
      </div>
    </div>
  )
}

/* Muestra el resultado (o el error) del renglón, a la derecha. */
function Resultado ({ a, onCompletar }) {
  if (!a) return <span className="cuaderno-chip" />

  if (a.tipo === 'resultado') {
    return (
      <button className="cuaderno-chip chip-res" onClick={() => onCompletar(a.resultado)}
        title="Insertar el resultado en el renglón">
        <Equal size={12} /> {a.resultado}
      </button>
    )
  }
  if (a.tipo === 'correcto') {
    return <span className="cuaderno-chip chip-ok"><Check size={13} /> correcto</span>
  }
  if (a.tipo === 'incorrecto') {
    return (
      <button className="cuaderno-chip chip-mal" onClick={() => onCompletar(a.resultado)}
        title="Corregir con el resultado real">
        <X size={13} /> da {a.resultado}
      </button>
    )
  }
  return <span className="cuaderno-chip chip-err" title={a.mensaje}>{a.mensaje}</span>
}
