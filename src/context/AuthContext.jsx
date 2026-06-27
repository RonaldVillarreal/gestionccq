import { createContext, useContext, useEffect, useState } from 'react'
import { db } from '../lib/db'

/* Auth simple por usuario/clave contra la tabla `usuarios`.
   Roles: admin, maestro, aprobador.
   NOTA producción: en Supabase conviene mover el login a Supabase Auth
   y validar la clave del lado servidor. Aquí se valida contra la tabla
   para mantener una fase FE funcional sin backend de auth.            */

const AuthCtx = createContext()

export function AuthProvider ({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('session')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (user) localStorage.setItem('session', JSON.stringify(user))
    else localStorage.removeItem('session')
  }, [user])

  async function login (usuario, pass) {
    const usuarios = await db.list('usuarios')
    const found = usuarios.find(
      u => u.usuario?.toLowerCase() === usuario.trim().toLowerCase() && u.pass === pass
    )
    if (!found) return { ok: false, error: 'Usuario o clave incorrectos' }
    const safe = { id: found.id, nombre: found.nombre, usuario: found.usuario, rol: found.rol }
    setUser(safe)
    return { ok: true, user: safe }
  }

  const logout = () => setUser(null)

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
