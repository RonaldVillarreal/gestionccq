/* ============================================================
   Evaluador de expresiones matemáticas.
   Escrito a mano (tokenizador + descenso recursivo) en vez de usar
   eval(), que ejecutaría código arbitrario escrito por el usuario.

   Soporta:  + - * / % ^  paréntesis, decimales, multiplicación
   implícita (2(3+4)), funciones y constantes.
   Las funciones trigonométricas trabajan en GRADOS (más intuitivo
   para primaria/secundaria que radianes).
============================================================ */

const gradosARad = (g) => (g * Math.PI) / 180

const FUNCIONES = {
  raiz: Math.sqrt, sqrt: Math.sqrt,
  abs: Math.abs,
  redondear: Math.round, round: Math.round,
  piso: Math.floor, floor: Math.floor,
  techo: Math.ceil, ceil: Math.ceil,
  ln: Math.log,
  log: (x) => Math.log10(x),
  sen: (x) => Math.sin(gradosARad(x)), sin: (x) => Math.sin(gradosARad(x)),
  cos: (x) => Math.cos(gradosARad(x)),
  tan: (x) => Math.tan(gradosARad(x)),
}
const CONSTANTES = { pi: Math.PI, e: Math.E }

export const FUNCIONES_DISPONIBLES = ['raiz', 'abs', 'redondear', 'piso', 'techo', 'ln', 'log', 'sen', 'cos', 'tan']

/* ---------- Tokenizador ---------- */
function tokenizar (fuente) {
  // Normaliza símbolos que escriben los maestros (× ÷ − , ) a los del parser.
  const s = String(fuente)
    .replace(/×/g, '*').replace(/÷/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/(\d),(\d)/g, '$1.$2')   // coma decimal: 3,5 -> 3.5

  const tokens = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) { i++; continue }

    if (/[0-9.]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.]/.test(s[j])) j++
      const txt = s.slice(i, j)
      if ((txt.match(/\./g) || []).length > 1) throw new Error(`Número inválido: "${txt}"`)
      tokens.push({ t: 'num', v: parseFloat(txt) })
      i = j; continue
    }

    if (/[a-záéíóúñ]/i.test(c)) {
      let j = i
      while (j < s.length && /[a-záéíóúñ0-9]/i.test(s[j])) j++
      tokens.push({ t: 'id', v: s.slice(i, j).toLowerCase() })
      i = j; continue
    }

    if ('+-*/%^()'.includes(c)) { tokens.push({ t: c }); i++; continue }

    throw new Error(`Símbolo no permitido: "${c}"`)
  }
  return tokens
}

/* ---------- Parser (descenso recursivo) ----------
   expr   := term (('+' | '-') term)*
   term   := unary (('*' | '/' | '%') unary | unary_implícito)*
   unary  := ('+' | '-') unary | potencia
   potencia := primario ('^' unary)?          (asociativa por la derecha)
   primario := numero | constante | funcion '(' expr ')' | '(' expr ')'
------------------------------------------------------------ */
function crearParser (tokens) {
  let pos = 0
  const mirar = () => tokens[pos]
  const comer = (t) => {
    const tok = tokens[pos]
    if (!tok || tok.t !== t) throw new Error(`Se esperaba "${t}"`)
    pos++; return tok
  }

  function expr () {
    let v = term()
    while (mirar() && (mirar().t === '+' || mirar().t === '-')) {
      const op = tokens[pos++].t
      const d = term()
      v = op === '+' ? v + d : v - d
    }
    return v
  }

  function term () {
    let v = unary()
    while (mirar()) {
      const t = mirar().t
      if (t === '*' || t === '/' || t === '%') {
        pos++
        const d = unary()
        if ((t === '/' || t === '%') && d === 0) throw new Error('No se puede dividir entre cero')
        v = t === '*' ? v * d : t === '/' ? v / d : v % d
      } else if (t === 'num' || t === 'id' || t === '(') {
        // Multiplicación implícita: 2(3+4), 3pi, 2raiz(9)
        v = v * unary()
      } else break
    }
    return v
  }

  function unary () {
    const t = mirar()
    if (!t) throw new Error('Expresión incompleta')
    if (t.t === '-') { pos++; return -unary() }
    if (t.t === '+') { pos++; return unary() }
    return potencia()
  }

  function potencia () {
    const base = primario()
    if (mirar() && mirar().t === '^') { pos++; return Math.pow(base, unary()) }
    return base
  }

  function primario () {
    const t = mirar()
    if (!t) throw new Error('Expresión incompleta')

    if (t.t === 'num') { pos++; return t.v }

    if (t.t === '(') { pos++; const v = expr(); comer(')'); return v }

    if (t.t === 'id') {
      pos++
      const nombre = t.v
      if (mirar() && mirar().t === '(') {
        const fn = FUNCIONES[nombre]
        if (!fn) throw new Error(`Función desconocida: "${nombre}"`)
        pos++; const arg = expr(); comer(')')
        return fn(arg)
      }
      if (nombre in CONSTANTES) return CONSTANTES[nombre]
      throw new Error(`No reconozco "${nombre}"`)
    }

    throw new Error('Expresión inválida')
  }

  const valor = expr()
  if (pos < tokens.length) throw new Error('Sobra algo al final de la expresión')
  return valor
}

/* ---------- API pública ---------- */

/** Evalúa una expresión. Devuelve { ok:true, valor } o { ok:false, error }. */
export function evaluar (expresion) {
  const txt = String(expresion ?? '').trim()
  if (!txt) return { ok: false, error: 'Vacío' }
  try {
    const tokens = tokenizar(txt)
    if (!tokens.length) return { ok: false, error: 'Vacío' }
    const valor = crearParser(tokens)
    if (!Number.isFinite(valor)) return { ok: false, error: 'Resultado no válido' }
    return { ok: true, valor }
  } catch (e) {
    return { ok: false, error: e.message || 'Expresión inválida' }
  }
}

/** Formatea el resultado evitando basura de coma flotante (0.1+0.2). */
export function formatear (n) {
  const r = Math.round(n * 1e10) / 1e10
  return Number.isInteger(r) ? String(r) : String(r)
}

/* ============================================================
   Analiza un renglón del cuaderno.
   - Texto libre (no evaluable)      -> null
   - "2+3"                           -> { tipo:'resultado', resultado:'5' }
   - "2+3 = 5"                       -> { tipo:'correcto',  resultado:'5' }
   - "2+3 = 6"                       -> { tipo:'incorrecto', resultado:'5' }
   - "2+3 = "  (pendiente)           -> { tipo:'resultado', resultado:'5' }
============================================================ */
export function analizarRenglon (linea) {
  const txt = String(linea ?? '').trim()
  if (!txt) return null

  const partes = txt.split('=')
  if (partes.length > 2) return { tipo: 'error', mensaje: 'Usa un solo signo «=»' }

  const izq = evaluar(partes[0])
  if (!izq.ok) return null   // no es matemática: es texto libre del maestro

  const resultado = formatear(izq.valor)
  if (partes.length === 1) return { tipo: 'resultado', resultado }

  const derTxt = partes[1].trim()
  if (!derTxt) return { tipo: 'resultado', resultado }

  const der = evaluar(derTxt)
  if (!der.ok) return { tipo: 'error', mensaje: 'El lado derecho no es válido' }

  const iguales = Math.abs(izq.valor - der.valor) < 1e-9
  return iguales ? { tipo: 'correcto', resultado } : { tipo: 'incorrecto', resultado }
}
