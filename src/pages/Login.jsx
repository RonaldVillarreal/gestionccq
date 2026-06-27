import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, ThemeToggle } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { LogIn } from 'lucide-react'

export default function Login () {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit (e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await login(usuario, pass)
    setLoading(false)
    if (!res.ok) { setError(res.error); return }
    const dest = { admin: '/admin', maestro: '/maestro', aprobador: '/aprobador' }[res.user.rol] || '/admin'
    navigate(dest)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* fondo decorativo */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1200px 600px at 80% -10%, var(--primary-soft), transparent 60%), radial-gradient(900px 500px at -10% 110%, var(--accent-soft), transparent 55%)' }} />
      <div style={{ position: 'absolute', top: 20, right: 20 }}><ThemeToggle /></div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 420, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}><Logo size={56} /></div>

        <form onSubmit={submit} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 30 }}>
          <div>
            <h1 style={{ fontSize: 24 }}>Bienvenido</h1>
            <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 4 }}>Ingresa con tus credenciales del colegio.</p>
          </div>

          <div className="field">
            <label>Usuario</label>
            <input className="input" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Ej: Ronald" autoFocus />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div className="badge badge-danger" style={{ alignSelf: 'flex-start' }}>{error}</div>}

          <button className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: 12 }}>
            <LogIn size={18} />{loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
