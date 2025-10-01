import React from 'react'
import { DiagramViewer } from '../src/DiagramViewer'
// Vite: import raw text with ?raw
// Pre-build workspace packages with `pnpm -r build` before running storybook

// Import some defaults
// @ts-ignore
import basic from '../../../examples/basic.slide?raw'
// @ts-ignore
import boundary from '../../../examples/boundary-basic.slide?raw'
// @ts-ignore
import venn2 from '../../../examples/venn-2set.slide?raw'

export default {
  title: 'Diagrams/Examples',
  component: DiagramViewer,
  argTypes: {
    dsl: { control: 'text' },
    width: { control: { type: 'range', min: 360, max: 1200, step: 20 } },
    grid: { control: 'boolean' },
  },
}

export const Basic = (args: { dsl: string; width: number; grid: boolean }) => <DiagramViewer dsl={args.dsl} width={args.width} grid={args.grid} />
Basic.args = { dsl: basic, width: 640, grid: false }

export const Boundary = (args: { dsl: string; width: number; grid: boolean }) => <DiagramViewer dsl={args.dsl} width={args.width} grid={args.grid} />
Boundary.args = { dsl: boundary, width: 640, grid: false }

export const Venn = (args: { dsl: string; width: number; grid: boolean }) => <DiagramViewer dsl={args.dsl} width={args.width} grid={args.grid} />
Venn.args = { dsl: venn2, width: 640, grid: false }

// A chooser story
const modules = import.meta.glob('../../../examples/*.slide', { as: 'raw', eager: true }) as Record<string, string>
const entries = Object.entries(modules).map(([k, v]) => ({ id: k.split('/').pop()!.replace('.slide',''), dsl: v }))

export const All = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 24, padding: 16 }}>
    {entries.map(e => (
      <div key={e.id} style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#555', fontSize: 14 }}>{e.id}</div>
        <div style={{ padding: 12 }}>
          <DiagramViewer dsl={e.dsl} />
        </div>
      </div>
    ))}
  </div>
)
