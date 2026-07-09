import { useEffect, useState } from 'react'
import { X, CornerDownLeft, Delete } from 'lucide-react'
import { evaluar, formatear } from '../lib/mathEval'

/* Calculadora flotante. Usa el mismo evaluador que el cuaderno,
   así el resultado que ve el maestro es idéntico al que se guarda. */

const TECLAS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['0', '.', '(', ')'],
]

export default function Calculadora ({ onInsertar, onClose }) {
  const [expr, setExpr] = useState('')
  const res = evaluar(expr)
  const resultado = res.ok ? formatear(res.valor) : null

  // Permite escribir con el teclado físico y cerrar con Escape.
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'Enter' && resultado != null) insertar()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const push = (t) => setExpr(x => x + t)

  function insertar () {
    if (resultado == null) return
    onInsertar(`${expr.trim()} = ${resultado}`)
    setExpr('')
  }

  return (
    <div className="calc">
      <div className="calc-head">
        <strong style={{ fontSize: 14 }}>🧮 Calculadora</strong>
        <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>
      </div>

      <div className="calc-display">
        <input className="calc-expr" value={expr} onChange={e => setExpr(e.target.value)}
          placeholder="0" spellCheck={false} autoFocus />
        <div className={`calc-res ${res.ok ? '' : 'calc-res-err'}`}>
          {expr.trim() === '' ? '' : res.ok ? `= ${resultado}` : res.error}
        </div>
      </div>

      <div className="calc-teclas">
        {TECLAS.flat().map(t => (
          <button key={t} className="calc-tecla" onClick={() => push(t)}>{t}</button>
        ))}
        <button className="calc-tecla" onClick={() => push('+')}>+</button>
        <button className="calc-tecla" onClick={() => push('^')}>x^</button>
        <button className="calc-tecla" onClick={() => push('raiz(')}>√(</button>
        <button className="calc-tecla calc-borrar" onClick={() => setExpr(x => x.slice(0, -1))} title="Borrar">
          <Delete size={15} />
        </button>
        <button className="calc-tecla calc-borrar" onClick={() => setExpr('')}>C</button>
      </div>

      <button className="btn btn-primary btn-sm" style={{ justifyContent: 'center', width: '100%' }}
        onClick={insertar} disabled={resultado == null}>
        <CornerDownLeft size={14} /> Insertar en el cuaderno
      </button>
    </div>
  )
}
