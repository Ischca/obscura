#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { parse } from '../packages/parser/dist/index.js'
import { layout } from '../packages/layout-elk/dist/index.js'
import { renderSVG } from '../packages/render-svg/dist/index.js'

const examplesDir = resolve(process.cwd(), 'examples')
const outDir = resolve(process.cwd(), 'gallery/assets')
mkdirSync(outDir, { recursive: true })
const slides = readdirSync(examplesDir).filter(f => f.endsWith('.slide'))
const entries = []
for (const f of slides) {
  const id = basename(f, '.slide')
  const src = readFileSync(resolve(examplesDir, f), 'utf8')
  const ast = parse(src)
  const g = await layout(ast)
  const svg = renderSVG(g)
  writeFileSync(resolve(outDir, id + '.svg'), svg, 'utf8')
  entries.push({ id, title: ast.title || id })
}
writeFileSync(resolve(process.cwd(), 'gallery/index.json'), JSON.stringify(entries, null, 2))
console.log('Rendered', entries.length, 'examples to', outDir)
