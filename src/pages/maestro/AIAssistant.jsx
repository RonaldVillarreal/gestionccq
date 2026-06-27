import { useState } from 'react'
import { Sparkles, Send, X } from 'lucide-react'

/* Mini asistente de planificación.
   - Si la app corre dentro de Claude.ai (artifacts), usa la API real.
   - Fuera de ese entorno, genera sugerencias con plantillas locales,
     así nunca rompe y no requiere clave. */
async function askAI (prompt, materia) {
  const sys = `Eres un asistente pedagógico. Ayuda a un maestro de ${materia || 'una materia'} a planificar clases. Responde breve, en español, con ideas accionables (objetivos, actividades, recursos).`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', max_tokens: 1000,
        messages: [{ role: 'user', content: `${sys}\n\nConsulta del maestro: ${prompt}` }],
      }),
    })
    if (!res.ok) throw new Error('offline')
    const data = await res.json()
    return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
  } catch {
    // Fallback local
    return [
      `Sugerencia para "${prompt}":`,
      '• Objetivo: que el alumno comprenda el tema mediante ejemplos concretos.',
      '• Inicio (10 min): pregunta disparadora para activar saberes previos.',
      '• Desarrollo (25 min): explicación + actividad práctica en grupos.',
      '• Cierre (10 min): puesta en común y mini-evaluación oral.',
      '• Recursos: pizarra, material impreso, ejemplos visuales.',
    ].join('\n')
  }
}

export default function AIAssistant ({ materia, onClose, onInsert }) {
  const [msgs, setMsgs] = useState([
    { role: 'assistant', text: `¡Hola! Soy tu asistente de planificación de ${materia || 'la materia'}. Pídeme ideas, objetivos o actividades para un tema.` },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send () {
    if (!input.trim()) return
    const q = input.trim()
    setMsgs(m => [...m, { role: 'user', text: q }]); setInput(''); setLoading(true)
    const ans = await askAI(q, materia)
    setMsgs(m => [...m, { role: 'assistant', text: ans }]); setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, width: 360, maxWidth: 'calc(100vw - 32px)', height: 480, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', zIndex: 90, animation: 'pop .2s' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}><Sparkles size={18} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Asistente IA</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Ideas de planificación</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={15} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{ padding: '9px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? 'var(--primary)' : 'var(--surface-2)',
              color: m.role === 'user' ? '#fff' : 'var(--text)', border: m.role === 'user' ? 'none' : '1px solid var(--border)' }}>
              {m.text}
            </div>
            {m.role === 'assistant' && i > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 4, fontSize: 12 }} onClick={() => onInsert(m.text)}>Insertar en plan</button>
            )}
          </div>
        ))}
        {loading && <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Pensando…</div>}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input className="input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ej: ideas para enseñar fracciones" />
        <button className="btn btn-primary btn-sm" onClick={send} disabled={loading}><Send size={15} /></button>
      </div>
    </div>
  )
}
