#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const entries = JSON.parse(readFileSync(resolve(process.cwd(), 'gallery/index.json'), 'utf8'))
const items = entries.map(e => `<li><figure><img src="assets/${e.id}.svg" alt="${e.title}"><figcaption>${e.title}</figcaption></figure></li>`).join('\n')
const html = `<!doctype html><meta charset="utf-8"><title>Obscura Gallery</title><style>
body{font-family:system-ui,sans-serif;padding:16px;background:#f8f9fa}
ul{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px;list-style:none;padding:0}
figure{padding:12px;background:#fff;border:1px solid #ddd;border-radius:8px}
figcaption{margin-top:8px;color:#555;font-size:14px}
img{width:100%;height:auto;background:#fff}
</style><body><h1>Diagram Gallery</h1><ul>${items}</ul>`
writeFileSync(resolve(process.cwd(), 'gallery/index.html'), html, 'utf8')
console.log('Built gallery HTML')
