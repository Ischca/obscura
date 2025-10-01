import React from 'react'
import { DiagramViewer } from '../src/DiagramViewer'
// @ts-ignore
import matrixRACI from '../../../examples/matrix-raci.slide?raw'

export default { title: 'Diagrams/Matrix', component: DiagramViewer }

export const RACI = (args: { dsl: string }) => <DiagramViewer dsl={args.dsl} />
RACI.args = { dsl: matrixRACI }

