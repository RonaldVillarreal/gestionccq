import { databases, DB_ID, hasAppwrite } from './appwriteClient'
import { ID, Query } from 'appwrite'
import { seed } from '../data/seed'

/* ============================================================
   Capa de datos unificada.
   - Sin credenciales  -> persiste en localStorage (modo demo/FE).
   - Con credenciales   -> usa las colecciones de Appwrite (mismos nombres).
   Cada "tabla" expone: list, insert, update, remove.
   Las colecciones de Appwrite deben llamarse igual que las claves de abajo
   (las crea automáticamente el script appwrite/setup.mjs).
============================================================ */

const TABLES = [
  'alumnos', 'maestros', 'representantes', 'personal',
  'materias', 'planificaciones', 'usuarios', 'items_alumno',
  'tareas', 'libros', 'entregas', 'facturas',
  'medallas', 'notificaciones', 'fichas', 'instituciones',
]

/* ---------- Multi-institución ----------
   Cada registro lleva `institucion_id` (el slug de su institución).
   La institución original (Colegio Cardenal Quintero) usa el slug 'ccq';
   sus registros antiguos no tienen el campo y se consideran suyos.
   `instituciones` es global: solo la usa el panel de Super Admin.          */
export const DEFAULT_TENANT = 'ccq'
const GLOBAL = new Set(['instituciones'])
let tenant = DEFAULT_TENANT
export function setTenant (slug) { tenant = slug || DEFAULT_TENANT }
export function getTenant () { return tenant }
const TENANT_TABLES = TABLES.filter(t => !GLOBAL.has(t))
const esDelTenant = (r, t = tenant) => (r.institucion_id || DEFAULT_TENANT) === t

const LS_KEY = 'colegio_db_v1'

function loadLocal () {
  const raw = localStorage.getItem(LS_KEY)
  if (raw) return JSON.parse(raw)
  localStorage.setItem(LS_KEY, JSON.stringify(seed))
  return structuredClone(seed)
}
function saveLocal (db) { localStorage.setItem(LS_KEY, JSON.stringify(db)) }

const uid = () => crypto.randomUUID()

/* ---------- Backend local ---------- */
const local = {
  async list (table, scoped = true) {
    const db = loadLocal()
    const rows = db[table] || []
    return scoped ? rows.filter(r => esDelTenant(r)) : rows
  },
  async insert (table, row) {
    const db = loadLocal()
    const record = { id: uid(), created_at: new Date().toISOString(), ...row }
    db[table] = [...(db[table] || []), record]
    saveLocal(db)
    return record
  },
  async update (table, id, patch) {
    const db = loadLocal()
    db[table] = (db[table] || []).map(r => r.id === id ? { ...r, ...patch } : r)
    saveLocal(db)
    return db[table].find(r => r.id === id)
  },
  async remove (table, id) {
    const db = loadLocal()
    db[table] = (db[table] || []).filter(r => r.id !== id)
    saveLocal(db)
  },
  async purgeTenant (slug) {
    const db = loadLocal()
    for (const t of TENANT_TABLES) db[t] = (db[t] || []).filter(r => !esDelTenant(r, slug))
    saveLocal(db)
  },
}

/* ---------- Backend Appwrite ----------
   Appwrite usa $id / $createdAt en cada documento. Aquí los traducimos a
   id / created_at para que el resto de la app no cambie. Al escribir,
   quitamos esos campos (y cualquier $*) porque Appwrite rechaza atributos
   que no estén definidos en la colección.                                   */
function fromDoc (d) {
  const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...rest } = d
  return { id: $id, created_at: $createdAt, ...rest }
}
function toDoc (row) {
  const clean = {}
  for (const [k, v] of Object.entries(row)) {
    if (k === 'id' || k === 'created_at' || k.startsWith('$')) continue
    clean[k] = v
  }
  return clean
}

/* Filtro por institución. La principal también incluye los documentos
   antiguos sin `institucion_id`. */
function tenantQuery (t) {
  if (t !== DEFAULT_TENANT) return [Query.equal('institucion_id', t)]
  return [Query.or([Query.equal('institucion_id', t), Query.isNull('institucion_id')])]
}
// Si la colección aún no tiene el atributo (falta correr setup:appwrite),
// la institución principal sigue funcionando como antes.
const sinAtributo = (e) => /attribute/i.test(e?.message || '') && tenant === DEFAULT_TENANT

const remote = {
  async list (table, scoped = true) {
    const base = [Query.orderDesc('$createdAt'), Query.limit(100)]
    try {
      const res = await databases.listDocuments(DB_ID, table, scoped ? [...tenantQuery(tenant), ...base] : base)
      return res.documents.map(fromDoc)
    } catch (e) {
      if (!scoped || !sinAtributo(e)) throw e
      const res = await databases.listDocuments(DB_ID, table, base)
      return res.documents.map(fromDoc)
    }
  },
  async insert (table, row) {
    try {
      const doc = await databases.createDocument(DB_ID, table, ID.unique(), toDoc(row))
      return fromDoc(doc)
    } catch (e) {
      if (!row.institucion_id || !sinAtributo(e)) throw e
      const { institucion_id, ...rest } = row
      return fromDoc(await databases.createDocument(DB_ID, table, ID.unique(), toDoc(rest)))
    }
  },
  async update (table, id, patch) {
    const doc = await databases.updateDocument(DB_ID, table, id, toDoc(patch))
    return fromDoc(doc)
  },
  async remove (table, id) {
    await databases.deleteDocument(DB_ID, table, id)
  },
  async purgeTenant (slug) {
    for (const t of TENANT_TABLES) {
      // Borra en tandas de 100 hasta vaciar la colección para esa institución.
      for (;;) {
        const res = await databases.listDocuments(DB_ID, t, [...tenantQuery(slug), Query.limit(100)])
        if (!res.documents.length) break
        for (const d of res.documents) await databases.deleteDocument(DB_ID, t, d.$id)
      }
    }
  },
}

const backend = hasAppwrite ? remote : local

export const db = {
  tables: TABLES,
  isRemote: hasAppwrite,
  list: (t) => backend.list(t, !GLOBAL.has(t)),
  insert: (t, row) => backend.insert(t, GLOBAL.has(t) ? row : { institucion_id: tenant, ...row }),
  update: (t, id, patch) => backend.update(t, id, patch),
  remove: (t, id) => backend.remove(t, id),
  /* Borra todos los datos de una institución (no toca `instituciones`). */
  purgeTenant: (slug) => backend.purgeTenant(slug),
  resetLocal: () => { localStorage.removeItem(LS_KEY); loadLocal() },
}
