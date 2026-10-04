import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { db, setTenant, DEFAULT_TENANT } from '../lib/db'
import { PRINCIPAL, cssTema } from '../lib/instituciones'

/* Institución activa (multi-colegio).
   - Con sesión: la de la sesión del usuario.
   - Sin sesión: la del login visitado (/ = principal, /i/:slug = otra).
   Aplica su logo, nombre y paleta de colores a toda la app.           */

const InstCtx = createContext()

function slugInicial () {
  try { return JSON.parse(localStorage.getItem('session'))?.institucion || DEFAULT_TENANT }
  catch { return DEFAULT_TENANT }
}

export function InstitucionProvider ({ children }) {
  const [slug, setSlugState] = useState(() => {
    const s = slugInicial()
    setTenant(s) // antes del primer render de los hijos, que ya consultan datos
    return s
  })
  const [info, setInfo] = useState(PRINCIPAL)
  const [cargando, setCargando] = useState(true)
  const location = useLocation()

  function setSlug (s) {
    const nuevo = s || DEFAULT_TENANT
    setTenant(nuevo)
    setSlugState(nuevo)
  }

  useEffect(() => {
    let vivo = true
    setCargando(true)
    db.list('instituciones')
      .then(rows => {
        if (!vivo) return
        const found = rows.find(r => r.slug === slug)
        setInfo(found ? { ...PRINCIPAL, ...found, logo: found.logo || PRINCIPAL.logo } : slug === DEFAULT_TENANT ? PRINCIPAL : null)
      })
      .catch(() => vivo && setInfo(slug === DEFAULT_TENANT ? PRINCIPAL : null))
      .finally(() => vivo && setCargando(false))
    return () => { vivo = false }
  }, [slug])

  // El panel de Super Admin conserva siempre la paleta base.
  const enSuper = location.pathname.startsWith('/superadmin')
  const css = !enSuper && info ? cssTema(info) : ''

  useEffect(() => {
    if (!enSuper && info?.nombre) document.title = `${info.nombre} · Sistema de Gestión`
    else if (enSuper) document.title = 'Super Admin · Sistemas de Gestión'
  }, [info, enSuper])

  return (
    <InstCtx.Provider value={{ slug, setSlug, info, cargando }}>
      {css && <style>{css}</style>}
      {children}
    </InstCtx.Provider>
  )
}

export const useInstitucion = () => useContext(InstCtx)
