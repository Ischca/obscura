#!/usr/bin/env node
import http from 'node:http'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, extname, basename } from 'node:path'
import { parse } from '../packages/parser/dist/index.js'
import { layout } from '../packages/layout-elk/dist/index.js'
import { renderSVG } from '../packages/render-svg/dist/index.js'

const examplesDir = resolve(process.cwd(), 'examples')
const port = 5173

function listSlides() {
  return readdirSync(examplesDir).filter(f => f.endsWith('.slide')).map(f => basename(f, '.slide'))
}

async function render(id) {
  const src = readFileSync(resolve(examplesDir, id + '.slide'), 'utf8')
  const ast = parse(src)
  const g = await layout(ast)
  return renderSVG(g)
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const items = listSlides().map(id => `<li><a href="/v/${id}" target="viewer">${id}</a></li>`).join('')
    const html = `<!doctype html><meta charset=utf-8><title>Gallery Live</title>
<style>body{display:flex;gap:16px;font-family:system-ui} ul{min-width:260px} iframe{flex:1;height:90vh;border:1px solid #ddd;border-radius:8px;background:#fff}</style>
<body><aside><h1>Slides</h1><ul>${items}</ul></aside><iframe name="viewer"></iframe></body>`
    res.setHeader('Content-Type', 'text/html'); res.end(html); return
  }
  const m = req.url?.match(/^\/v\/(.+)$/)
  if (m) {
    try {
      const svg = await render(m[1])
      res.setHeader('Content-Type', 'image/svg+xml'); res.end(svg); return
    } catch (e) {
      res.statusCode = 500; res.end(String(e)); return
    }
  }
  res.statusCode = 404; res.end('Not found')
})
server.listen(port, ()=>console.log(`Gallery live at http://localhost:${port}`))
