import { Inbox, CheckCheck, Trash2, Dot } from 'lucide-react'
import { Empty, Loading } from '../components/UI'
import { useInbox, TIPOS_NOTI } from '../lib/inbox'

/* Bandeja de entrada compartida por el alumno y el maestro.
   Muestra los avisos dirigidos al usuario logueado (tareas, entregas,
   medallas), con no-leídas resaltadas. */
export default function Bandeja () {
  const { mias, noLeidas, loading, marcarLeido, marcarTodo, eliminar } = useInbox()

  if (loading) return <Loading label="Cargando tu bandeja…" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28 }}>📬 Bandeja de entrada</h1>
          <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>
            {noLeidas ? `Tienes ${noLeidas} aviso${noLeidas === 1 ? '' : 's'} sin leer.` : 'Estás al día. ¡No hay avisos nuevos!'}
          </p>
        </div>
        {noLeidas > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={marcarTodo}><CheckCheck size={15} /> Marcar todo como leído</button>
        )}
      </header>

      {mias.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mias.map(n => {
            const t = TIPOS_NOTI[n.tipo] || { emoji: '🔔', tono: 'badge-neutral' }
            return (
              <div key={n.id} onClick={() => !n.leido && marcarLeido(n.id)}
                className="card" style={{
                  padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start', cursor: n.leido ? 'default' : 'pointer',
                  borderLeft: `4px solid ${n.leido ? 'var(--border)' : 'var(--primary)'}`,
                  background: n.leido ? 'var(--surface)' : 'var(--primary-soft)',
                }}>
                <div style={{ fontSize: 26, lineHeight: 1 }}>{t.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{n.titulo}</span>
                    {!n.leido && <Dot size={22} color="var(--primary)" style={{ margin: '-6px 0' }} />}
                  </div>
                  {n.cuerpo && <div style={{ fontSize: 14, color: 'var(--text-soft)', marginTop: 3 }}>{n.cuerpo}</div>}
                  <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 5 }}>{(n.created_at || '').slice(0, 10)}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); eliminar(n.id) }} title="Eliminar"><Trash2 size={14} /></button>
              </div>
            )
          })}
        </div>
      ) : <div className="card"><Empty icon={Inbox} title="Tu bandeja está vacía" hint="Aquí llegarán los avisos de tareas, entregas y medallas." /></div>}
    </div>
  )
}
