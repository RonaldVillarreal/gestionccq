import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, RefreshCw, Clock, LogOut, CalendarRange, BookOpen, X, Send
} from 'lucide-react'
import { Logo, ThemeToggle, Modal, Empty } from '../components/UI'
import VistaContenido from '../components/VistaContenido'
import { useTable } from '../lib/useTable'
import { useAuth } from '../context/AuthContext'

const STATUS = {
  pendiente: { label: 'Pendiente', cls: 'badge-warning', icon: Clock },
  correccion: { label: 'Con correcciones', cls: 'badge-danger', icon: RefreshCw },
  aprobada: { label: 'Aprobada', cls: 'badge-success', icon: CheckCircle2 },
}

export default function Aprobador () {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const planes = useTable('planificaciones')
  const materias = useTable('materias')
  const maestros = useTable('maestros')
  const [review, setReview] = useState(null)
  const [correcciones, setCorrecciones] = useState('')

  const mios = useMemo(
    () => planes.rows.filter(p => p.aprobador_id === user?.id && p.status !== 'borrador'),
    [planes.rows, user]
  )
  const pendientes = mios.filter(p => p.status === 'pendiente')
  const otros = mios.filter(p => p.status !== 'pendiente')

  const matName = (id) => materias.rows.find(m => m.id === id)?.nombre || 'Materia'
  const maestroName = (id) => {
    const m = maestros.rows.find(x => x.id === id)
    return m ? `${m.nombre} ${m.apellido}` : 'Maestro'
  }

  async function aprobar () {
    await planes.update(review.id, { status: 'aprobada', correcciones: '' })
    setReview(null)
  }
  async function devolver () {
    if (!correcciones.trim()) return alert('Escribe las correcciones para el maestro.')
    await planes.update(review.id, { status: 'correccion', correcciones })
    setReview(null); setCorrecciones('')
  }

  function Card ({ p }) {
    const st = STATUS[p.status]
    return (
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ height: 6, background: p.color }} />
        <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{p.titulo}</div>
              <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 2 }}>
                {matName(p.materia_id)} · {maestroName(p.maestro_id)}
              </div>
            </div>
            <span className={`badge ${st.cls}`}><st.icon size={12} /> {st.label}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <CalendarRange size={13} /> {p.fecha}
          </div>
          <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }}
            onClick={() => { setReview(p); setCorrecciones(p.correcciones || '') }}>Revisar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ height: 64, borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <Logo />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ThemeToggle />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.nombre} · Aprobador</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/') }}><LogOut size={16} /></button>
        </div>
      </header>

      <main style={{ padding: 28, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26, animation: 'slideup .25s' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Aprobaciones</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Revisa las planificaciones que los maestros te enviaron.</p>
        </div>

        <section>
          <h3 style={{ fontSize: 18, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} color="var(--warning)" /> Esperando tu revisión ({pendientes.length})</h3>
          {pendientes.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
              {pendientes.map(p => <Card key={p.id} p={p} />)}
            </div>
          ) : <div className="card"><Empty icon={CheckCircle2} title="Todo revisado" hint="No hay planificaciones pendientes." /></div>}
        </section>

        {otros.length > 0 && (
          <section>
            <h3 style={{ fontSize: 18, marginBottom: 14 }}>Historial</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
              {otros.map(p => <Card key={p.id} p={p} />)}
            </div>
          </section>
        )}
      </main>

      {review && (
        <Modal title="Revisar planificación" wide onClose={() => setReview(null)}
          footer={review.status !== 'aprobada' ? <>
            <button className="btn btn-danger" onClick={devolver}><RefreshCw size={16} /> Enviar correcciones</button>
            <button className="btn btn-primary" onClick={aprobar}><CheckCircle2 size={16} /> Aprobar</button>
          </> : <button className="btn btn-ghost" onClick={() => setReview(null)}>Cerrar</button>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: review.color }} />
            <h3 style={{ fontSize: 20 }}>{review.titulo}</h3>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--text-soft)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><BookOpen size={14} /> {matName(review.materia_id)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CalendarRange size={14} /> {review.fecha}</span>
            <span>{maestroName(review.maestro_id)}</span>
          </div>
          <div className="card card-pad" style={{ background: 'var(--surface-2)' }}>
            <VistaContenido texto={review.contenido} />
          </div>
          {review.imagenes?.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {review.imagenes.map((src, i) => <img key={i} src={src} style={{ width: 110, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />)}
            </div>
          )}
          {review.status !== 'aprobada' && (
            <div className="field">
              <label>Correcciones para el maestro (opcional si apruebas)</label>
              <textarea className="textarea" value={correcciones} onChange={e => setCorrecciones(e.target.value)} placeholder="Indica qué debe ajustar…" />
            </div>
          )}
          {review.status === 'aprobada' && <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}><CheckCircle2 size={13} /> Aprobada</span>}
        </Modal>
      )}
    </div>
  )
}
