/* ============================================================
   Referencias bíblicas — canon católico (73 libros).
   Incluye los deuterocanónicos (Tobías, Judit, Sabiduría, Eclesiástico,
   Baruc, 1-2 Macabeos) que no están en las biblias protestantes.

   Sirve para que el sistema entienda una cita escrita a mano
   ("Mt 5,9" o "1 Co 13,4-7") y la muestre completa: "Mateo 5, 9".
   Si no reconoce el libro, avisa en vez de guardar algo inválido.
============================================================ */

/* Cada entrada: clave normalizada -> nombre completo.
   Se aceptan varias abreviaturas por libro (las de uso común en español). */
const LIBROS = {
  // ---- Antiguo Testamento ----
  gn: 'Génesis', gen: 'Génesis', genesis: 'Génesis',
  ex: 'Éxodo', exodo: 'Éxodo',
  lv: 'Levítico', lev: 'Levítico', levitico: 'Levítico',
  nm: 'Números', num: 'Números', numeros: 'Números',
  dt: 'Deuteronomio', deut: 'Deuteronomio', deuteronomio: 'Deuteronomio',
  jos: 'Josué', josue: 'Josué',
  jc: 'Jueces', jue: 'Jueces', jueces: 'Jueces',
  rt: 'Rut', rut: 'Rut',
  '1s': '1 Samuel', '1sam': '1 Samuel', '2s': '2 Samuel', '2sam': '2 Samuel',
  '1r': '1 Reyes', '1re': '1 Reyes', '2r': '2 Reyes', '2re': '2 Reyes',
  '1cr': '1 Crónicas', '2cr': '2 Crónicas',
  esd: 'Esdras', ne: 'Nehemías', neh: 'Nehemías',
  tb: 'Tobías', tob: 'Tobías', tobias: 'Tobías',
  jdt: 'Judit', judit: 'Judit',
  est: 'Ester', ester: 'Ester',
  '1m': '1 Macabeos', '1mac': '1 Macabeos', '2m': '2 Macabeos', '2mac': '2 Macabeos',
  jb: 'Job', job: 'Job',
  sal: 'Salmos', salmo: 'Salmos', salmos: 'Salmos', sl: 'Salmos',
  pr: 'Proverbios', prov: 'Proverbios', proverbios: 'Proverbios',
  qo: 'Eclesiastés', ecl: 'Eclesiastés', eclesiastes: 'Eclesiastés',
  ct: 'Cantar de los Cantares', cant: 'Cantar de los Cantares',
  sb: 'Sabiduría', sab: 'Sabiduría', sabiduria: 'Sabiduría',
  si: 'Eclesiástico', eclo: 'Eclesiástico', sir: 'Eclesiástico',
  is: 'Isaías', isaias: 'Isaías',
  jr: 'Jeremías', jer: 'Jeremías', jeremias: 'Jeremías',
  lm: 'Lamentaciones', lam: 'Lamentaciones',
  ba: 'Baruc', bar: 'Baruc', baruc: 'Baruc',
  ez: 'Ezequiel', ezequiel: 'Ezequiel',
  dn: 'Daniel', dan: 'Daniel', daniel: 'Daniel',
  os: 'Oseas', oseas: 'Oseas',
  jl: 'Joel', joel: 'Joel',
  am: 'Amós', amos: 'Amós',
  ab: 'Abdías', abd: 'Abdías',
  jon: 'Jonás', jonas: 'Jonás',
  mi: 'Miqueas', miq: 'Miqueas',
  na: 'Nahúm', nah: 'Nahúm',
  ha: 'Habacuc', hab: 'Habacuc',
  so: 'Sofonías', sof: 'Sofonías',
  ag: 'Ageo', ageo: 'Ageo',
  za: 'Zacarías', zac: 'Zacarías',
  ml: 'Malaquías', mal: 'Malaquías',

  // ---- Nuevo Testamento ----
  mt: 'Mateo', mat: 'Mateo', mateo: 'Mateo',
  mc: 'Marcos', mar: 'Marcos', marcos: 'Marcos',
  lc: 'Lucas', luc: 'Lucas', lucas: 'Lucas',
  jn: 'Juan', juan: 'Juan',
  hch: 'Hechos', hechos: 'Hechos', hec: 'Hechos',
  rm: 'Romanos', rom: 'Romanos', romanos: 'Romanos',
  '1co': '1 Corintios', '1cor': '1 Corintios', '2co': '2 Corintios', '2cor': '2 Corintios',
  ga: 'Gálatas', gal: 'Gálatas',
  ef: 'Efesios', efesios: 'Efesios',
  flp: 'Filipenses', fil: 'Filipenses',
  col: 'Colosenses', colosenses: 'Colosenses',
  '1ts': '1 Tesalonicenses', '2ts': '2 Tesalonicenses',
  '1tm': '1 Timoteo', '1tim': '1 Timoteo', '2tm': '2 Timoteo', '2tim': '2 Timoteo',
  tt: 'Tito', tito: 'Tito',
  flm: 'Filemón',
  hb: 'Hebreos', heb: 'Hebreos', hebreos: 'Hebreos',
  st: 'Santiago', sant: 'Santiago', santiago: 'Santiago',
  '1p': '1 Pedro', '1pe': '1 Pedro', '2p': '2 Pedro', '2pe': '2 Pedro',
  '1jn': '1 Juan', '2jn': '2 Juan', '3jn': '3 Juan',
  jds: 'Judas', jud: 'Judas',
  ap: 'Apocalipsis', apoc: 'Apocalipsis', apocalipsis: 'Apocalipsis',
}

/** Normaliza para comparar: sin tildes, sin puntos ni espacios, en minúscula. */
function clave (txt) {
  return (txt || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[.\s]/g, '')
}

/* ============================================================
   Interpreta una cita: "Mt 5,9", "1 Co 13,4-7", "Jn 3:16".
   Devuelve { ok:true, bonito } o { ok:false, error }.
============================================================ */
export function parsearCita (texto) {
  const t = (texto || '').trim()
  if (!t) return null

  // libro (con posible número delante) + capítulo + versículos
  const m = t.match(/^([1-3]?\s*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.]+)\s*(\d+)\s*[,:]\s*([\d\s,.\-–]+)$/)
  if (!m) return { ok: false, error: 'Formato: Libro capítulo,versículo (ej: Mt 5,9)' }

  const libro = LIBROS[clave(m[1])]
  if (!libro) return { ok: false, error: `No reconozco el libro "${m[1].trim()}"` }

  const capitulo = m[2]
  const versiculos = m[3].trim().replace(/\s+/g, '').replace(/–/g, '-')

  return { ok: true, libro, capitulo, versiculos, bonito: `${libro} ${capitulo}, ${versiculos}` }
}

/** Chip para el editor de fichas: verde si la cita es válida, aviso si no. */
export function validarCita (texto) {
  const r = parsearCita(texto)
  if (!r) return null
  return r.ok
    ? { tono: 'ok', texto: r.bonito }
    : { tono: 'aviso', texto: r.error }
}
