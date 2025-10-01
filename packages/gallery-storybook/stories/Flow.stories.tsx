import React from 'react'
import { DiagramViewer } from '../src/DiagramViewer'
// @ts-ignore
import flowBranch from '../../../examples/flow-branch.slide?raw'
// @ts-ignore
import flowBack from '../../../examples/flow-backedge.slide?raw'

export default { title: 'Diagrams/Flow', component: DiagramViewer }

export const Branch = (args: { dsl: string }) => <DiagramViewer dsl={args.dsl} />
Branch.args = { dsl: flowBranch }

export const BackEdge = (args: { dsl: string }) => <DiagramViewer dsl={args.dsl} />
BackEdge.args = { dsl: flowBack }

