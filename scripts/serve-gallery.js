#!/usr/bin/env node
import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
const root = resolve(process.cwd(), 'gallery')
const mime = { '.html':'text/html', '.svg':'image/svg+xml', '.json':'application/json' }
const server = http.createServer((req,res)=>{
  const url = req.url === '/' ? '/index.html' : req.url
  const file = resolve(root, '.' + url)
  if (!existsSync(file)) { res.statusCode = 404; res.end('Not found'); return }
  const data = readFileSync(file)
  res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream')
  res.end(data)
})
server.listen(5173, ()=>console.log('Gallery at http://localhost:5173'))
