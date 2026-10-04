import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle, Modal, Loading } from '../../components/UI'
import { useSuperAdmin } from '../../context/SuperAdminContext'
import { db, DEFAULT_TENANT } from '../../lib/db'
import { PRINCIPAL, PALETAS, TIPOS, slugify, leerLogo, rutaLogin } from '../../lib/instituciones'

/* Panel del Super Admin: lista de sistemas de gestión (uno por institución)
   en cards, con crear, editar, activar/desactivar y eliminar.            */

const VACIO = {
  nombre: '', slug: '', tipo: 'colegio', estado: 'activo', logo: '',
  color_primario: PALETAS[0][1], color_acento: PALETAS[0][2],
  ciudad: '', direccion: '', telefono: '', email: '', responsable: '',
  // Solo al crear: administrador inicial del sistema.
  admin_nombre: '', admin_usuario: 'admin', admin_pass: '',
}
const CAMPOS = ['nombre', 'slug', 'tipo', 'estado', 'logo', 'color_primario', 'color_acento', 'ciudad', 'direccion', 'telefono', 'email', 'responsable']
const pick = (o) => Object.fromEntries(CAMPOS.map(k => [k, o[k] ?? '']))
const tipoLabel = (id) => TIPOS.find(t => t.id === id)?.label || id
const urlDe = (slug) => window.location.origin + rutaLogin(slug)

/* La institución original siempre aparece como sistema. Se crea una sola
   vez aunque el panel se monte dos veces seguidas (StrictMode). */
let asegurandoPrincipal = null
function asegurarPrincipal (lista) {
  if (lista.some(r => r.slug === DEFAULT_TENANT)) return Promise.resolve(false)
  asegurandoPrincipal ??= db.insert('instituciones', PRINCIPAL).finally(() => { asegurandoPrincipal = null })
  return asegurandoPrincipal.then(() => true)
}

export default function SuperPanel () {
  const { logout } = useSuperAdmin()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')
  const [editando, setEditando] = useState(null)   // null | 'nuevo' | registro
  const [borrando, setBorrando] = useState(null)

  async function cargar () {
    setLoading(true); setError('')
    try {
      let lista = await db.list('instituciones')
      if (await asegurarPrincipal(lista)) lista = await db.list('instituciones')
      setRows(lista.sort((a, b) => (a.slug === DEFAULT_TENANT ? -1 : b.slug === DEFAULT_TENANT ? 1 : a.nombre.localeCompare(b.nombre))))
    } catch (e) {
      setError('No se pudieron cargar los sistemas. ¿Ya corriste "npm run setup:appwrite"? (' + (e?.message || e) + ')')
    } finally { setLoading(false) }
  }
  useEffect(() => { cargar() }, [])

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => [r.nombre, r.ciudad, r.slug, tipoLabel(r.tipo)].some(v => v?.toLowerCase().includes(q)))
  }, [rows, filtro])

  const activos = rows.filter(r => r.estado !== 'inactivo').length

  async function alternarEstado (r) {
    const estado = r.estado === 'inactivo' ? 'activo' : 'inactivo'
    if (estado === 'inactivo' && !confirm(`¿Desactivar "${r.nombre}"? Sus usuarios no podrán iniciar sesión hasta que lo reactives.`)) return
    await db.update('instituciones', r.id, { estado })
    cargar()
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-faint)' }}>SUPER ADMIN</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 18 }}>Sistemas de gestión</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle />
            <button className="btn btn-ghost btn-sm" onClick={async () => { await logout(); navigate('/superadmin', { replace: true }) }}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 16px 60px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 26 }}>Instituciones</h1>
            <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 4 }}>
              {rows.length} {rows.length === 1 ? 'sistema' : 'sistemas'} · {activos} {activos === 1 ? 'activo' : 'activos'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: '1 1 320px', justifyContent: 'flex-end' }}>
            <input className="input" style={{ maxWidth: 260 }} placeholder="Buscar por nombre o ciudad" value={filtro} onChange={e => setFiltro(e.target.value)} />
            <button className="btn btn-primary" onClick={() => setEditando('nuevo')}>+ Nuevo sistema</button>
          </div>
        </div>

        {error && <div className="card card-pad" style={{ color: 'var(--danger)', marginBottom: 18 }}>{error}</div>}

        {loading ? <Loading /> : (
          <div className="sa-grid">
            {visibles.map(r => (
              <TarjetaSistema key={r.id} r={r}
                onEditar={() => setEditando(r)}
                onEstado={() => alternarEstado(r)}
                onEliminar={() => setBorrando(r)} />
            ))}
            {!filtro && (
              <button className="sa-nuevo" onClick={() => setEditando('nuevo')}>
                <span style={{ fontSize: 28, lineHeight: 1, fontWeight: 300 }}>+</span>
                <span style={{ fontWeight: 600 }}>Crear sistema de gestión</span>
                <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>Colegio, escuela o universidad</span>
              </button>
            )}
            {filtro && !visibles.length && <p style={{ color: 'var(--text-soft)' }}>Sin resultados para “{filtro}”.</p>}
          </div>
        )}
      </main>

      {editando && (
        <FormSistema
          inicial={editando === 'nuevo' ? null : editando}
          existentes={rows}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); cargar() }} />
      )}
      {borrando && (
        <EliminarSistema r={borrando} onClose={() => setBorrando(null)} onDone={() => { setBorrando(null); cargar() }} />
      )}
    </div>
  )
}

/* ---------------- Card ---------------- */
function TarjetaSistema ({ r, onEditar, onEstado, onEliminar }) {
  const inactivo = r.estado === 'inactivo'
  const principal = r.slug === DEFAULT_TENANT
  const [copiado, setCopiado] = useState(false)

  function copiar () {
    navigator.clipboard?.writeText(urlDe(r.slug))
    setCopiado(true); setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <article className="card sa-card" style={{ opacity: inactivo ? 0.7 : 1 }}>
      <div style={{ height: 6, background: `linear-gradient(90deg, ${r.color_primario} 0 70%, ${r.color_acento} 70% 100%)` }} />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <LogoBox logo={r.logo} nombre={r.nombre} color={r.color_primario} />
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: 17, lineHeight: 1.25 }}>{r.nombre}</h3>
            <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 2 }}>
              {tipoLabel(r.tipo)}{r.ciudad ? ` · ${r.ciudad}` : ''}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className={`badge ${inactivo ? 'badge-neutral' : 'badge-success'}`}>{inactivo ? 'Inactivo' : 'Activo'}</span>
          {principal && <span className="badge badge-primary">Principal</span>}
        </div>

        <dl className="sa-datos">
          <dt>Acceso</dt>
          <dd style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
            <a href={rutaLogin(r.slug)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rutaLogin(r.slug)}
            </a>
            <button className="sa-link" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>
          </dd>
          {r.responsable && <><dt>Responsable</dt><dd>{r.responsable}</dd></>}
          {(r.telefono || r.email) && <><dt>Contacto</dt><dd>{[r.telefono, r.email].filter(Boolean).join(' · ')}</dd></>}
          <dt>Creado</dt><dd>{r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—'}</dd>
        </dl>
      </div>

      <div className="sa-acciones">
        <a className="btn btn-ghost btn-sm" href={rutaLogin(r.slug)} target="_blank" rel="noreferrer">Abrir</a>
        <button className="btn btn-ghost btn-sm" onClick={onEditar}>Editar</button>
        <button className="btn btn-ghost btn-sm" onClick={onEstado}>{inactivo ? 'Activar' : 'Desactivar'}</button>
        {!principal && <button className="btn btn-ghost btn-sm sa-peligro" onClick={onEliminar}>Eliminar</button>}
      </div>
    </article>
  )
}

function LogoBox ({ logo, nombre, color, size = 52 }) {
  if (logo) return <img src={logo} alt="" width={size} height={size} style={{ objectFit: 'contain', borderRadius: 10, flexShrink: 0 }} />
  const iniciales = (nombre || '?').split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontFamily: 'Fraunces, serif', fontSize: size * 0.36, flexShrink: 0 }}>
      {iniciales}
    </div>
  )
}

/* ---------------- Crear / editar ---------------- */
function FormSistema ({ inicial, existentes, onClose, onSaved }) {
  const nuevo = !inicial
  const [form, setForm] = useState(() => (nuevo ? VACIO : { ...VACIO, ...pick(inicial) }))
  const [slugManual, setSlugManual] = useState(!nuevo)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setNombre = (v) => setForm(f => ({ ...f, nombre: v, slug: slugManual ? f.slug : slugify(v) }))

  async function subirLogo (e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try { set('logo', await leerLogo(file)) }
    catch (err) { setError(err.message) }
  }

  async function guardar () {
    setError('')
    const slug = slugify(form.slug)
    if (!form.nombre.trim()) return setError('Escribe el nombre de la institución.')
    if (!slug) return setError('La dirección de acceso no es válida.')
    if (nuevo && existentes.some(r => r.slug === slug)) return setError(`Ya existe un sistema con la dirección "/i/${slug}".`)
    if (nuevo && (!form.admin_usuario.trim() || form.admin_pass.length < 6)) {
      return setError('Define el usuario del administrador y una clave de al menos 6 caracteres.')
    }

    setGuardando(true)
    try {
      const datos = { ...pick(form), nombre: form.nombre.trim(), slug }
      if (!nuevo) {
        delete datos.slug // la dirección no cambia: los datos están ligados a ella
        await db.update('instituciones', inicial.id, datos)
      } else {
        const inst = await db.insert('instituciones', datos)
        try {
          // Administrador inicial del nuevo sistema (mismo rol que el del colegio original).
          await db.insert('usuarios', {
            institucion_id: slug,
            nombre: form.admin_nombre.trim() || 'Administrador',
            usuario: form.admin_usuario.trim(),
            pass: form.admin_pass,
            rol: 'admin',
            email: form.email,
          })
        } catch (e) {
          await db.remove('instituciones', inst.id)
          throw new Error('No se pudo crear el usuario administrador: ' + (e?.message || e))
        }
      }
      onSaved()
    } catch (e) {
      setError(e?.message || String(e))
      setGuardando(false)
    }
  }

  return (
    <Modal wide title={nuevo ? 'Nuevo sistema de gestión' : `Editar · ${inicial.nombre}`} onClose={onClose}
      footer={<>
        {error && <span style={{ color: 'var(--danger)', fontSize: 13, marginRight: 'auto' }}>{error}</span>}
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : nuevo ? 'Crear sistema' : 'Guardar cambios'}</button>
      </>}>

      <Seccion titulo="Institución">
        <div className="grid-form">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Nombre</label>
            <input className="input" value={form.nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Unidad Educativa San José" autoFocus={nuevo} />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select className="select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Dirección de acceso</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-faint)', fontSize: 14 }}>/i/</span>
              <input className="input" value={form.slug} disabled={!nuevo}
                onChange={e => { setSlugManual(true); set('slug', slugify(e.target.value)) }} placeholder="san-jose" />
            </div>
            {!nuevo && <small style={{ color: 'var(--text-faint)', fontSize: 12 }}>No se puede cambiar después de crear el sistema.</small>}
          </div>
          <div className="field"><label>Ciudad</label><input className="input" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} /></div>
          <div className="field"><label>Dirección</label><input className="input" value={form.direccion} onChange={e => set('direccion', e.target.value)} /></div>
          <div className="field"><label>Responsable / Director(a)</label><input className="input" value={form.responsable} onChange={e => set('responsable', e.target.value)} /></div>
          <div className="field"><label>Teléfono</label><input className="input" value={form.telefono} onChange={e => set('telefono', e.target.value)} /></div>
          <div className="field" style={{ gridColumn: '1 / -1' }}><label>Correo</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        </div>
      </Seccion>

      <Seccion titulo="Logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <LogoBox logo={form.logo} nombre={form.nombre} color={form.color_primario} size={72} />
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
            {form.logo ? 'Cambiar imagen' : 'Subir imagen'}
            <input type="file" accept="image/*" onChange={subirLogo} hidden />
          </label>
          {form.logo && <button className="btn btn-ghost btn-sm" onClick={() => set('logo', '')}>Quitar</button>}
          <small style={{ color: 'var(--text-faint)', fontSize: 12, flexBasis: '100%' }}>PNG o JPG, idealmente cuadrado y con fondo transparente. Se reduce automáticamente.</small>
        </div>
      </Seccion>

      <Seccion titulo="Paleta de colores">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PALETAS.map(([nombre, p, a]) => {
            const sel = form.color_primario.toLowerCase() === p.toLowerCase() && form.color_acento.toLowerCase() === a.toLowerCase()
            return (
              <button key={nombre} type="button" title={nombre}
                onClick={() => setForm(f => ({ ...f, color_primario: p, color_acento: a }))}
                className="sa-paleta" style={{ outline: sel ? '2px solid var(--text)' : 'none' }}>
                <span style={{ background: p }} /><span style={{ background: a }} />
                <em>{nombre}</em>
              </button>
            )
          })}
        </div>
        <div className="grid-form" style={{ marginTop: 14 }}>
          <ColorInput label="Color principal" value={form.color_primario} onChange={v => set('color_primario', v)} />
          <ColorInput label="Color de acento" value={form.color_acento} onChange={v => set('color_acento', v)} />
        </div>
        <Vista form={form} />
      </Seccion>

      {nuevo && (
        <Seccion titulo="Administrador del sistema" nota="Con este usuario se ingresa al panel del nuevo sistema para cargar maestros, alumnos y demás usuarios.">
          <div className="grid-form">
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Nombre</label><input className="input" value={form.admin_nombre} onChange={e => set('admin_nombre', e.target.value)} placeholder="Ej: María Pérez" /></div>
            <div className="field"><label>Usuario</label><input className="input" value={form.admin_usuario} onChange={e => set('admin_usuario', e.target.value)} autoCapitalize="none" /></div>
            <div className="field"><label>Clave</label><input className="input" value={form.admin_pass} onChange={e => set('admin_pass', e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
          </div>
        </Seccion>
      )}
    </Modal>
  )
}

function Seccion ({ titulo, nota, children }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
      <div>
        <h4 style={{ fontSize: 15 }}>{titulo}</h4>
        {nota && <p style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 2 }}>{nota}</p>}
      </div>
      {children}
    </section>
  )
}

function ColorInput ({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="sa-color" />
        <input className="input" value={value} maxLength={7}
          onChange={e => onChange(e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value)} />
      </div>
    </div>
  )
}

/* Vista previa en miniatura: menú lateral + botón, con los colores elegidos. */
function Vista ({ form }) {
  return (
    <div style={{ marginTop: 14, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', height: 132, background: '#F5F4F0' }}>
      <div style={{ width: 150, background: form.color_primario, color: '#fff', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoBox logo={form.logo} nombre={form.nombre} color="rgba(255,255,255,.18)" size={26} />
          <span style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.nombre || 'Institución'}</span>
        </div>
        <div style={{ fontSize: 12, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,.18)' }}>Inicio</div>
        <div style={{ fontSize: 12, padding: '0 8px', opacity: .85 }}>Alumnos</div>
      </div>
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, color: '#1C1E2E' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 15 }}>Vista previa</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ background: form.color_primario, color: '#fff', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 7 }}>Botón principal</span>
          <span style={{ background: form.color_acento, color: '#1C1E2E', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 7 }}>Acento</span>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Eliminar ---------------- */
function EliminarSistema ({ r, onClose, onDone }) {
  const [texto, setTexto] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState('')
  const coincide = texto.trim().toLowerCase() === r.nombre.trim().toLowerCase()

  async function eliminar () {
    setBorrando(true); setError('')
    try {
      await db.purgeTenant(r.slug)
      await db.remove('instituciones', r.id)
      onDone()
    } catch (e) {
      setError(e?.message || String(e))
      setBorrando(false)
    }
  }

  return (
    <Modal title="Eliminar sistema" onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-danger" disabled={!coincide || borrando} onClick={eliminar}>{borrando ? 'Eliminando…' : 'Eliminar definitivamente'}</button>
      </>}>
      <p style={{ fontSize: 14, lineHeight: 1.5 }}>
        Se borrará <b>{r.nombre}</b> junto con <b>todos sus datos</b>: usuarios, alumnos, maestros, tareas, facturas, etc. Esta acción no se puede deshacer.
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-soft)' }}>Si solo quieres bloquear el acceso, usa <b>Desactivar</b>.</p>
      <div className="field">
        <label>Escribe el nombre de la institución para confirmar</label>
        <input className="input" value={texto} onChange={e => setTexto(e.target.value)} placeholder={r.nombre} />
      </div>
      {error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</span>}
    </Modal>
  )
}
