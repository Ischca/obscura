import React, { useEffect, useState } from 'react'
// Import workspace sources so Vite bundles them for the browser
// (dynamic imports of dist paths can 404 under dev server)
import { parse } from '../../parser/src/index.ts'
import { layout } from '../../layout-elk/src/index.ts'
import { renderSVG } from '../../render-svg/src/index.ts'

export function DiagramViewer({ dsl, width = 640, grid = false }: { dsl: string; width?: number; grid?: boolean }) {
  const [svg, setSvg] = useState<string>('')
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    async function run() {
      setErr(null)
      try {
        const ast = parse(dsl)
        const g = await layout(ast)
        const s = renderSVG(g)
        if (!cancelled) setSvg(s)
      } catch (e) {
        if (!cancelled) { setErr(String(e)); setSvg('') }
      }
    }
    run()
    return () => { cancelled = true }
  }, [dsl])
  const bg = grid
    ? {
        backgroundImage:
          'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)',
        backgroundSize: '16px 16px, 16px 16px',
      }
    : {}
  return (
    <div style={{ padding: 16, background: '#f8f9fa' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          onClick={() => svg && navigator.clipboard?.writeText(svg)}
          style={{ padding: '6px 10px', fontSize: 12 }}
          title="Copy SVG to clipboard"
        >Copy SVG</button>
        {err && <span style={{ color: '#c0392b', fontSize: 12 }}>Error: {err}</span>}
      </div>
      <div style={{ maxWidth: width, ...bg }}>
        {svg ? (
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div style={{ color: '#888' }}>Loading…</div>
        )}
      </div>
    </div>
  )
}
