import { useState } from 'react'
import { ArrowLeft, Save, Download } from 'lucide-react'
import { imprimirFicha, esc } from '../../../lib/imprimirFicha'

/* Registro Anecdótico. Observación puntual de un alumno:
   descripción de lo observado + interpretación + firma. */

function estadoInicial (ficha) {
  const base = { alumno_id: '', fecha: new Date().toISOString().slice(0, 10), lugar: '', hora: '', actividad: '', descripcion: '', interpretacion: '', firma: '' }
  if (ficha?.datos) { try { return { ...base, ...JSON.parse(ficha.datos) } } catch { /* corrupto */ } }
  return base
}

export default function FichaAnecdotico ({ maestro, alumnos, ficha, onGuardar, onSalir }) {
  const [d, setD] = useState(() => estadoInicial(ficha))
  const set = (k, v) => setD(p => ({ ...p, [k]: v }))
  const nombreAlumno = () => { const a = alumnos.find(x => x.id === d.alumno_id); return a ? `${a.apellido} ${a.nombre}` : '' }

  function guardar () {
    if (!d.alumno_id) return alert('Elige al alumno observado.')
    onGuardar({
      tipo: 'anecdotico', grado: maestro?.grado || '', seccion: maestro?.seccion || '',
      titulo: `Registro anecdótico · ${nombreAlumno() || 'alumno'}`,
      datos: JSON.stringify(d),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onSalir}><ArrowLeft size={15} /> Volver</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => imprimirFicha('Registro anecdótico', printAnecdotico(d, { alumnos }))}><Download size={15} /> PDF</button>
          <button className="btn btn-primary btn-sm" onClick={guardar}><Save size={15} /> Guardar</button>
        </div>
      </div>

      <h1 style={{ fontSize: 22, textAlign: 'center' }}>Registro anecdótico</h1>

      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="grid-form">
          <div className="field"><label>Alumno(a) *</label>
            <select className="select" value={d.alumno_id} onChange={e => set('alumno_id', e.target.value)}>
              <option value="">— Elige —</option>
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.apellido} {a.nombre}</option>)}
            </select>
          </div>
          <div className="field"><label>Fecha</label><input className="input" type="date" value={d.fecha} onChange={e => set('fecha', e.target.value)} /></div>
          <div className="field"><label>Lugar</label><input className="input" value={d.lugar} onChange={e => set('lugar', e.target.value)} placeholder="Ej: Aula, patio" /></div>
          <div className="field"><label>Hora</label><input className="input" type="time" value={d.hora} onChange={e => set('hora', e.target.value)} /></div>
        </div>
        <div className="field"><label>Actividad / Área</label><input className="input" value={d.actividad} onChange={e => set('actividad', e.target.value)} /></div>
        <div className="field"><label>Descripción de lo observado</label><textarea className="textarea" style={{ minHeight: 120 }} value={d.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Relata objetivamente lo que ocurrió…" /></div>
        <div className="field"><label>Interpretación de lo observado</label><textarea className="textarea" style={{ minHeight: 100 }} value={d.interpretacion} onChange={e => set('interpretacion', e.target.value)} placeholder="Tu lectura pedagógica del hecho…" /></div>
        <div className="field"><label>Firma</label><input className="input" value={d.firma} onChange={e => set('firma', e.target.value)} placeholder="Nombre y firma del docente" /></div>
      </div>
    </div>
  )
}

/* ---------- Generador de HTML para PDF ---------- */
export function printAnecdotico (d, { alumnos = [] } = {}) {
  const a = alumnos.find(x => x.id === d.alumno_id)
  const nombre = a ? `${a.apellido} ${a.nombre}` : ''
  return `<h1>Registro anecdótico</h1>
    <table class="enc" style="border:1px solid #333">
      <tr><td class="lbl" style="border:1px solid #333">ALUMNO(A):</td><td style="border:1px solid #333">${esc(nombre)}</td>
          <td class="lbl" style="border:1px solid #333">FECHA:</td><td style="border:1px solid #333">${esc(d.fecha)}</td></tr>
      <tr><td class="lbl" style="border:1px solid #333">LUGAR:</td><td style="border:1px solid #333">${esc(d.lugar)}</td>
          <td class="lbl" style="border:1px solid #333">HORA:</td><td style="border:1px solid #333">${esc(d.hora)}</td></tr>
      <tr><td class="lbl" style="border:1px solid #333">ACTIVIDAD/ÁREA:</td><td style="border:1px solid #333" colspan="3">${esc(d.actividad)}</td></tr>
    </table>
    <table><thead><tr><th style="width:45%">DESCRIPCIÓN DE LO OBSERVADO</th><th style="width:40%">INTERPRETACIÓN DE LO OBSERVADO</th><th>FIRMA</th></tr></thead>
    <tbody><tr>
      <td style="vertical-align:top;height:180px">${esc(d.descripcion).replace(/\n/g, '<br>')}</td>
      <td style="vertical-align:top">${esc(d.interpretacion).replace(/\n/g, '<br>')}</td>
      <td style="vertical-align:bottom;text-align:center">${esc(d.firma)}</td>
    </tr></tbody></table>`
}
