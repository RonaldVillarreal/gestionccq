import { useState } from 'react'
import { anioEscolarActual, anioEscolarDe } from './finanzas'

/* ============================================================
   Estado compartido de la vista financiera (Resumen del admin y
   de la administradora): ocultar montos (ojito, persistido) y
   navegar entre años escolares, con "archivo" para los pasados.

   Recibe las facturas para no dejar años "atrapados": el tope
   hacia adelante llega hasta el año más reciente con datos (p. ej.
   inscripciones del próximo año escolar), aunque aún no sea el actual.
============================================================ */
const LS = 'finanzas_ocultar_montos'
const periodoDe = (f) => f.periodo || (f.fecha_emision || f.fecha_pago || f.created_at || '').slice(0, 7)

export function useVistaFinanzas (facturas = []) {
  const [verMontos, setVer] = useState(() => localStorage.getItem(LS) !== '1')
  const [anioEscolar, setAnioEscolar] = useState(() => anioEscolarActual())
  const actual = anioEscolarActual()

  const tope = facturas.reduce((mx, f) => {
    const y = anioEscolarDe(periodoDe(f))
    return (y != null && y > mx) ? y : mx
  }, actual)

  function toggleMontos () {
    setVer(v => { const nv = !v; localStorage.setItem(LS, nv ? '0' : '1'); return nv })
  }

  // Formatea un monto respetando el ojito.
  const money = (v) => (verMontos ? `$${v}` : '$•••')

  return {
    verMontos, toggleMontos, money,
    anioEscolar, setAnioEscolar, actual,
    esArchivo: anioEscolar < actual,
    irAnterior: () => setAnioEscolar(a => a - 1),
    irSiguiente: () => setAnioEscolar(a => Math.min(tope, a + 1)),
    puedeSiguiente: anioEscolar < tope,
  }
}
