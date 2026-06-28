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
    let usuarios
    try {
      usuarios = await db.list('usuarios')
    } catch (e) {
      // En móvil esto suele pasar cuando el hostname no está autorizado como
      // "Platform" en Appwrite, o por falta de conexión. Mostramos el motivo real.
      return { ok: false, error: 'No se pudo conectar con el servidor. Verifica tu conexión y que el dominio esté autorizado en Appwrite. (' + (e?.message || e) + ')' }
    }
    // Comparación tolerante: ignora mayúsculas y espacios accidentales (autocompletado móvil).
    const u = usuario.trim().toLowerCase()
    const p = pass.trim()
    const found = usuarios.find(
      x => x.usuario?.trim().toLowerCase() === u && (x.pass ?? '').trim() === p
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
