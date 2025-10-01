// Core types for SlideDiagram Kit
export type DiagramType = 'flow' | 'boundary' | 'guardrail' | 'matrix' | 'board' | 'timeline' | 'cycle' | 'venn' | 'sipoc' | 'swimlane' | 'hierarchy' | 'funnel' | 'journey' | 'blueprint' | 'okr' | 'decision' | 'quadrant' | 'heatmap' | 'fishbone' | 'sankey'

export interface Diagram {
  type: DiagramType
  title?: string
  theme?: string
  annotations?: Annotation[]
}

export interface NodeDef { id: string; label?: string }
export interface EdgeDef { from: string; to: string; kind?: 'allow' | 'forbid' }

export interface Flow extends Diagram {
  lanes: { name: string; nodes: NodeDef[] }[]
  paths: EdgeDef[]
  forbids?: EdgeDef[]
}

export interface Boundary extends Diagram {
  internal: NodeDef[]
  external?: NodeDef[]
  allows: EdgeDef[]
  forbids?: EdgeDef[]
}

export interface Guardrail extends Diagram {
  layers: { title: string; note?: string }[]
}

export interface Matrix extends Diagram {
  rows: string[]
  cols: string[]
  cells: { row: number; col: number; label?: string }[]
}

export interface Board extends Diagram {
  cols: string[]
  items: { col: number; label: string }[]
}

export interface Timeline extends Diagram {
  marks: string[]
  paths?: EdgeDef[]
}

export interface Cycle extends Diagram {
  items: string[]
}

export interface Venn extends Diagram {
  sets: string[]
}

export interface SIPOC extends Diagram {
  supplier: string[]
  input: string[]
  process: string[]
  output: string[]
  customer: string[]
  notes?: { supplier?: string; input?: string; process?: string; output?: string; customer?: string }
}

export interface Swimlane extends Diagram {
  lanes: string[]
  items: { lane: number; label: string; time?: number }[]
  deps?: EdgeDef[]
}

export interface Hierarchy extends Diagram {
  root?: string
  edges: EdgeDef[]
}

export interface Funnel extends Diagram {
  stages: { label: string; value?: number }[]
}

export interface Journey extends Diagram {
  lanes: string[]
  items: { lane: number; label: string; time?: number }[]
}

export interface Blueprint extends Diagram {
  lanes: string[]
  items: { lane: number; label: string; time?: number }[]
  deps?: EdgeDef[]
}

export interface OKR extends Diagram {
  edges: EdgeDef[]
}

export interface Decision extends Diagram {
  edges: EdgeDef[]
}

export interface Quadrant extends Diagram {
  axes: { x: string; y: string }
  points: { x: number; y: number; label: string }[]
}

export interface Heatmap extends Diagram {
  rows: string[]
  cols: string[]
  cells: { row: number; col: number; label?: string; level?: number }[]
}

export interface Fishbone extends Diagram {
  main: string
  bones: { label: string; items?: string[] }[]
}

export interface Sankey extends Diagram {
  edges: { from: string; to: string; weight: number }[]
}

export interface Annotation {
  at: string
  text: string
  dx?: number
  dy?: number
}
