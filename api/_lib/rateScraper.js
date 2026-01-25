import https from 'https'
import axios from 'axios'
import { load } from 'cheerio'

const BCV_URL = 'https://www.bcv.org.ve/'
const P2P_ARMY_URL = 'https://p2p.army/en/p2p/fiats/VES'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\[\]\\]/g, '\\$&')

const parseNumber = (raw, { decimalSeparator = ',', thousandSeparator = '.' } = {}) => {
  if (!raw) return null
  let normalized = raw.trim().replace(/\s+/g, '')
  if (thousandSeparator && thousandSeparator !== decimalSeparator) {
    const escapedThousand = escapeRegex(thousandSeparator)
    normalized = normalized.replace(new RegExp(escapedThousand, 'g'), '')
  }
  if (decimalSeparator !== '.') {
    const escapedDecimal = escapeRegex(decimalSeparator)
    normalized = normalized.replace(new RegExp(escapedDecimal, 'g'), '.')
  }
  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

const defaultHeaders = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
}

const normalizeCurrency = (text) => text.replace(/\s+/g, '')

export async function fetchBcvRates() {
  const { data } = await axios.get(BCV_URL, {
    headers: defaultHeaders,
    httpsAgent,
  })
  const $ = load(data)
  const rates = {}

  $('.row.recuadrotsmc').each((_, section) => {
    const currency = normalizeCurrency($(section).find('div.col-sm-6 span').text())
    const valueText = $(section).find('div.col-sm-6.centrado strong').text().trim()
    if (currency && valueText) {
      rates[currency] = parseNumber(valueText, {
        decimalSeparator: ',',
        thousandSeparator: '.',
      })
    }
  })

  return {
    eur: rates.EUR ?? null,
    usd: rates.USD ?? null,
    raw: rates,
  }
}

export async function fetchP2PArmyRate() {
  const { data } = await axios.get(P2P_ARMY_URL, {
    headers: defaultHeaders,
    httpsAgent,
  })
  const $ = load(data)
  let valueText = null

  $('.p2p-fiat-price-block > div').each((_, section) => {
    const assetText = $(section).find('._asset b').text().trim()
    if (assetText.includes('USDT')) {
      valueText = $(section).find('._big b').first().text().trim()
      return false
    }
    return true
  })

  if (!valueText) return null

  const cleaned = valueText.replace(/≈|&approx;|approx\.?/gi, '').trim()
  return parseNumber(cleaned, {
    decimalSeparator: '.',
    thousandSeparator: ' ',
  })
}
