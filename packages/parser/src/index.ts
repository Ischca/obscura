import type { Diagram, Flow, Boundary, Guardrail, Matrix, Board, Timeline, Cycle, Venn, SIPOC, Swimlane, Hierarchy, Funnel, Journey, Blueprint, OKR, Decision, Quadrant, Heatmap, Fishbone, Sankey, Annotation, EdgeDef, NodeDef } from '@slide-diagram/core'

// Minimal parser for MVP:
// - Detects diagram type from the first word
// - For `flow`, supports lines starting with `path:` to define edges like: A -> B -> C
// - Forbids optionally via `forbid:` lines with `-X->`
export function parse(input: string): Diagram {
  const lines = input.split(/\n/)
  const first = (lines[0] || '').trim()
  const kind = first.split(/\s+/)[0]

  if (kind === 'flow') return parseFlow(lines)
  if (kind === 'boundary') return parseBoundary(lines)
  if (kind === 'guardrail') return parseGuardrail(lines)
  if (kind === 'matrix') return parseMatrix(lines)
  if (kind === 'board') return parseBoard(lines)
  if (kind === 'timeline') return parseTimeline(lines)
  if (kind === 'cycle') return parseCycle(lines)
  if (kind === 'venn') return parseVenn(lines)
  if (kind === 'sipoc') return parseSIPOC(lines)
  if (kind === 'swimlane') return parseSwimlane(lines)
  if (kind === 'hierarchy') return parseHierarchy(lines)
  if (kind === 'funnel') return parseFunnel(lines)
  if (kind === 'journey') return parseJourney(lines)
  if (kind === 'blueprint') return parseBlueprint(lines)
  if (kind === 'okr') return parseOKR(lines)
  if (kind === 'decision') return parseDecision(lines)
  if (kind === 'quadrant') return parseQuadrant(lines)
  if (kind === 'heatmap') return parseHeatmap(lines)
  if (kind === 'fishbone') return parseFishbone(lines)
  if (kind === 'sankey') return parseSankey(lines)
  throw new Error('Unknown diagram type. First word must be flow|boundary|guardrail|matrix|board|timeline|cycle|venn|sipoc|swimlane|hierarchy|funnel')
}

function parseFlow(lines: string[]): Flow {
  const nodes = new Map<string, NodeDef>()
  const paths: EdgeDef[] = []
  const forbids: EdgeDef[] = []

  // helper to normalize id tokens (strip quotes/whitespace)
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('path:')) {
      const rhs = line.slice('path:'.length)
      const parts = rhs.split('->').map(norm).filter(Boolean)
      // add nodes, then edges in sequence
      for (const id of parts) if (!nodes.has(id)) nodes.set(id, { id })
      for (let i = 0; i < parts.length - 1; i++) {
        paths.push({ from: parts[i], to: parts[i + 1] })
      }
    } else if (line.startsWith('forbid:')) {
      const rhs = line.slice('forbid:'.length)
      const parts = rhs.split('-X->').map(norm).filter(Boolean)
      if (parts.length === 2) {
        for (const id of parts) if (!nodes.has(id)) nodes.set(id, { id })
        forbids.push({ from: parts[0], to: parts[1], kind: 'forbid' })
      }
    }
  }

  return {
    type: 'flow',
    lanes: [],
    paths,
    forbids: forbids.length ? forbids : undefined,
  }
}

function parseBoundary(lines: string[]): Boundary {
  const internal: NodeDef[] = []
  const external: NodeDef[] = []
  const allows: EdgeDef[] = []
  const forbids: EdgeDef[] = []

  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  const parseNodes = (block: string): NodeDef[] => {
    const body = block.replace(/[{}]/g, ' ').trim()
    const tokens = body.split(/\s+/).filter(Boolean)
    const out: NodeDef[] = []
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      // support id:"label" pattern
      if (t.includes(':')) {
        const [id, rest] = t.split(':')
        const label = norm(rest || id)
        out.push({ id: norm(id), label })
      } else {
        out.push({ id: norm(t) })
      }
    }
    return out
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('internal')) {
      const block = line.slice(line.indexOf('{'))
      internal.push(...parseNodes(block))
    } else if (line.startsWith('external')) {
      const block = line.slice(line.indexOf('{'))
      external.push(...parseNodes(block))
    } else if (line.startsWith('allow:')) {
      const rhs = line.slice('allow:'.length)
      const parts = rhs.split(',').map(p => p.trim()).filter(Boolean)
      for (const p of parts) {
        const [a, b] = p.split('->').map(norm)
        if (a && b) allows.push({ from: a, to: b, kind: 'allow' })
      }
    } else if (line.startsWith('forbid:')) {
      const rhs = line.slice('forbid:'.length)
      const parts = rhs.split(',').map(p => p.trim()).filter(Boolean)
      for (const p of parts) {
        const [a, b] = p.split('-X->').map(norm)
        if (a && b) forbids.push({ from: a, to: b, kind: 'forbid' })
      }
    }
  }

  return { type: 'boundary', internal, external, allows, forbids: forbids.length ? forbids : undefined }
}

function parseGuardrail(lines: string[]): Guardrail {
  const layers: { title: string; note?: string }[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('layer:')) {
      // formats: layer: 権限("サジェストのみ") or layer: 権限("...") or layer: 権限
      const rhs = line.slice('layer:'.length).trim()
      const m = rhs.match(/^(.*?)\((.*)\)$/)
      if (m) {
        const title = norm(m[1])
        const note = norm(m[2])
        layers.push({ title, note })
      } else {
        layers.push({ title: norm(rhs) })
      }
    }
  }
  return { type: 'guardrail', layers }
}

function parseMatrix(lines: string[]): Matrix {
  const rows: string[] = []
  const cols: string[] = []
  const cells: { row: number; col: number; label?: string }[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('rows:')) {
      const rhs = line.slice('rows:'.length)
      rows.push(...rhs.split(',').map(norm).filter(Boolean))
    } else if (line.startsWith('cols:')) {
      const rhs = line.slice('cols:'.length)
      cols.push(...rhs.split(',').map(norm).filter(Boolean))
    } else if (line.startsWith('cell:')) {
      // cell: row=1, col=2, label="担当者A"
      const rhs = line.slice('cell:'.length)
      const parts = rhs.split(',').map(p => p.trim())
      const r = parseInt(parts.find(p => p.startsWith('row='))?.split('=')[1] || '0', 10)
      const c = parseInt(parts.find(p => p.startsWith('col='))?.split('=')[1] || '0', 10)
      const lbl = parts.find(p => p.startsWith('label='))?.split('=')[1]
      cells.push({ row: r, col: c, label: lbl ? norm(lbl) : undefined })
    }
  }
  return { type: 'matrix', rows, cols, cells }
}

function parseBoard(lines: string[]): Board {
  const cols: string[] = []
  const items: { col: number; label: string }[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('cols:')) {
      const rhs = line.slice('cols:'.length)
      cols.push(...rhs.split(',').map(norm).filter(Boolean))
    } else if (line.startsWith('item:')) {
      // item: col=2, label="Don't do X"
      const rhs = line.slice('item:'.length)
      const parts = rhs.split(',').map(p => p.trim())
      const c = parseInt(parts.find(p => p.startsWith('col='))?.split('=')[1] || '0', 10)
      const lbl = parts.find(p => p.startsWith('label='))?.split('=')[1]
      if (c) items.push({ col: c, label: lbl ? norm(lbl) : '' })
    }
  }
  return { type: 'board', cols, items }
}

function parseTimeline(lines: string[]): Timeline {
  const marks: string[] = []
  const paths: EdgeDef[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('marks:')) {
      const rhs = line.slice('marks:'.length)
      marks.push(...rhs.split(',').map(norm).filter(Boolean))
    } else if (line.startsWith('path:')) {
      const rhs = line.slice('path:'.length)
      const parts = rhs.split('->').map(norm).filter(Boolean)
      for (let i = 0; i < parts.length - 1; i++) paths.push({ from: parts[i], to: parts[i + 1] })
    }
  }
  return { type: 'timeline', marks, paths: paths.length ? paths : undefined }
}

function parseCycle(lines: string[]): Cycle {
  const items: string[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('items:')) {
      const rhs = line.slice('items:'.length)
      items.push(...rhs.split(',').map(norm).filter(Boolean))
    }
  }
  return { type: 'cycle', items }
}

function parseVenn(lines: string[]): Venn {
  const sets: string[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('sets:')) {
      const rhs = line.slice('sets:'.length)
      sets.push(...rhs.split(',').map(norm).filter(Boolean))
    }
  }
  return { type: 'venn', sets }
}

function parseSIPOC(lines: string[]): SIPOC {
  const s: string[] = [], i: string[] = [], p: string[] = [], o: string[] = [], c: string[] = []
  const notes: Record<string, string> = {}
  const norm = (x: string) => x.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('supplier:')) s.push(...line.slice('supplier:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('input:')) i.push(...line.slice('input:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('process:')) p.push(...line.slice('process:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('output:')) o.push(...line.slice('output:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('customer:')) c.push(...line.slice('customer:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('note:')) {
      // note: process="主要工程"
      const rhs = line.slice('note:'.length)
      const [k, v] = rhs.split('=').map(s => s.trim())
      if (k && v) notes[norm(k)] = norm(v)
    }
  }
  return { type: 'sipoc', supplier: s, input: i, process: p, output: o, customer: c, notes }
}

function parseSwimlane(lines: string[]): Swimlane {
  const lanes: string[] = []
  const items: { lane: number; label: string; time?: number }[] = []
  const deps: EdgeDef[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('lanes:')) lanes.push(...line.slice('lanes:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('item:')) {
      const rhs = line.slice('item:'.length)
      const parts = rhs.split(',').map(p => p.trim())
      const l = parseInt(parts.find(p => p.startsWith('lane='))?.split('=')[1] || '0', 10)
      const lbl = parts.find(p => p.startsWith('label='))?.split('=')[1]
      const tStr = parts.find(p => p.startsWith('time='))?.split('=')[1]
      const time = tStr ? parseFloat(tStr) : undefined
      if (l && lbl) items.push({ lane: l, label: norm(lbl), time })
    } else if (line.startsWith('dep:')) {
      const rhs = line.slice('dep:'.length)
      const [a, b] = rhs.split('->').map(norm)
      if (a && b) deps.push({ from: a, to: b })
    }
  }
  return { type: 'swimlane', lanes, items, deps }
}

function parseHierarchy(lines: string[]): Hierarchy {
  const edges: EdgeDef[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('edge:')) {
      const rhs = line.slice('edge:'.length)
      const [a, b] = rhs.split('->').map(norm)
      if (a && b) edges.push({ from: a, to: b })
    }
  }
  return { type: 'hierarchy', edges }
}

function parseFunnel(lines: string[]): Funnel {
  const stages: { label: string; value?: number }[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('stage:')) {
      const rhs = line.slice('stage:'.length)
      const parts = rhs.split(',').map(p => p.trim())
      const lbl = parts.find(p => p.startsWith('label='))?.split('=')[1]
      const valStr = parts.find(p => p.startsWith('value='))?.split('=')[1]
      const value = valStr ? parseFloat(valStr) : undefined
      if (lbl) stages.push({ label: norm(lbl), value })
    }
  }
  return { type: 'funnel', stages }
}

function parseJourney(lines: string[]): Journey {
  const lanes: string[] = []
  const items: { lane: number; label: string; time?: number }[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('lanes:')) lanes.push(...line.slice('lanes:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('item:')) {
      const rhs = line.slice('item:'.length)
      const parts = rhs.split(',').map(p => p.trim())
      const l = parseInt(parts.find(p => p.startsWith('lane='))?.split('=')[1] || '0', 10)
      const lbl = parts.find(p => p.startsWith('label='))?.split('=')[1]
      const tStr = parts.find(p => p.startsWith('time='))?.split('=')[1]
      const time = tStr ? parseFloat(tStr) : undefined
      if (l && lbl) items.push({ lane: l, label: norm(lbl), time })
    }
  }
  return { type: 'journey', lanes, items }
}

function parseBlueprint(lines: string[]): Blueprint {
  const lanes: string[] = []
  const items: { lane: number; label: string; time?: number }[] = []
  const deps: EdgeDef[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('lanes:')) lanes.push(...line.slice('lanes:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('item:')) {
      const rhs = line.slice('item:'.length)
      const parts = rhs.split(',').map(p => p.trim())
      const l = parseInt(parts.find(p => p.startsWith('lane='))?.split('=')[1] || '0', 10)
      const lbl = parts.find(p => p.startsWith('label='))?.split('=')[1]
      const tStr = parts.find(p => p.startsWith('time='))?.split('=')[1]
      const time = tStr ? parseFloat(tStr) : undefined
      if (l && lbl) items.push({ lane: l, label: norm(lbl), time })
    } else if (line.startsWith('dep:')) {
      const rhs = line.slice('dep:'.length)
      const [a, b] = rhs.split('->').map(norm)
      if (a && b) deps.push({ from: a, to: b })
    }
  }
  return { type: 'blueprint', lanes, items, deps }
}

function parseOKR(lines: string[]): OKR {
  const edges: EdgeDef[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('edge:')) {
      const rhs = line.slice('edge:'.length)
      const [a, b] = rhs.split('->').map(norm)
      if (a && b) edges.push({ from: a, to: b })
    }
  }
  return { type: 'okr', edges }
}

function parseDecision(lines: string[]): Decision {
  const edges: EdgeDef[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('edge:')) {
      const rhs = line.slice('edge:'.length)
      const [a, b] = rhs.split('->').map(norm)
      if (a && b) edges.push({ from: a, to: b })
    }
  }
  return { type: 'decision', edges }
}

function parseQuadrant(lines: string[]): Quadrant {
  let axesX = 'Impact', axesY = 'Effort'
  const points: { x: number; y: number; label: string }[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('axes:')) {
      const rhs = line.slice('axes:'.length)
      const parts = rhs.split(',').map(norm)
      axesX = parts[0] || axesX
      axesY = parts[1] || axesY
    } else if (line.startsWith('point:')) {
      const rhs = line.slice('point:'.length)
      const parts = rhs.split(',').map(p => p.trim())
      const x = parseFloat(parts.find(p => p.startsWith('x='))?.split('=')[1] || '0')
      const y = parseFloat(parts.find(p => p.startsWith('y='))?.split('=')[1] || '0')
      const lbl = parts.find(p => p.startsWith('label='))?.split('=')[1]
      if (lbl != null) points.push({ x, y, label: norm(lbl) })
    }
  }
  return { type: 'quadrant', axes: { x: axesX, y: axesY }, points }
}

function parseHeatmap(lines: string[]): Heatmap {
  const rows: string[] = []
  const cols: string[] = []
  const cells: { row: number; col: number; label?: string; level?: number }[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('rows:')) rows.push(...line.slice('rows:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('cols:')) cols.push(...line.slice('cols:'.length).split(',').map(norm).filter(Boolean))
    else if (line.startsWith('cell:')) {
      const rhs = line.slice('cell:'.length)
      const parts = rhs.split(',').map(p => p.trim())
      const r = parseInt(parts.find(p => p.startsWith('row='))?.split('=')[1] || '0', 10)
      const c = parseInt(parts.find(p => p.startsWith('col='))?.split('=')[1] || '0', 10)
      const lbl = parts.find(p => p.startsWith('label='))?.split('=')[1]
      const levelStr = parts.find(p => p.startsWith('level='))?.split('=')[1]
      const level = levelStr ? parseInt(levelStr, 10) : undefined
      cells.push({ row: r, col: c, label: lbl ? norm(lbl) : undefined, level })
    }
  }
  return { type: 'heatmap', rows, cols, cells }
}

function parseFishbone(lines: string[]): Fishbone {
  let main = 'Main'
  const bones: { label: string; items?: string[] }[] = []
  const annotations: Annotation[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('main:')) main = norm(line.slice('main:'.length))
    else if (line.startsWith('bone:')) {
      const rhs = line.slice('bone:'.length)
      const [label, rest] = rhs.split('{')
      const items = rest ? rest.replace(/[{}]/g, '').split(',').map(norm).filter(Boolean) : undefined
      bones.push({ label: norm(label), items })
    } else if (line.startsWith('note:')) {
      const rhs = line.slice('note:'.length)
      const [atPart, textPart] = rhs.split('text=')
      const at = norm(atPart.replace('at=', ''))
      const text = norm(textPart || '')
      annotations.push({ at, text })
    }
  }
  return { type: 'fishbone', main, bones, annotations }
}

function parseSankey(lines: string[]): Sankey {
  const edges: { from: string; to: string; weight: number }[] = []
  const annotations: Annotation[] = []
  const norm = (s: string) => s.trim().replace(/^"|"$/g, '')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    if (line.startsWith('edge:')) {
      const rhs = line.slice('edge:'.length)
      const parts = rhs.split(',').map(p => p.trim())
      const [a, b] = parts[0].split('->').map(norm)
      const w = parseFloat(parts.find(p => p.startsWith('weight='))?.split('=')[1] || '1')
      edges.push({ from: a, to: b, weight: w })
    } else if (line.startsWith('note:')) {
      const rhs = line.slice('note:'.length)
      const [atPart, textPart] = rhs.split('text=')
      const at = norm(atPart.replace('at=', ''))
      const text = norm(textPart || '')
      annotations.push({ at, text })
    }
  }
  return { type: 'sankey', edges, annotations }
}
