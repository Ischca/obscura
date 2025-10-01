// Keep render-svg decoupled from layout package by defining the minimal shape it consumes
export interface LayoutResult {
  nodes: { id: string; x: number; y: number; width: number; height: number; shape?: 'rect' | 'ellipse' | 'label'; fill?: string; fillOpacity?: number; stroke?: string }[]
  edges: { id?: string; from: string; to: string; points: { x: number; y: number }[]; kind?: 'forbid'; weight?: number }[]
  width: number
  height: number
}

// Minimal renderer: rounded nodes with labels (id), straight edges with markers.
export function renderSVG(layout: LayoutResult): string {
  const { width, height } = layout
  const defs = `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
      </marker>
      <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#c0392b" />
      </marker>
    </defs>`
  const nodes = layout.nodes
    .map((n: { id: string; x: number; y: number; width: number; height: number; shape?: 'rect'|'ellipse'|'label'; fill?: string; fillOpacity?: number; stroke?: string }) => {
      const lines = wrapLabel(n.id, 12)
      const lineH = 16
      const cx = n.x + n.width / 2
      const cy = n.y + n.height / 2
      const startY = cy - ((lines.length - 1) * lineH) / 2
      const tspans = lines.map((txt, i) => `<tspan x="${cx}" y="${startY + i * lineH}">${escapeXML(txt)}</tspan>`).join('')
      if (n.shape === 'label') {
        return `<g>
        <text text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="14">${tspans}</text>
      </g>`
      }
      const fill = n.fill || '#fff'
      const fillOpacity = n.fillOpacity != null ? n.fillOpacity : 1
      const stroke = n.stroke || '#333'
      const nodeShape = n.shape === 'ellipse'
        ? `<ellipse cx="${cx}" cy="${cy}" rx="${n.width/2}" ry="${n.height/2}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" />`
        : `<rect x="${n.x}" y="${n.y}" rx="8" ry="8" width="${n.width}" height="${n.height}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" />`
      return `<g>
        ${nodeShape}
        <text text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" font-size="14">${tspans}</text>
      </g>`
    })
    .join('\n')
  const edges = layout.edges
    .map((e: { points: { x: number; y: number }[]; kind?: 'forbid'; weight?: number }) => {
      if (!e.points.length) return ''
      const head = e.points[0]
      const tail = e.points.slice(1)
      const segs = tail.map((p: { x: number; y: number }) => `L ${p.x} ${p.y}`).join(' ')
      const d = `M ${head.x} ${head.y} ${segs}`
      const isForbid = e.kind === 'forbid'
      const stroke = isForbid ? '#c0392b' : '#555'
      const dash = isForbid ? ' stroke-dasharray="6 6"' : ''
      const w = e.weight ? Math.max(2, e.weight * 8) : 2
      const marker = isForbid ? 'url(#arrow-red)' : 'url(#arrow)'
      const cross = isForbid ? makeCrossAt(tail[tail.length - 1] || head) : ''
      return `<g>${cross}<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" marker-end="${marker}"${dash} /></g>`
    })
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="max-width:100%;height:auto;display:block">
  ${defs}
  ${edges}
  ${nodes}
</svg>`
}

function escapeXML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function makeCrossAt(p: { x: number; y: number }): string {
  const r = 8
  const a = `${p.x - r},${p.y - r}`
  const b = `${p.x + r},${p.y + r}`
  const c = `${p.x + r},${p.y - r}`
  const d = `${p.x - r},${p.y + r}`
  return `<path d="M ${a} L ${b} M ${c} L ${d}" stroke="#c0392b" stroke-width="2" />`
}

function wrapLabel(s: string, max: number): string[] {
  if (s.length <= max) return [s]
  const out: string[] = []
  let i = 0
  while (i < s.length) {
    out.push(s.slice(i, i + max))
    i += max
  }
  return out
}
