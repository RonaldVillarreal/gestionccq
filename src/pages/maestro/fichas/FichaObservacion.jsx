import { useState } from 'react'
import { ArrowLeft, Save, Download, Plus, X } from 'lucide-react'
import { imprimirFicha, esc } from '../../../lib/imprimirFicha'

/* Ficha de Observación de Actitudes y Comportamientos.
   Estudiantes poblados del grado. Actitudes = columnas editables,
   cada celda vale 0 (Nunca), 1 (A veces) o 2 (Siempre). El puntaje
   se suma solo. Se guarda como JSON en el campo `datos`. */

const ACTITUDES_DEF = [
  'Llega a la hora indicada',
  'Cuida el patrimonio institucional',
  'Pide la palabra para expresarse',
  'Ayuda a sus compañeros',
  'Respeta a sus docentes',
  'Emplea vocabulario adecuado',
  'Respeta el orden',
  'Respeta las diferencias',
  'No corre por el aula sin permiso',
  'Demuestra aseo personal',
]

function estadoInicial (ficha, maestro) {
  const base = { area: '', bimestre: '', fecha: new Date().toISOString().slice(0, 10), docente: maestro ? `${maestro.nombre} ${maestro.apellido}` : '', actitudes: [...ACTITUDES_DEF], valores: {} }
  if (ficha?.datos) { try { return { ...base, ...JSON.parse(ficha.datos) } } catch { /* datos corrupto */ } }
  return base
}

const puntajeDe = (val) => Object.values(val?.v || {}).reduce((s, x) => s + (Number(x) || 0), 0)

export default function FichaObservacion ({ maestro, materias, alumnos, ficha, onGuardar, onSalir }) {
  const [d, setD] = useState(() => estadoInicial(ficha, maestro))
  const set = (k, v) => setD(p => ({ ...p, [k]: v }))

  const setActitud = (i, txt) => setD(p => ({ ...p, actitudes: p.actitudes.map((a, k) => k === i ? txt : a) }))
  const addActitud = () => setD(p => ({ ...p, actitudes: [...p.actitudes, 'Nueva actitud'] }))
  const delActitud = (i) => setD(p => ({ ...p, actitudes: p.actitudes.filter((_, k) => k !== i) }))

  const setCelda = (alumnoId, i, valor) => setD(p => ({
    ...p, valores: { ...p.valores, [alumnoId]: { ...p.valores[alumnoId], v: { ...(p.valores[alumnoId]?.v || {}), [i]: valor } } },
  }))
  const setObs = (alumnoId, txt) => setD(p => ({
    ...p, valores: { ...p.valores, [alumnoId]: { ...p.valores[alumnoId], obs: txt } },
  }))

  function guardar () {
    onGuardar({
      tipo: 'observacion', grado: maestro?.grado || '', seccion: maestro?.seccion || '',
      titulo: `Observación · ${d.area || 'sin materia'}${d.bimestre ? ` · ${d.bimestre}` : ''}`,
      datos: JSON.stringify(d),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onSalir}><ArrowLeft size={15} /> Volver</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => imprimirFicha(`Observación ${d.area}`, printObservacion(d, { alumnos, maestro }))}><Download size={15} /> PDF</button>
          <button className="btn btn-primary btn-sm" onClick={guardar}><Save size={15} /> Guardar</button>
        </div>
      </div>

      <h1 style={{ fontSize: 22, textAlign: 'center' }}>Ficha de observación de actitudes y comportamientos</h1>

      {/* Encabezado */}
      <div className="card card-pad">
        <div className="grid-form">
          <div className="field"><label>Área curricular</label>
            <input className="input" list="materias-obs" value={d.area} onChange={e => set('area', e.target.value)} placeholder="Ej: Educación Religiosa" />
            <datalist id="materias-obs">{materias.map(m => <option key={m.id} value={m.nombre} />)}</datalist>
          </div>
          <div className="field"><label>Bimestre</label><input className="input" value={d.bimestre} onChange={e => set('bimestre', e.target.value)} placeholder="Ej: I Bimestre" /></div>
          <div className="field"><label>Fecha</label><input className="input" type="date" value={d.fecha} onChange={e => set('fecha', e.target.value)} /></div>
          <div className="field"><label>Docente</label><input className="input" value={d.docente} onChange={e => set('docente', e.target.value)} /></div>
          <div className="field"><label>Grado</label><input className="input" value={maestro?.grado || ''} disabled /></div>
          <div className="field"><label>Sección</label><input className="input" value={maestro?.seccion || ''} disabled /></div>
        </div>
      </div>

      {/* Gestión de actitudes */}
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 14 }}>Actitudes a evaluar ({d.actitudes.length})</strong>
          <button className="btn btn-ghost btn-sm" onClick={addActitud}><Plus size={14} /> Agregar actitud</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {d.actitudes.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 22, color: 'var(--text-faint)', fontSize: 12 }}>{i + 1}</span>
              <input className="input" value={a} onChange={e => setActitud(i, e.target.value)} />
              <button className="btn btn-ghost btn-sm" onClick={() => delActitud(i)} title="Quitar actitud"><X size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de estudiantes */}
      <div className="card">
        <div className="scroll-x">
          <table className="table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>N°</th>
                <th style={{ minWidth: 180, textAlign: 'left' }}>Estudiantes</th>
                {d.actitudes.map((a, i) => <th key={i} title={a} style={{ minWidth: 46, fontSize: 11 }}>{i + 1}</th>)}
                <th style={{ width: 70 }}>Puntaje</th>
                <th style={{ minWidth: 160 }}>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a, idx) => {
                const val = d.valores[a.id] || {}
                return (
                  <tr key={a.id}>
                    <td className="center" style={{ color: 'var(--text-faint)' }}>{String(idx + 1).padStart(2, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{a.apellido} {a.nombre}</td>
                    {d.actitudes.map((_, i) => (
                      <td key={i} style={{ padding: 4, textAlign: 'center' }}>
                        <select className="select" style={{ padding: '4px 2px', minWidth: 42, textAlign: 'center' }}
                          value={val.v?.[i] ?? ''} onChange={e => setCelda(a.id, i, e.target.value === '' ? undefined : Number(e.target.value))}>
                          <option value=""></option><option value="0">0</option><option value="1">1</option><option value="2">2</option>
                        </select>
                      </td>
                    ))}
                    <td className="center"><strong>{puntajeDe(val)}</strong></td>
                    <td style={{ padding: 4 }}><input className="input" style={{ padding: '6px 8px' }} value={val.obs || ''} onChange={e => setObs(a.id, e.target.value)} /></td>
                  </tr>
                )
              })}
              {!alumnos.length && <tr><td colSpan={d.actitudes.length + 4} className="center" style={{ color: 'var(--text-faint)', padding: 24 }}>No hay alumnos inscritos en este grado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-soft)' }}>
        <span><strong>Valoración:</strong></span>
        <span className="badge badge-neutral">0 = Nunca</span>
        <span className="badge badge-neutral">1 = A veces</span>
        <span className="badge badge-neutral">2 = Siempre</span>
      </div>
    </div>
  )
}

/* ---------- Generador de HTML para PDF ---------- */
export function printObservacion (d, { alumnos = [], maestro } = {}) {
  const acts = d.actitudes || []
  const enc = `<table class="enc"><tr>
    <td class="lbl">ÁREA CURRICULAR:</td><td class="val">${esc(d.area)}</td>
    <td class="lbl">BIMESTRE:</td><td class="val">${esc(d.bimestre)}</td></tr>
    <tr><td class="lbl">GRADO:</td><td class="val">${esc(maestro?.grado)}</td>
    <td class="lbl">SECCIÓN:</td><td class="val">${esc(maestro?.seccion)}</td></tr>
    <tr><td class="lbl">DOCENTE:</td><td class="val" colspan="3">${esc(d.docente)}</td></tr>
    <tr><td class="lbl">FECHA:</td><td class="val">${esc(d.fecha)}</td></tr></table>`

  const head = `<tr><th>N°</th><th>ESTUDIANTES</th>` +
    acts.map(a => `<th><div class="rot">${esc(a)}</div></th>`).join('') +
    `<th>PUNTAJE</th><th>OBSERVACIONES</th></tr>`

  const filas = alumnos.map((a, i) => {
    const val = d.valores?.[a.id] || {}
    const celdas = acts.map((_, k) => `<td class="center">${val.v?.[k] ?? ''}</td>`).join('')
    return `<tr><td class="center">${String(i + 1).padStart(2, '0')}</td><td>${esc(a.apellido)} ${esc(a.nombre)}</td>${celdas}<td class="center">${puntajeDe(val)}</td><td>${esc(val.obs || '')}</td></tr>`
  }).join('')

  return `<h1>Ficha de observación de actitudes y comportamientos</h1>${enc}
    <table><thead>${head}</thead><tbody>${filas}</tbody></table>
    <div class="leyenda"><span><b>VALORACIÓN</b></span><span><b>2 = Siempre</b></span><span><b>1 = A veces</b></span><span><b>0 = Nunca</b></span></div>`
}
