import { fetchBcvRates, fetchP2PArmyRate } from './_lib/rateScraper.js'

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const [bcv, p2p] = await Promise.all([fetchBcvRates(), fetchP2PArmyRate()])
    res.status(200).json({
      bcv: {
        eur: bcv.eur,
        usd: bcv.usd,
        raw: bcv.raw,
      },
      usdt: p2p,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch rates:', error)
    res.status(502).json({ error: 'No se pudieron obtener las tasas' })
  }
}
