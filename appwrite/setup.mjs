/* ============================================================
   Colegio San Andrés — Provisión automática de Appwrite
   ------------------------------------------------------------
   Crea la base de datos, las 7 colecciones con sus atributos e
   índices, y los 3 usuarios de prueba. Equivalente a supabase/schema.sql.

   Uso:
     1. Completa .env (ver .env.example), incluida APPWRITE_API_KEY.
     2. npm run setup:appwrite

   Idempotente: si algo ya existe, lo salta y continúa.
============================================================ */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { Client, Databases, Permission, Role, ID } from 'node-appwrite'

/* ---- Cargar variables desde .env (sin dependencias extra) ---- */
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
function loadEnv () {
  const env = { ...process.env }
  try {
    const raw = readFileSync(join(root, '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (m && !m[1].startsWith('#')) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
    }
  } catch { /* sin .env: usa process.env */ }
  return env
}
const env = loadEnv()

const ENDPOINT = env.VITE_APPWRITE_ENDPOINT
const PROJECT  = env.VITE_APPWRITE_PROJECT_ID
const DB_ID    = env.VITE_APPWRITE_DB_ID || 'colegio'
const API_KEY  = env.APPWRITE_API_KEY

if (!ENDPOINT || !PROJECT || !API_KEY) {
  console.error('\n✖ Faltan variables. Necesito en .env:')
  console.error('   VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, APPWRITE_API_KEY')
  console.error('   (VITE_APPWRITE_DB_ID es opcional; por defecto "colegio")\n')
  process.exit(1)
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY)
const databases = new Databases(client)

/* Permisos a nivel de colección: cualquiera con el proyecto puede CRUD.
   Replica el modelo "anon key" que tenías en Supabase.
   ⚠ Antes de producción, restringe por rol (ver nota al final).            */
const ANY = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
]

/* Helper: ignora el error "ya existe" (409) y sigue. */
const ok = async (label, fn) => {
  try { await fn(); console.log('  ✓', label) }
  catch (e) {
    if (e?.code === 409) console.log('  •', label, '(ya existía)')
    else { console.error('  ✖', label, '→', e?.message || e); throw e }
  }
}

/* Definición de colecciones.
   s = string, b = boolean, f = float. [size, required, default, array]      */
const SCHEMA = {
  usuarios: [
    ['nombre',  's', 255, false],
    ['usuario', 's', 255, false],
    ['pass',    's', 255, false],
    ['rol',     's', 32,  false],
    ['email',   's', 255, false],
  ],
  representantes: [
    ['nombre',     's', 255, false],
    ['apellido',   's', 255, false],
    ['cedula',     's', 64,  false],
    ['telefono',   's', 64,  false],
    ['email',      's', 255, false],
    ['parentesco', 's', 64,  false],
  ],
  alumnos: [
    ['nombre',           's', 255, false],
    ['apellido',         's', 255, false],
    ['cedula',           's', 64,  false],
    ['nivel',            's', 64,  false],
    ['grado',            's', 64,  false],
    ['seccion',          's', 32,  false],
    ['representante_id', 's', 64,  false],
    ['usuario_id',       's', 64,  false],  // vincula al usuario (login) del alumno
    ['moroso',           'b', false, false],
    ['monto_deuda',      'f', false, 0],
  ],
  maestros: [
    ['nombre',     's', 255, false],
    ['apellido',   's', 255, false],
    ['cedula',     's', 64,  false],
    ['telefono',   's', 64,  false],
    ['email',      's', 255, false],
    ['materia',    's', 128, false],
    ['nivel',      's', 64,  false],
    ['grado',      's', 64,  false],   // grado asignado por el admin (ej: 3er Grado)
    ['seccion',    's', 32,  false],
    ['usuario_id', 's', 64,  false],
  ],
  personal: [
    ['nombre',   's', 255, false],
    ['apellido', 's', 255, false],
    ['cargo',    's', 128, false],
    ['tipo',     's', 64,  false],
    ['telefono', 's', 64,  false],
    ['email',    's', 255, false],
  ],
  materias: [
    ['nombre',     's', 128, false],
    ['color',      's', 16,  false],
    ['maestro_id', 's', 64,  false],
  ],
  planificaciones: [
    ['materia_id',   's', 64,   false],
    ['maestro_id',   's', 64,   false],
    ['titulo',       's', 255,  false],
    ['fecha',        's', 32,   false],
    ['contenido',    's', 20000, false],
    ['color',        's', 16,   false],
    ['imagenes',     's', 1000000, false, undefined, true], // array de data-URLs base64
    ['aprobador_id', 's', 64,   false],
    ['status',       's', 32,   false],
    ['correcciones', 's', 5000, false],
  ],
  // Items que el maestro agrega a cada alumno: calificaciones, notas,
  // alergias, tareas, etc. Modelo flexible por categoría.
  items_alumno: [
    ['alumno_id', 's', 64,    false],
    ['categoria', 's', 32,    false],  // calificacion | nota | alergia | tarea | otro
    ['materia',   's', 128,   false],
    ['titulo',    's', 255,   false],
    ['valor',     's', 255,   false],  // ej: "18/20"
    ['detalle',   's', 5000,  false],
  ],
  // Tareas que la maestra asigna a todo el grado/sección (las ve el alumno).
  tareas: [
    ['materia_id',    's', 64,   false],
    ['maestro_id',    's', 64,   false],
    ['grado',         's', 64,   false],
    ['seccion',       's', 32,   false],
    ['titulo',        's', 255,  false],
    ['descripcion',   's', 5000, false],
    ['fecha_entrega', 's', 32,   false],
    ['color',         's', 16,   false],
  ],
  // Libros/PDF por materia (se guardan por enlace URL).
  libros: [
    ['materia_id',  's', 64,   false],
    ['maestro_id',  's', 64,   false],
    ['grado',       's', 64,   false],
    ['seccion',     's', 32,   false],
    ['titulo',      's', 255,  false],
    ['autor',       's', 255,  false],
    ['descripcion', 's', 2000, false],
    ['url',         's', 2000, false],
    ['color',       's', 16,   false],
  ],
  // Tareas que el alumno marca como hechas (sincroniza su progreso y puntos).
  entregas: [
    ['alumno_id',  's', 64,   false],
    ['tarea_id',   's', 64,   false],
    ['status',     's', 32,   false],  // entregada
    ['comentario', 's', 2000, false],
    ['fecha',      's', 32,   false],
  ],
}

/* Índices recomendados (acelera los filtros del frontend). */
const INDEXES = {
  alumnos:         [['idx_representante', 'key', ['representante_id']]],
  materias:        [['idx_maestro', 'key', ['maestro_id']]],
  planificaciones: [
    ['idx_materia',   'key', ['materia_id']],
    ['idx_aprobador', 'key', ['aprobador_id']],
    ['idx_status',    'key', ['status']],
  ],
  usuarios:        [['idx_usuario', 'unique', ['usuario']]],
  items_alumno:    [['idx_alumno', 'key', ['alumno_id']]],
  tareas:          [['idx_grado', 'key', ['grado']], ['idx_maestro', 'key', ['maestro_id']]],
  libros:          [['idx_grado', 'key', ['grado']], ['idx_maestro', 'key', ['maestro_id']]],
  entregas:        [['idx_alumno', 'key', ['alumno_id']], ['idx_tarea', 'key', ['tarea_id']]],
}

async function createAttribute (col, def) {
  const [key, type, a, b, c, array] = def
  if (type === 's') return databases.createStringAttribute(DB_ID, col, key, a, b, c, array)
  if (type === 'b') return databases.createBooleanAttribute(DB_ID, col, key, a, b, array)
  if (type === 'f') return databases.createFloatAttribute(DB_ID, col, key, a, undefined, undefined, b, array)
}

/* Espera a que los atributos queden "available" antes de crear índices. */
async function waitAttributes (col) {
  for (let i = 0; i < 30; i++) {
    const { attributes } = await databases.listAttributes(DB_ID, col)
    if (attributes.length && attributes.every(at => at.status === 'available')) return
    await new Promise(r => setTimeout(r, 1000))
  }
}

async function main () {
  console.log(`\n→ Appwrite: ${ENDPOINT}  proyecto ${PROJECT}\n`)

  console.log('Base de datos:')
  let dbExists = false
  try { await databases.get(DB_ID); dbExists = true } catch { /* no existe */ }
  if (dbExists) console.log('  • database', `"${DB_ID}"`, '(ya existía)')
  else await ok(`database "${DB_ID}"`, () => databases.create(DB_ID, 'Colegio Cardenal Quintero'))

  for (const [col, attrs] of Object.entries(SCHEMA)) {
    console.log(`\nColección "${col}":`)
    await ok('colección', () => databases.createCollection(DB_ID, col, col, ANY))
    for (const def of attrs) await ok(`atributo ${def[0]}`, () => createAttribute(col, def))
  }

  console.log('\nEsperando a que los atributos estén listos…')
  for (const col of Object.keys(SCHEMA)) await waitAttributes(col)

  for (const [col, list] of Object.entries(INDEXES)) {
    console.log(`\nÍndices "${col}":`)
    for (const [key, type, fields] of list)
      await ok(`índice ${key}`, () => databases.createIndex(DB_ID, col, key, type, fields))
  }

  console.log('\nUsuarios de prueba:')
  const usuarios = [
    { nombre: 'Ronald',       usuario: 'Ronald',  pass: '10101987',   rol: 'admin' },
    { nombre: 'Ana Villarreal', usuario: 'anavillarreal', pass: 'maestro123', rol: 'maestro',   email: 'ana@colegio.edu' },
    { nombre: 'Carlos Rivas', usuario: 'crivas',  pass: 'aprobar123', rol: 'aprobador', email: 'carlos@colegio.edu' },
    { nombre: 'Sofía González', usuario: 'sofia', pass: 'alumno123', rol: 'alumno' },
  ]
  // Evita duplicados si vuelves a correr el script.
  let existentes = []
  try { existentes = (await databases.listDocuments(DB_ID, 'usuarios')).documents } catch {}
  for (const u of usuarios) {
    if (existentes.some(e => e.usuario === u.usuario)) { console.log('  •', u.usuario, '(ya existía)'); continue }
    await ok(u.usuario, () => databases.createDocument(DB_ID, 'usuarios', ID.unique(), u))
  }

  console.log('\n✔ Listo. Pon estas líneas en tu .env del frontend:')
  console.log(`   VITE_APPWRITE_ENDPOINT=${ENDPOINT}`)
  console.log(`   VITE_APPWRITE_PROJECT_ID=${PROJECT}`)
  console.log(`   VITE_APPWRITE_DB_ID=${DB_ID}`)
  console.log('\nLuego: npm run dev\n')
}

main().catch(() => process.exit(1))
