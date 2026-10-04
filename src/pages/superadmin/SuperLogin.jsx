import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../../components/UI'
import { useSuperAdmin } from '../../context/SuperAdminContext'

export default function SuperLogin () {
  const { activo, cargando, login } = useSuperAdmin()
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (cargando) return null
  if (activo) return <Navigate to="/superadmin/panel" replace />

  async function submit (e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const err = await login(usuario, pass)
    setLoading(false)
    if (err) { setError(err); return }
    navigate('/superadmin/panel', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20 }}><ThemeToggle /></div>

      <form onSubmit={submit} className="card" style={{ width: '100%', maxWidth: 380, padding: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', color: 'var(--text-faint)' }}>SUPER ADMIN</div>
          <h1 style={{ fontSize: 24, marginTop: 6 }}>Sistemas de gestión</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 4 }}>Acceso restringido al administrador de la plataforma.</p>
        </div>

        <div className="field">
          <label>Correo</label>
          <input className="input" type="email" value={usuario} onChange={e => setUsuario(e.target.value)} autoFocus
            autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="email" />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input className="input" type="password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" />
        </div>

        {error && <div className="badge badge-danger" style={{ alignSelf: 'flex-start' }}>{error}</div>}

        <button className="btn btn-primary" disabled={loading || !usuario || !pass} style={{ justifyContent: 'center', padding: 12 }}>
          {loading ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
