import React from 'react'
import { DiagramViewer } from '../src/DiagramViewer'
// @ts-ignore
import boundaryBasic from '../../../examples/boundary-basic.slide?raw'

export default { title: 'Diagrams/Boundary', component: DiagramViewer }

export const Basic = (args: { dsl: string }) => <DiagramViewer dsl={args.dsl} />
Basic.args = { dsl: boundaryBasic }

