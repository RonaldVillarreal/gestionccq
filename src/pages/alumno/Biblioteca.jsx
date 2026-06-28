import { useMemo } from 'react'
import { BookOpen, ExternalLink, Library, UserRound } from 'lucide-react'
import { Empty, Loading } from '../../components/UI'
import { useAlumno } from '../../lib/useAlumno'
import { materiaEmoji } from '../../lib/gamification'

export default function Biblioteca () {
  const { alumno, misMaterias, misLibros, loading } = useAlumno()

  // Agrupa los libros por materia para presentarlos como estantes.
  const estantes = useMemo(() => {
    const porMateria = misMaterias.map(m => ({
      materia: m,
      libros: misLibros.filter(l => l.materia_id === m.id),
    }))
    const sinMateria = misLibros.filter(l => !misMaterias.some(m => m.id === l.materia_id))
    if (sinMateria.length) porMateria.push({ materia: { id: '_otros', nombre: 'Otros libros', color: 'var(--text-faint)' }, libros: sinMateria })
    return porMateria.filter(e => e.libros.length)
  }, [misMaterias, misLibros])

  if (loading) return <Loading label="Abriendo tu biblioteca…" />
  if (!alumno) {
    return <div className="card"><Empty icon={UserRound} title="Sin ficha de alumno vinculada"
      hint="Pídele a la administración que conecte tu usuario con tu ficha de alumno." /></div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <header>
        <h1 style={{ fontSize: 28 }}>📚 Mi biblioteca</h1>
        <p style={{ color: 'var(--text-soft)', marginTop: 4 }}>Aquí están los libros que usa tu maestra, ordenados por materia.</p>
      </header>

      {estantes.length ? estantes.map(({ materia, libros }) => (
        <section key={materia.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>{materiaEmoji(materia.nombre)}</span>
            <h3 style={{ fontSize: 19 }}>{materia.nombre}</h3>
            <span className="badge badge-neutral">{libros.length} libro{libros.length === 1 ? '' : 's'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: 16 }}>
            {libros.map(l => {
              const color = l.color || materia.color || 'var(--primary)'
              return (
                <a key={l.id} href={l.url || '#'} target="_blank" rel="noreferrer"
                  className="card libro-card"
                  style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: l.url ? 'auto' : 'none' }}>
                  {/* Lomo/portada decorativa */}
                  <div style={{ height: 110, background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`, position: 'relative', display: 'grid', placeItems: 'center' }}>
                    <span style={{ fontSize: 46 }}>{materiaEmoji(materia.nombre)}</span>
                    <span style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 6, background: 'rgba(255,255,255,.35)', borderRadius: 99 }} />
                  </div>
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.25 }}>{l.titulo}</div>
                    {l.autor && <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{l.autor}</div>}
                    {l.descripcion && <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>{l.descripcion}</div>}
                    <span className="btn btn-primary btn-sm" style={{ marginTop: 'auto', justifyContent: 'center' }}>
                      {l.url ? <><BookOpen size={15} /> Abrir libro <ExternalLink size={13} /></> : 'Sin enlace'}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )) : (
        <div className="card">
          <Empty icon={Library} title="Tu biblioteca está vacía por ahora"
            hint="Cuando tu maestra suba los libros de tus materias, los verás aquí." />
        </div>
      )}
    </div>
  )
}
