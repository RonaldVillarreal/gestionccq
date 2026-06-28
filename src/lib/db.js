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
  'tareas', 'libros', 'entregas',
]

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
  async list (table) {
    const db = loadLocal()
    return db[table] || []
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

const remote = {
  async list (table) {
    const res = await databases.listDocuments(DB_ID, table, [
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ])
    return res.documents.map(fromDoc)
  },
  async insert (table, row) {
    const doc = await databases.createDocument(DB_ID, table, ID.unique(), toDoc(row))
    return fromDoc(doc)
  },
  async update (table, id, patch) {
    const doc = await databases.updateDocument(DB_ID, table, id, toDoc(patch))
    return fromDoc(doc)
  },
  async remove (table, id) {
    await databases.deleteDocument(DB_ID, table, id)
  },
}

const backend = hasAppwrite ? remote : local

export const db = {
  tables: TABLES,
  isRemote: hasAppwrite,
  list: (t) => backend.list(t),
  insert: (t, row) => backend.insert(t, row),
  update: (t, id, patch) => backend.update(t, id, patch),
  remove: (t, id) => backend.remove(t, id),
  resetLocal: () => { localStorage.removeItem(LS_KEY); loadLocal() },
}
