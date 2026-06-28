import { Lock, UserRound } from 'lucide-react'
import { Empty, Loading } from '../../components/UI'
import { useAlumno } from '../../lib/useAlumno'
import { logrosDesbloqueados, tituloNivel } from '../../lib/gamification'

export default function Logros () {
  const { alumno, progreso, loading } = useAlumno()
  const logros = logrosDesbloqueados(progreso)
  const conseguidos = logros.filter(l => l.listo).length

  if (loading) return <Loading label="Cargando tus logros…" />
  if (!alumno) {
    return <div className="card"><Empty icon={UserRound} title="Sin ficha de alumno vinculada"
      hint="Pídele a la administración que conecte tu usuario con tu ficha de alumno." /></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header>
        <h1 style={{ fontSize: 28 }}>🏆 Mis logros</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>
          Has desbloqueado <strong>{conseguidos}</strong> de <strong>{logros.length}</strong> medallas. ¡Sigue así!
        </p>
      </header>

      {/* Resumen de nivel */}
      <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
        background: 'linear-gradient(120deg, var(--primary-soft), var(--accent-soft))', border: 'none' }}>
        <div style={{ fontSize: 56, lineHeight: 1 }}>🦉</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 24 }}>Nivel {progreso.nivel} · {tituloNivel(progreso.nivel)}</div>
          <div style={{ fontSize: 14, color: 'var(--text-soft)', marginTop: 2 }}>{progreso.puntos} estrellas · racha de {progreso.racha} día{progreso.racha === 1 ? '' : 's'}</div>
          <div style={{ height: 10, borderRadius: 99, background: 'rgba(0,0,0,.08)', marginTop: 12, overflow: 'hidden', maxWidth: 420 }}>
            <div style={{ height: '100%', width: `${progreso.progresoPct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginTop: 6 }}>Te faltan {progreso.faltanParaSubir} ⭐ para el nivel {progreso.nivel + 1}</div>
        </div>
      </div>

      {/* Cuadrícula de medallas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: 16 }}>
        {logros.map(l => (
          <div key={l.id} className="card" style={{
            padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            position: 'relative', opacity: l.listo ? 1 : .55,
            border: l.listo ? '2px solid var(--accent)' : '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 50, lineHeight: 1, filter: l.listo ? 'none' : 'grayscale(1)' }}>{l.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{l.titulo}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{l.desc}</div>
            {l.listo
              ? <span className="badge badge-success" style={{ marginTop: 4 }}>¡Conseguido!</span>
              : <span className="badge badge-neutral" style={{ marginTop: 4 }}><Lock size={11} /> Bloqueado</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
