import { createContext, useContext, useEffect, useState } from 'react'
import { account } from '../lib/appwriteClient'

/* Sesión del Super Admin (dueño de la plataforma).
   Se valida con Appwrite Auth: la clave nunca está en el código.
   Solo entra una cuenta con la etiqueta (label) "superadmin", que se
   asigna en la consola de Appwrite → Auth → usuario → Labels.           */

export const LABEL = 'superadmin'
const SuperCtx = createContext()

export function SuperAdminProvider ({ children }) {
  const [activo, setActivo] = useState(false)
  const [cargando, setCargando] = useState(Boolean(account))

  useEffect(() => {
    if (!account) return
    account.get()
      .then(u => setActivo(u.labels?.includes(LABEL)))
      .catch(() => setActivo(false))
      .finally(() => setCargando(false))
  }, [])

  async function login (email, pass) {
    if (!account) return 'El panel de Super Admin necesita Appwrite configurado (.env).'
    try { await account.deleteSession('current') } catch { /* no había sesión */ }
    try {
      await account.createEmailPasswordSession(email.trim(), pass)
      const u = await account.get()
      if (!u.labels?.includes(LABEL)) {
        await account.deleteSession('current')
        return 'Esta cuenta no tiene acceso de Super Admin.'
      }
      setActivo(true)
      return null
    } catch (e) {
      return e?.code === 401 ? 'Correo o clave incorrectos' : (e?.message || 'No se pudo iniciar sesión.')
    }
  }

  async function logout () {
    try { await account?.deleteSession('current') } catch { /* ya cerrada */ }
    setActivo(false)
  }

  return <SuperCtx.Provider value={{ activo, cargando, login, logout }}>{children}</SuperCtx.Provider>
}

export const useSuperAdmin = () => useContext(SuperCtx)
