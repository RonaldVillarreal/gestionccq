import { useMemo, useState } from 'react'
import {
  Plus, ChevronLeft, BookOpen, CalendarRange, Image as ImageIcon, Palette,
  Send, Sparkles, ArrowLeft, Trash2, CheckCircle2, Clock, RefreshCw, Calculator
} from 'lucide-react'
import { Modal, Empty } from '../../components/UI'
import { useTable } from '../../lib/useTable'
import { useAuth } from '../../context/AuthContext'
import { tipoDeMateria } from '../../lib/materiasEspeciales'
import CuadernoMatematico from '../../components/CuadernoMatematico'
import EditorMateria from '../../components/EditorMateria'
import Calculadora from '../../components/Calculadora'
import AIAssistant from './AIAssistant'

const PALETA = ['#2A2F6B', '#C0392B', '#2E7D52', '#C99A2E', '#7B4FB8', '#0E7490', '#B45309']

const STATUS = {
  borrador: { label: 'Borrador', cls: 'badge-neutral', icon: Clock },
  pendiente: { label: 'Pendiente de aprobación', cls: 'badge-warning', icon: Clock },
  correccion: { label: 'Con correcciones', cls: 'badge-danger', icon: RefreshCw },
  aprobada: { label: 'Aprobada', cls: 'badge-success', icon: CheckCircle2 },
}

export default function Planificacion () {
  const { user } = useAuth()
  const materias = useTable('materias')
  const planes = useTable('planificaciones')
  const usuarios = useTable('usuarios')
  const maestros = useTable('maestros')

  const [selMateria, setSelMateria] = useState(null)
  const [newMateria, setNewMateria] = useState(false)
  const [matForm, setMatForm] = useState({ nombre: '', color: PALETA[0] })
  const [editor, setEditor] = useState(null) // plan en edición/creación
  const [ai, setAi] = useState(false)
  const [calc, setCalc] = useState(false)

  const miMaestroId = useMemo(() => {
    const m = maestros.rows.find(x => x.usuario_id === user?.id)
    return m?.id || 'm-1'
  }, [maestros.rows, user])

  const aprobadores = usuarios.rows.filter(u => u.rol === 'aprobador')

  async function crearMateria () {
    if (!matForm.nombre) return
    await materias.insert({ ...matForm, maestro_id: miMaestroId })
    setNewMateria(false); setMatForm({ nombre: '', color: PALETA[0] })
  }

  function nuevoPlan (materia) {
    setEditor({
      materia_id: materia.id, maestro_id: miMaestroId, titulo: '', fecha: '',
      contenido: '', color: materia.color, aprobador_id: aprobadores[0]?.id || '',
      status: 'borrador', correcciones: '', imagenes: [],
    })
  }

  function setE (k, v) { setEditor(e => ({ ...e, [k]: v })) }

  async function onImage (e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => setE('imagenes', [...(editor.imagenes || []), reader.result])
    reader.readAsDataURL(file)
  }

  async function guardarPlan (enviar) {
    if (!editor.titulo || !editor.fecha) return alert('Pon un título y una fecha.')
    if (enviar && !editor.aprobador_id) return alert('Selecciona quién aprueba el plan.')
    const payload = { ...editor, status: enviar ? 'pendiente' : (editor.status === 'correccion' ? 'pendiente' : 'borrador') }
    if (editor.id) await planes.update(editor.id, payload)
    else await planes.insert(payload)
    setEditor(null)
  }

  const planesDeMateria = (matId) => planes.rows.filter(p => p.materia_id === matId)

  // ---------- Vista editor ----------
  if (editor) {
    const materia = materias.rows.find(m => m.id === editor.materia_id)
    // El tipo de materia decide qué capacidades tiene el editor.
    const tipo = tipoDeMateria(materia?.nombre)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860 }}>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setEditor(null); setCalc(false) }}><ArrowLeft size={15} /> Volver</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ width: 14, height: 14, borderRadius: 4, background: editor.color }} />
          <h1 style={{ fontSize: 26 }}>{editor.id ? 'Editar' : 'Nueva'} planificación · {materia?.nombre}</h1>
          {tipo && <span className="badge badge-primary">{tipo.emoji} Modo {tipo.label}</span>}
        </div>

        {editor.status === 'correccion' && editor.correcciones && (
          <div className="card card-pad" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
            <strong style={{ color: 'var(--danger)' }}>Correcciones del aprobador:</strong>
            <p style={{ marginTop: 6, fontSize: 14 }}>{editor.correcciones}</p>
          </div>
        )}

        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-form">
            <div className="field"><label>Título del tema</label><input className="input" value={editor.titulo} onChange={e => setE('titulo', e.target.value)} placeholder="Ej: Fracciones equivalentes" /></div>
            <div className="field"><label>Fecha de la clase</label><input className="input" type="date" value={editor.fecha} onChange={e => setE('fecha', e.target.value)} /></div>
          </div>

          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Palette size={14} /> Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PALETA.map(c => (
                <button key={c} onClick={() => setE('color', c)} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: editor.color === c ? '3px solid var(--text)' : '2px solid var(--border)' }} />
              ))}
            </div>
          </div>

          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span>
                {tipo?.editor === 'cuaderno' ? 'Cuaderno de clase · operaciones y notas'
                  : '¿Cómo abordarás el tema?'}
              </span>
              {tipo?.calculadora && (
                <button className="btn btn-ghost btn-sm" onClick={() => setCalc(c => !c)} type="button">
                  <Calculator size={14} /> {calc ? 'Ocultar' : 'Calculadora'}
                </button>
              )}
            </label>

            {/* El tipo de materia decide el editor; las demás usan texto normal. */}
            {tipo?.editor === 'cuaderno' ? (
              <CuadernoMatematico value={editor.contenido} onChange={v => setE('contenido', v)} />
            ) : tipo?.editor === 'materia' ? (
              <EditorMateria tipo={tipo} value={editor.contenido} onChange={v => setE('contenido', v)} />
            ) : (
              <textarea className="textarea" style={{ minHeight: 160 }} value={editor.contenido} onChange={e => setE('contenido', e.target.value)}
                placeholder="Describe objetivos, actividades, recursos, evaluación…" />
            )}
          </div>

          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ImageIcon size={14} /> Imágenes / material visual</label>
            <label className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', cursor: 'pointer' }}>
              <Plus size={14} /> Agregar imagen<input type="file" accept="image/*" hidden onChange={onImage} />
            </label>
            {editor.imagenes?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {editor.imagenes.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} style={{ width: 90, height: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                    <button onClick={() => setE('imagenes', editor.imagenes.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 12 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="field">
            <label>Aprobador asignado</label>
            <select className="select" value={editor.aprobador_id} onChange={e => setE('aprobador_id', e.target.value)}>
              <option value="">— Selecciona quién aprueba —</option>
              {aprobadores.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            {!aprobadores.length && <span style={{ fontSize: 12, color: 'var(--danger)' }}>No hay aprobadores. Pide al admin que cree uno.</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => guardarPlan(false)}>Guardar borrador</button>
          <button className="btn btn-primary" onClick={() => guardarPlan(true)}><Send size={16} /> Enviar a aprobación</button>
          <button className="btn btn-accent" style={{ marginLeft: 'auto' }} onClick={() => setAi(true)}><Sparkles size={16} /> Asistente IA</button>
        </div>

        {ai && <AIAssistant materia={materia?.nombre} onClose={() => setAi(false)} onInsert={(txt) => setE('contenido', (editor.contenido ? editor.contenido + '\n\n' : '') + txt)} />}

        {calc && tipo?.calculadora && (
          <Calculadora onClose={() => setCalc(false)}
            onInsertar={(linea) => setE('contenido', (editor.contenido ? editor.contenido + '\n' : '') + linea)} />
        )}
      </div>
    )
  }

  // ---------- Vista detalle de materia ----------
  if (selMateria) {
    const lista = planesDeMateria(selMateria.id).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setSelMateria(null)}><ChevronLeft size={15} /> Todas las materias</button>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 16, height: 16, borderRadius: 5, background: selMateria.color }} />
            <h1 style={{ fontSize: 28 }}>{selMateria.nombre}</h1>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => nuevoPlan(selMateria)}><Plus size={16} /> Nueva planificación</button>
        </header>

        {lista.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
            {lista.map(p => {
              const st = STATUS[p.status] || STATUS.borrador
              return (
                <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ height: 6, background: p.color }} />
                  <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{p.titulo}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <CalendarRange size={13} /> {p.fecha || 'Sin fecha'}
                        </div>
                      </div>
                      <span className={`badge ${st.cls}`}><st.icon size={12} /> {st.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-soft)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.contenido}</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditor({ ...p, imagenes: p.imagenes || [] })}>
                        {p.status === 'correccion' ? 'Corregir' : 'Abrir'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => confirm('¿Eliminar planificación?') && planes.remove(p.id)} style={{ marginLeft: 'auto' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : <div className="card"><Empty icon={CalendarRange} title="Sin planificaciones" hint="Crea la primera para esta materia." /></div>}
      </div>
    )
  }

  // ---------- Vista materias ----------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Planificación</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Selecciona una materia para gestionar sus planificaciones.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setNewMateria(true)}><Plus size={16} /> Nueva materia</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 18 }}>
        {materias.rows.map(m => {
          const total = planesDeMateria(m.id).length
          const tipo = tipoDeMateria(m.nombre)
          return (
            <button key={m.id} className="card" onClick={() => setSelMateria(m)}
              style={{ textAlign: 'left', cursor: 'pointer', overflow: 'hidden', transition: 'transform .12s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              <div style={{ height: 70, background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: 14 }}>
                <BookOpen size={26} color="#fff" />
                {tipo && <span style={{ fontSize: 24 }} title={`Modo ${tipo.label}`}>{tipo.emoji}</span>}
              </div>
              <div className="card-pad">
                <div style={{ fontWeight: 700, fontSize: 16 }}>{m.nombre}</div>
                <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>{total} planificación{total !== 1 && 'es'}</div>
                {tipo && <span className="badge badge-primary" style={{ marginTop: 8 }}>{tipo.insignia}</span>}
              </div>
            </button>
          )
        })}
      </div>

      {newMateria && (
        <Modal title="Nueva materia" onClose={() => setNewMateria(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setNewMateria(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={crearMateria}>Crear materia</button>
          </>}>
          <div className="field">
            <label>Nombre</label>
            <input className="input" value={matForm.nombre} onChange={e => setMatForm({ ...matForm, nombre: e.target.value })} placeholder="Ej: Geografía" />
            {tipoDeMateria(matForm.nombre) && (
              <span className="badge badge-primary" style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                {tipoDeMateria(matForm.nombre).emoji} Se activará: {tipoDeMateria(matForm.nombre).insignia}
              </span>
            )}
          </div>
          <div className="field">
            <label>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PALETA.map(c => <button key={c} onClick={() => setMatForm({ ...matForm, color: c })} style={{ width: 30, height: 30, borderRadius: 8, background: c, border: matForm.color === c ? '3px solid var(--text)' : '2px solid var(--border)' }} />)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
