import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ratesHandler from './api/rates.js'

// Adapter to mimic Vercel/Express res methods in Vite middleware
const expressAdapter = (handler) => async (req, res, next) => {
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (data) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
    return res
  }
  // Basic query support if needed, though mostly needed for req.query
  if (!req.query) {
    const url = new URL(req.url, `http://${req.headers.host}`)
    req.query = Object.fromEntries(url.searchParams)
  }

  await handler(req, res)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'vercel-dev-server',
      configureServer(server) {
        server.middlewares.use('/api/rates', expressAdapter(ratesHandler))
      },
      configurePreviewServer(server) {
        server.middlewares.use('/api/rates', expressAdapter(ratesHandler))
      },
    },
  ],
  server: {
    // Proxy configuration removed as we are serving directly via middleware
  },
})
