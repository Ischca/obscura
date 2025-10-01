import React from 'react'
import { DiagramViewer } from '../src/DiagramViewer'

// Helper to build cards
function Card({ title, dsl }: { title: string; dsl: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', color: '#555', fontSize: 14 }}>{title}</div>
      <div style={{ padding: 12 }}>
        <DiagramViewer dsl={dsl} />
      </div>
    </div>
  )
}

// Import DSLs
// @ts-ignore
import flowBranch from '../../../examples/flow-branch.slide?raw'
// @ts-ignore
import flowBack from '../../../examples/flow-backedge.slide?raw'
// @ts-ignore
import boundaryBasic from '../../../examples/boundary-basic.slide?raw'
// @ts-ignore
import matrixRACI from '../../../examples/matrix-raci.slide?raw'
// @ts-ignore
import venn2 from '../../../examples/venn-2set.slide?raw'
// @ts-ignore
import funnel from '../../../examples/funnel-basic.slide?raw'

export default { title: 'Diagrams/Compare' }

export const TwoUp_Flow = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(440px, 1fr))', gap: 24, padding: 16 }}>
    <Card title="Flow: Branch" dsl={flowBranch} />
    <Card title="Flow: Back Edge" dsl={flowBack} />
  </div>
)

export const ThreeUp_Mixed = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(360px, 1fr))', gap: 24, padding: 16 }}>
    <Card title="Boundary" dsl={boundaryBasic} />
    <Card title="Matrix (RACI)" dsl={matrixRACI} />
    <Card title="Venn" dsl={venn2} />
  </div>
)

export const TwoUp_Misc = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(440px, 1fr))', gap: 24, padding: 16 }}>
    <Card title="Funnel" dsl={funnel} />
    <Card title="Boundary" dsl={boundaryBasic} />
  </div>
)

