import type { Diagram, Flow } from '@obscura/core'
// Use elkjs as a dependency (UMD bundle). ESM default import yields constructor.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - elkjs provides a UMD bundle compatible with import default
import ELK from 'elkjs/lib/elk.bundled.js'

export interface LayoutResult {
  nodes: { id: string; x: number; y: number; width: number; height: number }[]
  edges: { id?: string; from: string; to: string; points: { x: number; y: number }[]; kind?: 'forbid'; weight?: number }[]
  width: number
  height: number
}

// Stub layout that returns an empty canvas; replace with ELK-powered layout.
// Compute a simple left-to-right layered layout for Flow diagrams.
// Each unique node is placed on a grid; edges are routed as straight segments.
const DEFAULT_W = 160
const BASE_H = 56
const elk = new ELK({
  defaultLayoutOptions: {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.nodeNodeBetweenLayers': '48',
    'elk.spacing.nodeNode': '28',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.edgeRouting': 'ORTHOGONAL'
  }
})

export async function layout(diagram: Diagram): Promise<LayoutResult> {
  if (diagram.type === 'boundary') {
    return layoutBoundary(diagram as any)
  }
  if (diagram.type === 'guardrail') {
    return layoutGuardrail(diagram as any)
  }
  if ((diagram as any).type === 'board') {
    return layoutBoard(diagram as any)
  }
  if ((diagram as any).type === 'timeline') {
    return layoutTimeline(diagram as any)
  }
  if ((diagram as any).type === 'cycle') {
    return layoutCycle(diagram as any)
  }
  if ((diagram as any).type === 'venn') {
    return layoutVenn(diagram as any)
  }
  if ((diagram as any).type === 'sipoc') {
    return layoutSIPOC(diagram as any)
  }
  if ((diagram as any).type === 'swimlane') {
    return layoutSwimlane(diagram as any)
  }
  if ((diagram as any).type === 'hierarchy') {
    return layoutHierarchy(diagram as any)
  }
  if ((diagram as any).type === 'funnel') {
    return layoutFunnel(diagram as any)
  }
  if ((diagram as any).type === 'journey') {
    return layoutJourney(diagram as any)
  }
  if ((diagram as any).type === 'blueprint') {
    return layoutBlueprint(diagram as any)
  }
  if ((diagram as any).type === 'okr') {
    return layoutOKR(diagram as any)
  }
  if ((diagram as any).type === 'decision') {
    return layoutDecision(diagram as any)
  }
  if ((diagram as any).type === 'quadrant') {
    return layoutQuadrant(diagram as any)
  }
  if ((diagram as any).type === 'heatmap') {
    return layoutHeatmap(diagram as any)
  }
  if ((diagram as any).type === 'fishbone') {
    return layoutFishbone(diagram as any)
  }
  if ((diagram as any).type === 'sankey') {
    return layoutSankey(diagram as any)
  }
  if (diagram.type === 'matrix') {
    return layoutMatrix(diagram as any)
  }
  if (diagram.type !== 'flow') {
    return { nodes: [], edges: [], width: 800, height: 600 }
  }
  const flow = diagram as Flow
  const H = BASE_H
  // Build ELK graph
  const nodeIds = new Set<string>()
  for (const e of flow.paths) { nodeIds.add(e.from); nodeIds.add(e.to) }
  if (flow.forbids) for (const e of flow.forbids) { nodeIds.add(e.from); nodeIds.add(e.to) }
  const children = Array.from(nodeIds).map(id => {
    const size = estimateSize(id)
    return { id, width: size.width, height: size.height }
  })
  const edgeDefs = [] as { id: string; sources: string[]; targets: string[]; kind?: 'forbid' }[]
  flow.paths.forEach((e, i) => edgeDefs.push({ id: `e${i}`, sources: [e.from], targets: [e.to] }))
  const startIdx = edgeDefs.length
  flow.forbids?.forEach((e, j) => edgeDefs.push({ id: `f${startIdx + j}`, sources: [e.from], targets: [e.to], kind: 'forbid' }))
  const graph: any = { id: 'root', children, edges: edgeDefs.map(({ id, sources, targets }) => ({ id, sources, targets })) }

  const laid = await elk.layout({
    ...graph,
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '36',
      'elk.spacing.edgeNode': '24',
      'elk.spacing.edgeEdge': '24',
      'elk.layered.spacing.nodeNodeBetweenLayers': '64',
      'elk.layered.thoroughness': '10'
    }
  })
  const nodes = (laid.children || []).map((n: any) => ({
    id: n.id,
    x: n.x, y: n.y, width: n.width || DEFAULT_W, height: n.height || H
  }))
  const kindById = new Map(edgeDefs.map(ed => [ed.id, ed.kind]))
  const eds = (laid.edges || []).map((e: any) => {
    const sec = e.sections && e.sections[0]
    const seq = sec
      ? [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint].filter(Boolean)
      : []
    const pts = seq.map((p: any) => ({ x: p.x, y: p.y }))
    return { id: e.id, from: e.sources[0], to: e.targets[0], points: pts, kind: kindById.get(e.id) }
  })
  const width = laid.width || Math.max(...nodes.map(n => n.x + n.width), 800)
  const height = laid.height || Math.max(...nodes.map(n => n.y + n.height), 600)
  return { nodes, edges: eds, width, height }
}

function estimateSize(label: string): { width: number; height: number; lines: number } {
  const baseW = 140
  const perChar = 14 // rough width for CJK and ASCII mix
  const maxW = 280
  const wrapAt = 10
  const len = label.length
  const lines = Math.max(1, Math.ceil(len / wrapAt))
  const width = Math.min(Math.max(baseW + perChar * Math.min(len, wrapAt), baseW), maxW)
  const lineH = 18
  const paddingV = 20
  const height = BASE_H + (lines - 1) * lineH + paddingV / 2
  return { width, height, lines }
}
async function layoutBoundary(bound: { internal: { id: string }[]; external?: { id: string }[]; allows: EdgeDef[]; forbids?: EdgeDef[] }): Promise<LayoutResult> {
  const pad = 24
  const boxW = 220
  const boxH = 60
  const leftX = 40
  const rightX = 560
  const internalNodes = (bound.internal || []).map((n, i) => ({ id: n.id, x: leftX, y: 40 + i * (boxH + pad), width: boxW, height: boxH }))
  const ext = bound.external && bound.external.length ? bound.external : [{ id: 'external' }]
  const externalNodes = ext.map((n, i) => ({ id: n.id, x: rightX, y: 40 + i * (boxH + pad), width: boxW, height: boxH }))
  const nodes = [...internalNodes, ...externalNodes]
  const edges = [...(bound.allows || []), ...(bound.forbids || [])].map(e => {
    const a = nodes.find(n => n.id === e.from)
    const b = nodes.find(n => n.id === e.to)
    if (!a || !b) return { from: e.from, to: e.to, points: [], kind: e.kind as any }
    const p1 = { x: a.x + a.width, y: a.y + a.height / 2 }
    const p2 = { x: b.x, y: b.y + b.height / 2 }
    const mid = { x: (p1.x + p2.x) / 2, y: p1.y }
    return { from: e.from, to: e.to, points: [p1, mid, p2], kind: e.kind as any }
  })
  const width = rightX + boxW + 40
  const height = Math.max(...nodes.map(n => n.y + n.height), 600)
  return { nodes, edges, width, height }
}

type EdgeDef = { from: string; to: string; kind?: 'allow'|'forbid' }

async function layoutGuardrail(guard: { layers: { title: string; note?: string }[] }): Promise<LayoutResult> {
  const pad = 24
  const boxW = 320
  const boxH = 80
  const startX = 40
  const startY = 40
  const nodes = guard.layers.map((l, i) => ({ id: l.title, x: startX + i * (boxW + pad), y: startY, width: boxW, height: boxH }))
  // notes as small badges below title
  const noteNodes = guard.layers
    .map((l, i) => l.note ? ({ id: `${l.title}-note`, x: startX + i * (boxW + pad), y: startY + boxH + 8, width: boxW, height: 20 }) : null)
    .filter(Boolean) as { id: string; x: number; y: number; width: number; height: number }[]
  const allNodes = [...nodes, ...noteNodes]
  const width = (nodes[nodes.length - 1]?.x || startX) + boxW + 40
  const height = startY + boxH + (noteNodes.length ? 40 : 20)
  return { nodes: allNodes, edges: [], width, height }
}

async function layoutMatrix(m: { rows: string[]; cols: string[]; cells: { row: number; col: number; label?: string }[] }): Promise<LayoutResult> {
  const pad = 8
  const cellW = 160
  const cellH = 80
  const startX = 40
  const startY = 60
  const nodes: { id: string; x: number; y: number; width: number; height: number }[] = []
  // headers
  m.cols.forEach((c, j) => nodes.push({ id: c, x: startX + j * (cellW + pad), y: startY - 40, width: cellW, height: 28 }))
  m.rows.forEach((r, i) => nodes.push({ id: r, x: startX - 170, y: startY + i * (cellH + pad), width: 150, height: 28 }))
  // cells
  m.cells.forEach(cell => {
    const id = `r${cell.row}c${cell.col}`
    const x = startX + (cell.col - 1) * (cellW + pad)
    const y = startY + (cell.row - 1) * (cellH + pad)
    nodes.push({ id: cell.label || id, x, y, width: cellW, height: cellH })
  })
  const width = startX + m.cols.length * (cellW + pad) + 40
  const height = startY + m.rows.length * (cellH + pad) + 40
  return { nodes, edges: [], width, height }
}
async function layoutBoard(b: { cols: string[]; items: { col: number; label: string }[] }): Promise<LayoutResult> {
  const pad = 16
  const colW = 300
  const startX = 40
  const startY = 40
  const colNodes = b.cols.map((c, j) => ({ id: c, x: startX + j * (colW + pad), y: startY, width: colW, height: 28 }))
  const items: { id: string; x: number; y: number; width: number; height: number }[] = []
  const counters = new Map<number, number>()
  for (const it of b.items) {
    const idx = (counters.get(it.col) || 0)
    counters.set(it.col, idx + 1)
    const x = startX + (it.col - 1) * (colW + pad)
    const y = startY + 40 + idx * (60 + pad)
    items.push({ id: it.label, x, y, width: colW, height: 60 })
  }
  const nodes = [...colNodes, ...items]
  const width = startX + b.cols.length * (colW + pad) + 40
  const height = Math.max(...nodes.map(n => n.y + n.height), 400)
  return { nodes, edges: [], width, height }
}
async function layoutTimeline(tl: { marks: string[]; paths?: EdgeDef[] }): Promise<LayoutResult> {
  const pad = 80
  const startX = 60
  const y = 100
  const nodes = tl.marks.map((m, i) => ({ id: m, x: startX + i * pad, y: y - 20, width: 80, height: 40 }))
  const edges = (tl.paths || []).map(e => {
    const a = nodes.find(n => n.id === e.from)!
    const b = nodes.find(n => n.id === e.to)!
    const p1 = { x: a.x + a.width / 2, y: y }
    const p2 = { x: b.x + b.width / 2, y: y }
    return { from: e.from, to: e.to, points: [p1, p2] }
  })
  const width = startX + tl.marks.length * pad + 60
  const height = 180
  return { nodes, edges, width, height }
}
async function layoutCycle(cy: { items: string[] }): Promise<LayoutResult> {
  const cx = 320
  const cyy = 220
  const r = 160
  const nodes = cy.items.map((s, i) => {
    const angle = (i / cy.items.length) * Math.PI * 2
    const x = cx + Math.cos(angle) * r
    const y = cyy + Math.sin(angle) * r
    return { id: s, x: x - 60, y: y - 30, width: 120, height: 60 }
  })
  const edges = cy.items.map((_, i) => {
    const a = nodes[i]
    const b = nodes[(i + 1) % nodes.length]
    const p1 = { x: a.x + a.width / 2, y: a.y + a.height / 2 }
    const p2 = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
    return { from: a.id, to: b.id, points: [p1, p2] }
  })
  const width = 640
  const height = 440
  return { nodes, edges, width, height }
}

async function layoutVenn(v: { sets: string[] }): Promise<LayoutResult> {
  const nodes: { id: string; x: number; y: number; width: number; height: number; shape?: 'ellipse'; fill?: string; fillOpacity?: number; stroke?: string }[] = []
  const edges: { from: string; to: string; points: { x: number; y: number }[] }[] = []
  const colors = ['#9bd5ff', '#ffd59b', '#c3f7a3']
  const cx = 300
  const cyy = 200
  const rx = 120
  const ry = 90
  const n = Math.min(3, v.sets.length)
  if (n <= 1) {
    nodes.push({ id: v.sets[0] || 'Set', x: cx - rx, y: cyy - ry, width: rx * 2, height: ry * 2, shape: 'ellipse', fill: colors[0], fillOpacity: 0.6, stroke: '#666' })
  } else if (n === 2) {
    const dx = 100
    const centers = [cx - dx, cx + dx]
    centers.forEach((x, i) => {
      nodes.push({ id: v.sets[i], x: x - rx, y: cyy - ry, width: rx * 2, height: ry * 2, shape: 'ellipse', fill: colors[i], fillOpacity: 0.5, stroke: '#666' })
    })
  } else {
    // 3-set: equilateral triangle arrangement
    const r = 90
    const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6]
    angles.forEach((ang, i) => {
      const x = cx + Math.cos(ang) * r
      const y = cyy + Math.sin(ang) * r
      nodes.push({ id: v.sets[i], x: x - rx, y: y - ry, width: rx * 2, height: ry * 2, shape: 'ellipse', fill: colors[i], fillOpacity: 0.5, stroke: '#666' })
    })
  }
  return { nodes, edges, width: 600, height: 360 }
}
async function layoutSIPOC(s: { supplier: string[]; input: string[]; process: string[]; output: string[]; customer: string[]; notes?: Record<string,string> }): Promise<LayoutResult> {
  const cols = [s.supplier, s.input, s.process, s.output, s.customer]
  const colTitles = ['Supplier', 'Input', 'Process', 'Output', 'Customer']
  const pad = 16
  const colW = 200
  const startX = 40
  const startY = 40
  const nodes: { id: string; x: number; y: number; width: number; height: number }[] = []
  colTitles.forEach((t, j) => nodes.push({ id: t, x: startX + j * (colW + pad), y: startY, width: colW, height: 28 }))
  // notes under titles
  const noteMap = s.notes || {}
  colTitles.forEach((t, j) => {
    const note = noteMap[t.toLowerCase()]
    if (note) nodes.push({ id: note, x: startX + j * (colW + pad), y: startY + 30, width: colW, height: 20 })
  })
  cols.forEach((items, j) => {
    items.forEach((it, i) => {
      nodes.push({ id: it, x: startX + j * (colW + pad), y: startY + 40 + i * (60 + pad), width: colW, height: 60 })
    })
  })
  const width = startX + cols.length * (colW + pad) + 40
  const height = Math.max(...nodes.map(n => n.y + n.height), 400)
  return { nodes, edges: [], width, height }
}
async function layoutSwimlane(sw: { lanes: string[]; items: { lane: number; label: string; time?: number }[]; deps?: EdgeDef[] }): Promise<LayoutResult> {
  const pad = 16
  const laneH = 120
  const itemW = 180
  const startX = 40
  const startY = 40
  const nodes: { id: string; x: number; y: number; width: number; height: number }[] = []
  sw.lanes.forEach((l, i) => nodes.push({ id: l, x: startX, y: startY + i * (laneH + pad), width: 120, height: 28 }))
  const counters = new Map<number, number>()
  for (const it of sw.items) {
    const idx = (counters.get(it.lane) || 0)
    counters.set(it.lane, idx + 1)
    const x = startX + 140 + (it.time != null ? it.time * 80 : idx * (itemW + pad))
    const y = startY + (it.lane - 1) * (laneH + pad)
    nodes.push({ id: it.label, x, y, width: itemW, height: 60 })
  }
  // dependency edges drawn as straight connectors between matching item labels
  const edges = (sw.deps || []).map(e => {
    const a = nodes.find(n => n.id === e.from)
    const b = nodes.find(n => n.id === e.to)
    if (!a || !b) return { from: e.from, to: e.to, points: [] }
    const p1 = { x: a.x + a.width, y: a.y + a.height / 2 }
    const p2 = { x: b.x, y: b.y + b.height / 2 }
    const mid = { x: (p1.x + p2.x) / 2, y: p1.y }
    return { from: e.from, to: e.to, points: [p1, mid, p2] }
  })
  const width = Math.max(...nodes.map(n => n.x + n.width), 800)
  const height = startY + sw.lanes.length * (laneH + pad)
  return { nodes, edges, width, height }
}
async function layoutHierarchy(h: { edges: EdgeDef[] }): Promise<LayoutResult> {
  // Use ELK layered layout: edges define parent->child
  const labels = Array.from(new Set(h.edges.flatMap(e => [e.from, e.to])))
  const children = labels.map(id => ({ id, width: 160, height: 60 }))
  const edges = h.edges.map((e, i) => ({ id: `e${i}`, sources: [e.from], targets: [e.to] }))
  const graph: any = { id: 'hier', children, edges }
  const laid = await elk.layout({ ...graph, layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'DOWN', 'elk.layered.edgeRouting': 'ORTHOGONAL' } })
  const nodes = (laid.children || []).map((n: any) => ({ id: n.id, x: n.x, y: n.y, width: n.width, height: n.height }))
  const eds = (laid.edges || []).map((e: any) => {
    const sec = e.sections && e.sections[0]
    const seq = sec ? [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint].filter(Boolean) : []
    const pts = seq.map((p: any) => ({ x: p.x, y: p.y }))
    return { from: e.sources[0], to: e.targets[0], points: pts }
  })
  const width = laid.width || Math.max(...nodes.map(n => n.x + n.width), 800)
  const height = laid.height || Math.max(...nodes.map(n => n.y + n.height), 600)
  return { nodes, edges: eds, width, height }
}
async function layoutFunnel(fn: { stages: { label: string; value?: number }[] }): Promise<LayoutResult> {
  const startX = 80
  const startY = 40
  const topW = 400
  const minW = 120
  const h = 80
  const pad = 16
  const n = fn.stages.length
  const nodes = fn.stages.map((s, i) => {
    const t = startX + i * (h + pad)
    const w = topW - ((topW - minW) * i) / Math.max(1, n - 1)
    return { id: s.label + (s.value != null ? ` (${s.value})` : ''), x: startX, y: startY + i * (h + pad), width: w, height: h }
  })
  const width = startX + topW + 60
  const height = startY + n * (h + pad) + 40
  return { nodes, edges: [], width, height }
}
async function layoutJourney(sw: { lanes: string[]; items: { lane: number; label: string; time?: number }[] }): Promise<LayoutResult> {
  // reuse swimlane layout without deps
  return layoutSwimlane({ lanes: sw.lanes, items: sw.items })
}
async function layoutBlueprint(bp: { lanes: string[]; items: { lane: number; label: string; time?: number }[]; deps?: EdgeDef[] }): Promise<LayoutResult> {
  // reuse swimlane layout with deps
  return layoutSwimlane({ lanes: bp.lanes, items: bp.items, deps: bp.deps })
}
async function layoutOKR(ok: { edges: EdgeDef[] }): Promise<LayoutResult> {
  return layoutHierarchy({ edges: ok.edges })
}
async function layoutDecision(dec: { edges: EdgeDef[] }): Promise<LayoutResult> {
  // left-right by conditions is more complex; start with top-down hierarchy
  return layoutHierarchy({ edges: dec.edges })
}
async function layoutQuadrant(q: { axes: { x: string; y: string }; points: { x: number; y: number; label: string }[] }): Promise<LayoutResult> {
  const startX = 80
  const startY = 60
  const W = 400
  const H = 400
  const nodes: { id: string; x: number; y: number; width: number; height: number }[] = []
  // axes labels
  nodes.push({ id: q.axes.x, x: startX + W / 2 - 60, y: startY + H + 10, width: 120, height: 28 })
  nodes.push({ id: q.axes.y, x: startX - 70, y: startY + H / 2 - 14, width: 120, height: 28 })
  // points as small boxes
  q.points.forEach(pt => {
    const x = startX + Math.max(0, Math.min(1, pt.x)) * W
    const y = startY + (1 - Math.max(0, Math.min(1, pt.y))) * H
    nodes.push({ id: pt.label, x: x - 40, y: y - 14, width: 80, height: 28 })
  })
  return { nodes, edges: [], width: startX + W + 120, height: startY + H + 80 }
}
async function layoutHeatmap(hm: { rows: string[]; cols: string[]; cells: { row: number; col: number; label?: string; level?: number }[] }): Promise<LayoutResult> {
  const pad = 8
  const cell = 48
  const startX = 160
  const startY = 80
  const fbNodes: { id: string; x: number; y: number; width: number; height: number }[] = []
  // headers
  hm.cols.forEach((c, j) => nodes.push({ id: c, x: startX + j * (cell + pad), y: startY - 40, width: cell, height: 28 }))
  hm.rows.forEach((r, i) => nodes.push({ id: r, x: startX - 140, y: startY + i * (cell + pad), width: 120, height: 28 }))
  // cells colored by level
  hm.cells.forEach(cl => {
    const x = startX + (cl.col - 1) * (cell + pad)
    const y = startY + (cl.row - 1) * (cell + pad)
    const level = Math.max(1, Math.min(5, cl.level ?? 3))
    const color = ['#e8f5e9', '#c8e6c9', '#fff9c4', '#ffe0b2', '#ffcdd2'][level - 1]
    nodes.push({ id: cl.label || '', x, y, width: cell, height: cell, shape: 'rect', fill: color, fillOpacity: 1, stroke: '#999' })
  })
  const width = startX + hm.cols.length * (cell + pad) + 80
  const height = startY + hm.rows.length * (cell + pad) + 80
  return { nodes, edges: [], width, height }
}
async function layoutFishbone(fb: { main: string; bones: { label: string; items?: string[] }[]; annotations?: { at: string; text: string }[] }): Promise<LayoutResult> {
  const startX = 80, startY = 220
  const fbNodes: { id: string; x: number; y: number; width: number; height: number; shape?: 'rect' }[] = []
  // main block
  fbNodes.push({ id: fb.main, x: startX, y: startY - 30, width: 160, height: 60 })
  // bones at angles
  const angleY: number[] = [ -100, -40, 40, 100 ]
  fb.bones.forEach((b: { label: string; items?: string[] }, i: number) => {
    const y = startY + angleY[i % angleY.length]
    fbNodes.push({ id: b.label, x: startX + 220, y: y - 20, width: 140, height: 40 })
    (b.items || []).forEach((it: string, k: number) => {
      fbNodes.push({ id: it, x: startX + 380 + k * 140, y: y - 14, width: 120, height: 28 })
    })
  })
  // edges: main -> bone label -> items (straight segments)
  const fbEdges: { from: string; to: string; points: { x: number; y: number }[] }[] = []
  fb.bones.forEach((b: { label: string; items?: string[] }, i: number) => {
    const boneNode = fbNodes.find((n: any) => n.id === b.label)
    const mainNode = fbNodes.find((n: any) => n.id === fb.main)
    if (mainNode && boneNode) {
      fbEdges.push({ from: fb.main, to: b.label, points: [
        { x: mainNode.x + mainNode.width, y: mainNode.y + mainNode.height / 2 },
        { x: boneNode.x, y: boneNode.y + boneNode.height / 2 }
      ]})
    }
    (b.items || []).forEach((it: string) => {
      const itemNode = fbNodes.find((n: any) => n.id === it)
      if (boneNode && itemNode) {
        fbEdges.push({ from: b.label, to: it, points: [
          { x: boneNode.x + boneNode.width, y: boneNode.y + boneNode.height / 2 },
          { x: itemNode.x, y: itemNode.y + itemNode.height / 2 }
        ]})
      }
    })
  })
  // annotations as sticky notes near target
  (fb.annotations || []).forEach(a => {
    const target = fbNodes.find(n => n.id === a.at)
    if (target) {
      const ax = (target.x + target.width) + 12
      const ay = target.y - 34
      fbNodes.push({ id: a.text, x: ax, y: ay, width: 160, height: 28, shape: 'rect' })
    }
  })
  const width = Math.max(...fbNodes.map((n: any) => n.x + n.width), 800)
  const height = startY + 160
  return { nodes: fbNodes, edges: fbEdges, width, height }
}

async function layoutSankey(sk: { edges: { from: string; to: string; weight: number }[]; annotations?: { at: string; text: string }[] }): Promise<LayoutResult> {
  // place nodes in columns by first appearance
  const labels = Array.from(new Set(sk.edges.flatMap(e => [e.from, e.to])))
  const colMap = new Map<string, number>()
  sk.edges.forEach((e, i) => {
    if (!colMap.has(e.from)) colMap.set(e.from, colMap.size)
    if (!colMap.has(e.to)) colMap.set(e.to, colMap.size)
  })
  const nodes: any[] = labels.map((id, idx) => ({ id, x: 80 + (colMap.get(id)!)*220, y: 100 + (idx%4)*100, width: 140, height: 40 }))
  const edges = sk.edges.map(e => {
    const a = nodes.find((n: any) => n.id === e.from)
    const b = nodes.find((n: any) => n.id === e.to)
    const p1 = { x: a.x + a.width, y: a.y + a.height / 2 }
    const p2 = { x: b.x, y: b.y + b.height / 2 }
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
    return { from: e.from, to: e.to, points: [p1, mid, p2], weight: e.weight }
  })
  // annotations for sankey
  (sk.annotations || []).forEach(a => {
    const target = nodes.find(n => n.id === a.at)
    if (target) {
      nodes.push({ id: a.text, x: target.x + target.width + 12, y: target.y - 34, width: 160, height: 28 })
    }
  })
  const width = Math.max(...nodes.map((n: any) => n.x + n.width), 800)
  const height = Math.max(...nodes.map((n: any) => n.y + n.height), 600)
  return { nodes, edges, width, height }
}
