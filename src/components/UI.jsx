import { X, MessageCircle, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export function Logo ({ size = 32, showName = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="/logo.png" width={size} height={size} alt="Logo del colegio" />
      {showName && (
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
            Colegio Cardenal Quintero
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '.04em' }}>
            SISTEMA DE GESTIÓN
          </div>
        </div>
      )}
    </div>
  )
}

export function ThemeToggle () {
  const { theme, toggle } = useTheme()
  return (
    <button className="btn btn-ghost btn-sm" onClick={toggle} title="Cambiar tema" aria-label="Cambiar tema">
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}

export function Modal ({ title, onClose, children, footer, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 720 } : undefined} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ fontSize: 18 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function WhatsAppButton ({ phone, message = 'Hola, le escribo desde el colegio.' }) {
  if (!phone) return <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>Sin teléfono</span>
  const clean = phone.replace(/[^\d]/g, '')
  const href = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
  return (
    <a className="btn-wa" href={href} target="_blank" rel="noreferrer" title="Enviar WhatsApp">
      <MessageCircle size={16} />
    </a>
  )
}

export function StatCard ({ icon: Icon, label, value, tone = 'primary', sub }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11, display: 'grid', placeItems: 'center',
        background: `var(--${tone}-soft)`, color: `var(--${tone})`
      }}>
        <Icon size={22} />
      </div>
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{value}</div>
        <div style={{ color: 'var(--text-soft)', fontSize: 13, marginTop: 4 }}>{label}</div>
        {sub && <div style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

export function Loading ({ label = 'Cargando…' }) {
  return (
    <div className="empty" style={{ padding: '64px 20px' }}>
      <div className="spinner" />
      <div style={{ fontSize: 14, color: 'var(--text-soft)', marginTop: 12 }}>{label}</div>
    </div>
  )
}

export function Empty ({ icon: Icon, title, hint }) {
  return (
    <div className="empty">
      {Icon && <Icon size={40} />}
      <div style={{ fontWeight: 600, color: 'var(--text-soft)', marginBottom: 4 }}>{title}</div>
      {hint && <div style={{ fontSize: 13 }}>{hint}</div>}
    </div>
  )
}
