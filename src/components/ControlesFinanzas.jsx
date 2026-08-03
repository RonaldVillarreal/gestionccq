import { ChevronLeft, ChevronRight, Eye, EyeOff, Archive } from 'lucide-react'
import { etiquetaAnioEscolar } from '../lib/finanzas'

/* Barra de controles del resumen financiero: navegar entre años
   escolares (con distintivo de archivo) y ocultar/mostrar montos. */
export default function ControlesFinanzas ({ vista }) {
  const { anioEscolar, esArchivo, verMontos, toggleMontos, irAnterior, irSiguiente, puedeSiguiente } = vista
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 4 }}>
        <button className="btn btn-ghost btn-sm" onClick={irAnterior} title="Año escolar anterior"><ChevronLeft size={16} /></button>
        <span style={{ fontWeight: 700, fontSize: 13, minWidth: 104, textAlign: 'center' }}>Año {etiquetaAnioEscolar(anioEscolar)}</span>
        <button className="btn btn-ghost btn-sm" onClick={irSiguiente} disabled={!puedeSiguiente} title="Año escolar siguiente"><ChevronRight size={16} /></button>
      </div>

      {esArchivo && <span className="badge badge-neutral" title="Datos de un año escolar anterior"><Archive size={12} /> Archivo</span>}

      <button className="btn btn-ghost btn-sm" onClick={toggleMontos} title={verMontos ? 'Ocultar montos' : 'Mostrar montos'} aria-label="Alternar montos">
        {verMontos ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
