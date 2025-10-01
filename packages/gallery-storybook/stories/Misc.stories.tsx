import React from 'react'
import { DiagramViewer } from '../src/DiagramViewer'
// @ts-ignore
import venn2 from '../../../examples/venn-2set.slide?raw'
// @ts-ignore
import timeline from '../../../examples/timeline-roadmap.slide?raw'
// @ts-ignore
import funnel from '../../../examples/funnel-basic.slide?raw'

export default { title: 'Diagrams/Misc', component: DiagramViewer }

export const Venn = (args: { dsl: string }) => <DiagramViewer dsl={args.dsl} />
Venn.args = { dsl: venn2 }

export const Timeline = (args: { dsl: string }) => <DiagramViewer dsl={args.dsl} />
Timeline.args = { dsl: timeline }

export const Funnel = (args: { dsl: string }) => <DiagramViewer dsl={args.dsl} />
Funnel.args = { dsl: funnel }

