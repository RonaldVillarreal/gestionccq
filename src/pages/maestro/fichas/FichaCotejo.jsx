import { useState, Fragment } from 'react'
import { ArrowLeft, Save, Download, Plus, X, Check, Minus } from 'lucide-react'
import { imprimirFicha, esc } from '../../../lib/imprimirFicha'

/* Lista de Cotejo. Encabezado con datos de la sesión, criterios
   editables y, por alumno, cada criterio marcado como Logrado (✔)
   o No logrado (—). Se guarda como JSON en `datos`. */

function estadoInicial (ficha, maestro) {
  const base = {
    docente: maestro ? `${maestro.nombre} ${maestro.apellido}` : '', area: '',
    sesion: '', proposito: '', competencia: '', capacidades: '',
    criterios: ['', ''], valores: {},   // valores[alumnoId][idx] = 'logrado' | 'no'
  }
  if (ficha?.datos) { try { return { ...base, ...JSON.parse(ficha.datos) } } catch { /* corrupto */ } }
  return base
}

export default function FichaCotejo ({ maestro, materias, alumnos, ficha, onGuardar, onSalir }) {
  const [d, setD] = useState(() => estadoInicial(ficha, maestro))
  const set = (k, v) => setD(p => ({ ...p, [k]: v }))

  const setCriterio = (i, txt) => setD(p => ({ ...p, criterios: p.criterios.map((c, k) => k === i ? txt : c) }))
  const addCriterio = () => setD(p => ({ ...p, criterios: [...p.criterios, ''] }))
  const delCriterio = (i) => setD(p => ({ ...p, criterios: p.criterios.filter((_, k) => k !== i) }))

  const marcar = (alumnoId, i, valor) => setD(p => {
    const actual = p.valores[alumnoId]?.[i]
    const nuevo = actual === valor ? '' : valor   // volver a tocar lo desmarca
    return { ...p, valores: { ...p.valores, [alumnoId]: { ...(p.valores[alumnoId] || {}), [i]: nuevo } } }
  })

  function guardar () {
    onGuardar({
      tipo: 'cotejo', grado: maestro?.grado || '', seccion: maestro?.seccion || '',
      titulo: `Lista de cotejo · ${d.area || 'sin área'}`,
      datos: JSON.stringify(d),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onSalir}><ArrowLeft size={15} /> Volver</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => imprimirFicha('Lista de cotejo', printCotejo(d, { alumnos, maestro }))}><Download size={15} /> PDF</button>
          <button className="btn btn-primary btn-sm" onClick={guardar}><Save size={15} /> Guardar</button>
        </div>
      </div>

      <h1 style={{ fontSize: 22, textAlign: 'center' }}>Lista de cotejo</h1>

      {/* Encabezado */}
      <div className="card card-pad">
        <div className="grid-form">
          <div className="field"><label>Docente</label><input className="input" value={d.docente} onChange={e => set('docente', e.target.value)} /></div>
          <div className="field"><label>Grado y sección</label><input className="input" value={`${maestro?.grado || ''}${maestro?.seccion ? ' · ' + maestro.seccion : ''}`} disabled /></div>
          <div className="field"><label>Área</label>
            <input className="input" list="materias-cot" value={d.area} onChange={e => set('area', e.target.value)} placeholder="Ej: Personal Social" />
            <datalist id="materias-cot">{materias.map(m => <option key={m.id} value={m.nombre} />)}</datalist>
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}><label>Sesión</label><input className="input" value={d.sesion} onChange={e => set('sesion', e.target.value)} placeholder="Título de la sesión" /></div>
        <div className="field" style={{ marginTop: 12 }}><label>Propósito</label><textarea className="input" rows={2} value={d.proposito} onChange={e => set('proposito', e.target.value)} /></div>
        <div className="grid-form" style={{ marginTop: 12 }}>
          <div className="field"><label>Competencia</label><input className="input" value={d.competencia} onChange={e => set('competencia', e.target.value)} /></div>
          <div className="field"><label>Capacidades</label><input className="input" value={d.capacidades} onChange={e => set('capacidades', e.target.value)} placeholder="Separadas por coma" /></div>
        </div>
      </div>

      {/* Criterios */}
      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 14 }}>Criterios a evaluar ({d.criterios.length})</strong>
          <button className="btn btn-ghost btn-sm" onClick={addCriterio}><Plus size={14} /> Agregar criterio</button>
        </div>
        {d.criterios.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ width: 22, color: 'var(--text-faint)', fontSize: 12, marginTop: 10 }}>{i + 1}</span>
            <textarea className="input" rows={2} value={c} onChange={e => setCriterio(i, e.target.value)} placeholder="Describe el criterio a evaluar…" />
            <button className="btn btn-ghost btn-sm" onClick={() => delCriterio(i)} title="Quitar criterio"><X size={14} /></button>
          </div>
        ))}
      </div>

      {/* Tabla de alumnos */}
      <div className="card">
        <div className="scroll-x">
          <table className="table" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>N°</th>
                <th style={{ minWidth: 180, textAlign: 'left' }}>Nombres y apellidos</th>
                {d.criterios.map((_, i) => <th key={i} colSpan={2} style={{ minWidth: 150 }}>Criterio {i + 1}</th>)}
              </tr>
              <tr>
                <th></th><th></th>
                {d.criterios.map((_, i) => (
                  <Fragment key={i}>
                    <th style={{ fontSize: 11 }}>Logrado</th>
                    <th style={{ fontSize: 11 }}>No logrado</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a, idx) => {
                const val = d.valores[a.id] || {}
                return (
                  <tr key={a.id}>
                    <td className="center" style={{ color: 'var(--text-faint)' }}>{String(idx + 1).padStart(2, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{a.apellido} {a.nombre}</td>
                    {d.criterios.map((_, i) => (
                      <Fragment key={i}>
                        <td className="center" style={{ padding: 4 }}>
                          <button onClick={() => marcar(a.id, i, 'logrado')} title="Logrado"
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: val[i] === 'logrado' ? 'var(--success)' : 'var(--surface-2)', color: val[i] === 'logrado' ? '#fff' : 'var(--text-faint)', display: 'grid', placeItems: 'center' }}>
                            <Check size={16} />
                          </button>
                        </td>
                        <td className="center" style={{ padding: 4 }}>
                          <button onClick={() => marcar(a.id, i, 'no')} title="No logrado"
                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: val[i] === 'no' ? 'var(--danger)' : 'var(--surface-2)', color: val[i] === 'no' ? '#fff' : 'var(--text-faint)', display: 'grid', placeItems: 'center' }}>
                            <Minus size={16} />
                          </button>
                        </td>
                      </Fragment>
                    ))}
                  </tr>
                )
              })}
              {!alumnos.length && <tr><td colSpan={2 + d.criterios.length * 2} className="center" style={{ color: 'var(--text-faint)', padding: 24 }}>No hay alumnos inscritos en este grado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-soft)' }}>
        <span className="badge badge-success"><Check size={12} /> Logrado</span>
        <span className="badge badge-danger"><Minus size={12} /> No logrado</span>
      </div>
    </div>
  )
}

/* ---------- Generador de HTML para PDF ---------- */
export function printCotejo (d, { alumnos = [], maestro } = {}) {
  const crit = d.criterios || []
  const enc = `<table class="enc">
    <tr><td class="lbl">DOCENTE:</td><td class="val">${esc(d.docente)}</td><td class="lbl">ÁREA:</td><td class="val">${esc(d.area)}</td></tr>
    <tr><td class="lbl">GRADO Y SECCIÓN:</td><td class="val" colspan="3">${esc(maestro?.grado)}${maestro?.seccion ? ' · ' + esc(maestro.seccion) : ''}</td></tr>
    <tr><td class="lbl">SESIÓN:</td><td class="val" colspan="3">${esc(d.sesion)}</td></tr>
    <tr><td class="lbl">PROPÓSITO:</td><td class="val" colspan="3">${esc(d.proposito)}</td></tr>
    <tr><td class="lbl">COMPETENCIA:</td><td class="val" colspan="3">${esc(d.competencia)}</td></tr>
    <tr><td class="lbl">CAPACIDADES:</td><td class="val" colspan="3">${esc(d.capacidades)}</td></tr></table>`

  const head1 = `<tr><th rowspan="2">N°</th><th rowspan="2">NOMBRES Y APELLIDOS</th>` +
    crit.map((c, i) => `<th colspan="2">${esc(c) || 'Criterio ' + (i + 1)}</th>`).join('') + `</tr>`
  const head2 = `<tr>` + crit.map(() => `<th>Logrado</th><th>No logrado</th>`).join('') + `</tr>`

  const filas = alumnos.map((a, i) => {
    const val = d.valores?.[a.id] || {}
    const celdas = crit.map((_, k) => `<td class="center">${val[k] === 'logrado' ? '✔' : ''}</td><td class="center">${val[k] === 'no' ? '—' : ''}</td>`).join('')
    return `<tr><td class="center">${String(i + 1).padStart(2, '0')}</td><td>${esc(a.apellido)} ${esc(a.nombre)}</td>${celdas}</tr>`
  }).join('')

  return `<h1>Lista de cotejo</h1>${enc}
    <table><thead>${head1}${head2}</thead><tbody>${filas}</tbody></table>
    <div class="leyenda"><span><b>✔ Logrado</b></span><span><b>— No logrado</b></span></div>`
}
