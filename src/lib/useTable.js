import { useCallback, useEffect, useState } from 'react'
import { db } from '../lib/db'

/* `filtro` opcional: [campo, valor] → solo trae esos registros
   (con valor vacío no consulta nada todavía). */
export function useTable (table, filtro) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [campo, valor] = filtro || []

  const refresh = useCallback(async () => {
    if (campo && !valor) { setRows([]); setLoading(false); return }
    setLoading(true)
    try { setRows(await (campo ? db.listWhere(table, campo, valor) : db.list(table))) }
    finally { setLoading(false) }
  }, [table, campo, valor])

  useEffect(() => { refresh() }, [refresh])

  return {
    rows, loading, refresh,
    insert: async (row) => { const r = await db.insert(table, row); await refresh(); return r },
    update: async (id, patch) => { const r = await db.update(table, id, patch); await refresh(); return r },
    remove: async (id) => { await db.remove(table, id); await refresh() },
  }
}
