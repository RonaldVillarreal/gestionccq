import { useCallback, useEffect, useState } from 'react'
import { db } from '../lib/db'

export function useTable (table) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try { setRows(await db.list(table)) }
    finally { setLoading(false) }
  }, [table])

  useEffect(() => { refresh() }, [refresh])

  return {
    rows, loading, refresh,
    insert: async (row) => { const r = await db.insert(table, row); await refresh(); return r },
    update: async (id, patch) => { const r = await db.update(table, id, patch); await refresh(); return r },
    remove: async (id) => { await db.remove(table, id); await refresh() },
  }
}
