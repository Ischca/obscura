#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parse } from '@obscura/parser'
import { layout } from '@obscura/layout-elk'
import { renderSVG } from '@obscura/render-svg'

async function main() {
  const args = process.argv.slice(2)
  if (args[0] !== 'build' || !args[1]) {
    console.error('Usage: slide-diagram-cli build <input.slide> -o <output.svg>')
    process.exit(1)
  }
  const inputPath = resolve(process.cwd(), args[1])
  const outIdx = args.indexOf('-o')
  const outputPath = outIdx !== -1 ? resolve(process.cwd(), args[outIdx + 1]) : resolve(process.cwd(), 'out.svg')
  const text = readFileSync(inputPath, 'utf8')
  const ast = parse(text)
  const g = await (layout as any)(ast)
  const svg = renderSVG(g)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, svg, 'utf8')
  console.log('Wrote', outputPath)
}

main()
