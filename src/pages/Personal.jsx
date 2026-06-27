import { useMemo, useState } from 'react'
import { Plus, Upload, Trash2, Briefcase, Download, Search } from 'lucide-react'
import { Modal, Empty, WhatsAppButton } from '../components/UI'
import { useTable } from '../lib/useTable'
import { readExcel, downloadTemplate } from '../lib/excel'

const TIPOS = ['Docente', 'Administrativo', 'Obrero', 'Directivo', 'Otro']
const empty = { nombre: '', apellido: '', cargo: '', tipo: 'Administrativo', telefono: '', email: '' }

export default function Personal () {
  const personal = useTable('personal')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('Todos')
  const [importing, setImporting] = useState(false)

  function set (k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar () {
    if (!form.nombre) return alert('El nombre es obligatorio.')
    await personal.insert(form); setModal(false); setForm(empty)
  }

  async function importar (e) {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    try {
      const rows = await readExcel(file)
      for (const r of rows) {
        await personal.insert({
          nombre: r.nombre || '', apellido: r.apellido || '', cargo: r.cargo || '',
          tipo: r.tipo || 'Otro', telefono: String(r.telefono || ''), email: r.email || '',
        })
      }
      alert(`Importados ${rows.length} registros.`)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setImporting(false); e.target.value = '' }
  }

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return personal.rows.filter(p =>
      (tipo === 'Todos' || p.tipo === tipo) &&
      `${p.nombre} ${p.apellido} ${p.cargo}`.toLowerCase().includes(s))
  }, [personal.rows, q, tipo])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Personal</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>{personal.rows.length} miembros · docentes, administrativos y obreros.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => downloadTemplate('plantilla_personal.xlsx', ['nombre', 'apellido', 'cargo', 'tipo', 'telefono', 'email'])}>
            <Download size={16} /> Plantilla
          </button>
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> {importing ? 'Importando…' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={importar} />
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={16} /> Nuevo</button>
        </div>
      </header>

      <div className="card">
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
            <Search size={16} color="var(--text-faint)" />
            <input className="input" style={{ border: 'none', background: 'transparent', padding: 4 }}
              placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="select" style={{ width: 'auto' }} value={tipo} onChange={e => setTipo(e.target.value)}>
            <option>Todos</option>{TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="scroll-x">
          {filtered.length ? (
            <table className="table">
              <thead><tr><th>Nombre</th><th>Cargo</th><th>Tipo</th><th>Teléfono</th><th>Email</th><th>Contacto</th><th></th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.nombre} {p.apellido}</td>
                    <td>{p.cargo || '—'}</td>
                    <td><span className="badge badge-neutral">{p.tipo}</span></td>
                    <td style={{ color: 'var(--text-soft)' }}>{p.telefono || '—'}</td>
                    <td style={{ color: 'var(--text-soft)' }}>{p.email || '—'}</td>
                    <td><WhatsAppButton phone={p.telefono} message={`Hola ${p.nombre}, le escribimos desde el colegio.`} /></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => confirm('¿Eliminar?') && personal.remove(p.id)}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty icon={Briefcase} title="Sin personal" hint="Agrega un miembro o importa desde Excel." />}
        </div>
      </div>

      {modal && (
        <Modal title="Nuevo personal" onClose={() => setModal(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar}>Guardar</button>
          </>}>
          <div className="grid-form">
            <div className="field"><label>Nombre *</label><input className="input" value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
            <div className="field"><label>Apellido</label><input className="input" value={form.apellido} onChange={e => set('apellido', e.target.value)} /></div>
            <div className="field"><label>Cargo</label><input className="input" value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ej: Secretaria" /></div>
            <div className="field"><label>Tipo</label>
              <select className="select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select>
            </div>
            <div className="field"><label>Teléfono (WhatsApp)</label><input className="input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+58..." /></div>
            <div className="field"><label>Email</label><input className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          </div>
        </Modal>
      )}
    </div>
  )
}
