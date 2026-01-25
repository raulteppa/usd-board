import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

const API_URL = import.meta.env.VITE_API_URL ?? '/api/rates'
const STORAGE_KEY = 'usdBoardData'

export const useRatesStore = defineStore('rates', () => {
  const loading = ref(false)
  const error = ref(null)
  const bcvRates = ref({ eur: null, usd: null, raw: {} })
  const usdtRate = ref(null)
  const items = ref([{ id: 1, name: 'Ejemplo', price: 10, lockedField: 'price' }])

  const gap = computed(() => {
    if (!usdtRate.value || !bcvRates.value.usd) return null
    return (((usdtRate.value - bcvRates.value.usd) / bcvRates.value.usd) * 100).toFixed(2)
  })

  const formatter = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const formatMoney = (value) => {
    if (value == null) return '0,00'
    return formatter.format(value)
  }

  const normalizeMoneyInput = (raw) => {
    const digits = String(raw ?? '').replace(/\D/g, '')
    if (!digits) return 0
    const value = Number(digits) / 100
    return Number.isNaN(value) ? 0 : value
  }

  const saveToStorage = () => {
    const data = {
      items: items.value,
      bcvRates: bcvRates.value,
      usdtRate: usdtRate.value,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  const loadFromStorage = () => {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed.items) items.value = parsed.items
      if (parsed.bcvRates) bcvRates.value = parsed.bcvRates
      if (parsed.usdtRate) usdtRate.value = parsed.usdtRate
      return parsed
    }
    return null
  }

  watch(
    items,
    () => {
      saveToStorage()
    },
    { deep: true },
  )

  const addItem = () => {
    items.value.push({
      id: Date.now(),
      name: 'Nuevo Item',
      price: 0,
      lockedField: 'price',
    })
  }

  const removeItem = (id) => {
    items.value = items.value.filter((item) => item.id !== id)
  }

  const calculateBs = (price, rate) => {
    if (!price || !rate) return 0
    return price * rate
  }

  const calculateReposition = (price) => {
    if (!price || !usdtRate.value || !bcvRates.value.usd) return 0
    return price * (usdtRate.value / bcvRates.value.usd)
  }

  const updateFromPrice = (item, valStr) => {
    item.price = normalizeMoneyInput(valStr)
  }

  const updateFromReposition = (item, valStr) => {
    if (!usdtRate.value || !bcvRates.value.usd) return
    const val = normalizeMoneyInput(valStr)
    item.price = val * (bcvRates.value.usd / usdtRate.value)
  }

  const updateFromBs = (item, bsValue, rate) => {
    if (!rate) return
    const val = normalizeMoneyInput(bsValue)
    item.price = val / rate
  }

  const toggleLock = (item, field) => {
    item.lockedField = item.lockedField === field ? 'price' : field
  }

  const downloadReport = () => {
    const headers = [
      'Item',
      'Precio ($)',
      'Bs (BCV $)',
      'Bs (BCV €)',
      'Bs (P2P)',
      'Reposición ($)',
      'Tasa BCV $',
      'Tasa P2P',
    ]
    const rows = items.value.map((item) => {
      return [
        `"${item.name}"`,
        item.price.toFixed(2),
        calculateBs(item.price, bcvRates.value.usd).toFixed(2),
        calculateBs(item.price, bcvRates.value.eur).toFixed(2),
        calculateBs(item.price, usdtRate.value).toFixed(2),
        calculateReposition(item.price).toFixed(2),
        bcvRates.value.usd || 0,
        usdtRate.value || 0,
      ].join(',')
    })
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `reporte_tasas_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const loadRates = async (fallbackRates = null) => {
    loading.value = true
    error.value = null

    const refBcvUsd = bcvRates.value.usd || fallbackRates?.bcvRates?.usd
    const refBcvEur = bcvRates.value.eur || fallbackRates?.bcvRates?.eur
    const refUsdt = usdtRate.value || fallbackRates?.usdtRate

    const preservedValues = items.value.map((item) => {
      if (item.lockedField === 'price') return item.price
      if (item.lockedField === 'bs_usd' && refBcvUsd) return item.price * refBcvUsd
      if (item.lockedField === 'bs_eur' && refBcvEur) return item.price * refBcvEur
      if (item.lockedField === 'bs_p2p' && refUsdt) return item.price * refUsdt
      if (item.lockedField === 'reposition' && refUsdt && refBcvUsd) {
        return (item.price * refUsdt) / refBcvUsd
      }
      return item.price
    })

    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error('No se pudieron cargar las tasas desde el backend')
      }
      const data = await response.json()
      if (data?.bcv) {
        bcvRates.value = {
          eur: data.bcv.eur,
          usd: data.bcv.usd,
          raw: data.bcv.raw ?? {},
        }
      }
      usdtRate.value = data?.usdt ?? null

      saveToStorage()

      items.value.forEach((item, index) => {
        const saved = preservedValues[index]
        if (saved == null || isNaN(saved)) return

        if (item.lockedField === 'price') {
          item.price = saved
        } else if (item.lockedField === 'bs_usd' && bcvRates.value.usd) {
          item.price = saved / bcvRates.value.usd
        } else if (item.lockedField === 'bs_eur' && bcvRates.value.eur) {
          item.price = saved / bcvRates.value.eur
        } else if (item.lockedField === 'bs_p2p' && usdtRate.value) {
          item.price = saved / usdtRate.value
        } else if (item.lockedField === 'reposition' && usdtRate.value && bcvRates.value.usd) {
          item.price = saved * (bcvRates.value.usd / usdtRate.value)
        }
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    bcvRates,
    usdtRate,
    items,
    gap,
    formatMoney,
    addItem,
    removeItem,
    calculateBs,
    calculateReposition,
    updateFromPrice,
    updateFromReposition,
    updateFromBs,
    toggleLock,
    downloadReport,
    loadRates,
    loadFromStorage,
  }
})
