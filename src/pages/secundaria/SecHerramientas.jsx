import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { evaluar, formatear } from '../../lib/mathEval'
import { NotaNecesaria } from './SecNotas'

/* Herramientas de estudio: temporizador de enfoque, calculadora científica
   y "¿qué nota necesito?". */
export default function SecHerramientas () {
  return (
    <>
      <div className="sec-head">
        <div>
          <h1>Herramientas</h1>
          <p>Para estudiar con foco, resolver cálculos y planificar tus notas.</p>
        </div>
      </div>
      <div className="sec-grid-main" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}>
        <Temporizador />
        <CalculadoraCientifica />
      </div>
      <section className="sec-card sec-pad">
        <h3 style={{ fontSize: 16 }}>¿Qué nota necesito?</h3>
        <p className="sec-soft" style={{ fontSize: 13.5, marginTop: 4 }}>Calcula el promedio que te hace falta en las evaluaciones que quedan. En la sección Notas puedes hacerlo con tus notas reales de cada materia.</p>
        <NotaNecesaria editable />
      </section>
    </>
  )
}

/* ---------------- Temporizador de enfoque (técnica Pomodoro) ---------------- */
const MODOS = [
  { id: 'enfoque', label: 'Enfoque', min: 25 },
  { id: 'pausa', label: 'Pausa', min: 5 },
  { id: 'larga', label: 'Pausa larga', min: 15 },
]
const KEY_SESIONES = 'sec_sesiones_enfoque'
const hoyKey = () => new Date().toISOString().slice(0, 10)
function leerSesiones () {
  try { const s = JSON.parse(localStorage.getItem(KEY_SESIONES)); return s?.dia === hoyKey() ? s.n : 0 } catch { return 0 }
}
function guardarSesiones (n) {
  try { localStorage.setItem(KEY_SESIONES, JSON.stringify({ dia: hoyKey(), n })) } catch { /* sin almacenamiento */ }
}
function sonar () {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[0, 0.25, 0.5].forEach(t => {
      const o = ctx.createOscillator(); const g = ctx.createGain()
      o.frequency.value = 880; g.gain.setValueAtTime(0.15, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2)
    })
  } catch { /* sin audio */ }
}

function Temporizador () {
  const [modo, setModo] = useState(MODOS[0])
  const [minutos, setMinutos] = useState({ enfoque: 25, pausa: 5, larga: 15 })
  const [restante, setRestante] = useState(25 * 60)
  const [corriendo, setCorriendo] = useState(false)
  const [sesiones, setSesiones] = useState(leerSesiones)
  const [aviso, setAviso] = useState('')
  const fin = useRef(null)
  const total = minutos[modo.id] * 60

  useEffect(() => {
    if (!corriendo) return
    fin.current = Date.now() + restante * 1000
    const id = setInterval(() => {
      const r = Math.max(0, Math.round((fin.current - Date.now()) / 1000))
      setRestante(r)
      if (r === 0) {
        clearInterval(id); setCorriendo(false); sonar()
        if (modo.id === 'enfoque') {
          const n = sesiones + 1; setSesiones(n); guardarSesiones(n)
          setAviso('Sesión de enfoque terminada. Toma una pausa.')
        } else setAviso('Pausa terminada. ¿Otra sesión?')
      }
    }, 250)
    return () => clearInterval(id)
  }, [corriendo]) // eslint-disable-line react-hooks/exhaustive-deps

  const mm = String(Math.floor(restante / 60)).padStart(2, '0')
  const ss = String(restante % 60).padStart(2, '0')
  useEffect(() => {
    if (corriendo) document.title = `${mm}:${ss} · ${modo.label}`
    return () => { document.title = document.title.replace(/^\d\d:\d\d · [^·]+$/, 'Campus') }
  }, [mm, ss, corriendo, modo])

  function elegir (m) { setCorriendo(false); setModo(m); setRestante(minutos[m.id] * 60); setAviso('') }
  function reiniciar () { setCorriendo(false); setRestante(total); setAviso('') }
  function cambiarMin (v) {
    const n = Math.min(120, Math.max(1, Number(v) || 1))
    setMinutos(x => ({ ...x, [modo.id]: n }))
    if (!corriendo) setRestante(n * 60)
  }

  const R = 104; const C = 2 * Math.PI * R
  const avance = total ? 1 - restante / total : 0

  return (
    <section className="sec-card sec-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 16 }}>Temporizador de estudio</h3>
        <span className="sec-tag" data-tono="primary">{sesiones} {sesiones === 1 ? 'sesión' : 'sesiones'} hoy</span>
      </div>
      <div className="sec-seg" role="group" aria-label="Tipo de bloque" style={{ alignSelf: 'flex-start' }}>
        {MODOS.map(m => <button key={m.id} aria-pressed={modo.id === m.id} onClick={() => elegir(m)}>{m.label}</button>)}
      </div>
      <div className="sec-ring">
        <svg viewBox="0 0 230 230" aria-hidden="true">
          <circle cx="115" cy="115" r={R} fill="none" stroke="var(--sec-border)" strokeWidth="8" />
          <circle cx="115" cy="115" r={R} fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - avance)} style={{ transition: 'stroke-dashoffset .25s linear' }} />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <div className="sec-timer" role="timer" aria-label={`${mm} minutos ${ss} segundos`}>{mm}:{ss}</div>
          <div className="sec-faint" style={{ fontSize: 13, marginTop: 6 }}>{modo.label}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn btn-primary" style={{ minWidth: 130, justifyContent: 'center' }} onClick={() => { setAviso(''); if (restante === 0) setRestante(total); setCorriendo(c => !c) }}>
          {corriendo ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> {restante < total && restante > 0 ? 'Continuar' : 'Empezar'}</>}
        </button>
        <button className="btn btn-ghost" onClick={reiniciar} aria-label="Reiniciar"><RotateCcw size={16} /></button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontSize: 13 }} className="sec-soft">
        <label htmlFor="min-bloque">Duración del bloque</label>
        <input id="min-bloque" className="input" type="number" min="1" max="120" value={minutos[modo.id]} onChange={e => cambiarMin(e.target.value)} style={{ width: 72, padding: '6px 8px' }} disabled={corriendo} />
        min
      </div>
      <div aria-live="polite" style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, minHeight: 20, color: 'var(--primary)' }}>{aviso}</div>
    </section>
  )
}

/* ---------------- Calculadora científica ---------------- */
const TECLAS = [
  [['sen(', 'fn', 'sen'], ['cos(', 'fn', 'cos'], ['tan(', 'fn', 'tan'], ['raiz(', 'fn', '√'], ['^', 'op', 'xʸ']],
  [['log(', 'fn', 'log'], ['ln(', 'fn', 'ln'], ['pi', 'fn', 'π'], ['(', 'op', '('], [')', 'op', ')']],
  [['7'], ['8'], ['9'], ['/', 'op', '÷'], ['DEL', 'fn', '⌫']],
  [['4'], ['5'], ['6'], ['*', 'op', '×'], ['C', 'fn', 'C']],
  [['1'], ['2'], ['3'], ['-', 'op', '−'], ['%', 'op', '%']],
  [['0'], ['.'], ['ANS', 'fn', 'ans'], ['+', 'op', '+'], ['=', 'eq', '=']],
]

function CalculadoraCientifica () {
  const [expr, setExpr] = useState('')
  const [hist, setHist] = useState([])
  const res = expr.trim() ? evaluar(expr) : null
  const vista = res?.ok ? formatear(res.valor) : null

  function tecla (t) {
    if (t === 'C') return setExpr('')
    if (t === 'DEL') return setExpr(x => x.slice(0, -1))
    if (t === 'ANS') return hist[0] && setExpr(x => x + hist[0].r)
    if (t === '=') return calcular()
    setExpr(x => x + t)
  }
  function calcular () {
    if (!res?.ok) return
    setHist(h => [{ e: expr, r: formatear(res.valor) }, ...h].slice(0, 5))
    setExpr(formatear(res.valor))
  }

  return (
    <section className="sec-card sec-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: 16 }}>Calculadora científica</h3>
      <div style={{ background: 'var(--sec-surface-2)', border: '1px solid var(--sec-border)', borderRadius: 'var(--sec-radius-sm)', padding: 12 }}>
        <input className="input num" value={expr} onChange={e => setExpr(e.target.value)} onKeyDown={e => e.key === 'Enter' && calcular()}
          placeholder="Ej: raiz(144) + sen(30)" aria-label="Expresión" spellCheck={false}
          style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 17, boxShadow: 'none' }} />
        <div className="num" aria-live="polite" style={{ textAlign: 'right', fontSize: 26, fontWeight: 700, minHeight: 32, marginTop: 6, color: res && !res.ok ? 'var(--sec-faint)' : undefined }}>
          {vista != null ? `= ${vista}` : res && !res.ok ? <span style={{ fontSize: 13, fontWeight: 500 }}>Expresión incompleta</span> : ''}
        </div>
      </div>
      <div className="sec-calc-keys">
        {TECLAS.flat().map(([t, k, l]) => (
          <button key={t + (l || '')} type="button" data-k={k} onClick={() => tecla(t)} aria-label={l || t}>{l || t}</button>
        ))}
      </div>
      <div className="sec-faint" style={{ fontSize: 12 }}>Ángulos en grados.</div>
      {hist.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
          {hist.map((h, i) => (
            <button key={i} type="button" className="num" onClick={() => setExpr(h.e)} style={{ textAlign: 'right', color: 'var(--sec-soft)' }}>
              {h.e} = <b style={{ color: 'var(--sec-text)' }}>{h.r}</b>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
