import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const ROUTES = {
  '/api/cuisine-categories': path.join(rootDir, 'data', 'cuisine-categories.json'),
  '/api/store-min-orders': path.join(rootDir, 'data', 'store-min-orders.json'),
  '/api/dish-photos': path.join(rootDir, 'data', 'dish-photos.json'),
  '/api/dish-descriptions': path.join(rootDir, 'data', 'dish-descriptions.json'),
  '/api/tickets': path.join(rootDir, 'data', 'tickets.json'),
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** 开发态：后台与移动端共用配置文件（品类、起送费等） */
export function cuisineApiPlugin() {
  return {
    name: 'wmpt-shared-data-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        const DATA_FILE = url ? ROUTES[url] : undefined
        if (!DATA_FILE) return next()

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        try {
          if (req.method === 'GET') {
            const fallback =
              url === '/api/store-min-orders' ||
              url === '/api/dish-photos' ||
              url === '/api/dish-descriptions'
                ? '{}'
                : '[]'
            const raw = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf8') : fallback
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(raw)
            return
          }

          if (req.method === 'PUT') {
            const body = await readBody(req)
            JSON.parse(body)
            fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
            fs.writeFileSync(DATA_FILE, body, 'utf8')
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(body)
            return
          }
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: String(err?.message || err) }))
          return
        }

        next()
      })
    },
  }
}
