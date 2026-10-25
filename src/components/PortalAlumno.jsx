import { createContext, useContext } from 'react'
import { Navigate } from 'react-router-dom'
import AlumnoLayout from './AlumnoLayout'
import SecundariaLayout from './SecundariaLayout'
import { Loading } from './UI'
import { useAlumno } from '../lib/useAlumno'
import { useInstitucion } from '../context/InstitucionContext'

/* Entrada del portal del alumno: según el nivel de su ficha muestra el
   portal de primaria (gamificado) o el de secundaria (sobrio, con
   herramientas de estudio). Secundaria depende del módulo "portal_secundaria". */
const NivelCtx = createContext(false)
export const useEsSecundaria = () => useContext(NivelCtx)

export default function PortalAlumno () {
  const { esSecundaria, loading } = useAlumno()
  const { tieneModulo } = useInstitucion()
  // Evita mostrar el portal equivocado un instante mientras carga la ficha.
  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><Loading label="Cargando tu portal…" /></div>
  const sec = esSecundaria && tieneModulo('portal_secundaria')
  return (
    <NivelCtx.Provider value={sec}>
      {sec ? <SecundariaLayout /> : <AlumnoLayout />}
    </NivelCtx.Provider>
  )
}

/** Elige la página según el nivel. Si un nivel no tiene esa página, vuelve al inicio. */
export function SegunNivel ({ primaria, secundaria }) {
  const sec = useEsSecundaria()
  const pagina = sec ? secundaria : primaria
  return pagina || <Navigate to="/alumno" replace />
}
