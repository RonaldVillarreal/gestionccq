/* ============================================================
   Impresión / descarga en PDF sin dependencias.
   Abre una ventana con solo la ficha y dispara el diálogo de
   impresión del navegador, donde el maestro elige "Guardar como PDF".
   Cada ficha arma su propio HTML de tabla; aquí va el marco y los
   estilos de impresión compartidos.
============================================================ */

const ESTILOS = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 24px; }
  h1 { text-align: center; font-size: 18px; margin: 0 0 4px; text-transform: uppercase; }
  h2 { text-align: center; font-size: 14px; margin: 0 0 14px; color: #444; font-weight: normal; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #333; padding: 4px 6px; font-size: 11px; }
  th { background: #A9C24A; text-align: center; }
  .enc { width: 100%; margin-bottom: 12px; font-size: 12px; }
  .enc td { border: none; padding: 2px 4px; }
  .enc .lbl { font-weight: bold; white-space: nowrap; }
  .enc .val { border-bottom: 1px solid #333; }
  .center { text-align: center; }
  .rot { writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; font-weight: normal; font-size: 10px; }
  .leyenda { margin-top: 12px; font-size: 12px; display: flex; gap: 18px; flex-wrap: wrap; }
  .leyenda b { background: #eee; padding: 2px 8px; border: 1px solid #999; border-radius: 4px; }
  .caja { border: 1px solid #333; min-height: 90px; padding: 6px; font-size: 12px; white-space: pre-wrap; }
  @media print { body { margin: 10mm; } @page { size: A4; } }
`

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export { esc }

/** Abre la ventana de impresión con la ficha ya maquetada. */
export function imprimirFicha (titulo, cuerpoHTML) {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { alert('Permite las ventanas emergentes para descargar el PDF.'); return }
  w.document.write(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title>` +
    `<style>${ESTILOS}</style></head><body>${cuerpoHTML}` +
    `<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>` +
    `</body></html>`
  )
  w.document.close()
}
