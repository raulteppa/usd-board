<script setup>
import { onMounted, ref, computed, watch } from 'vue'

const API_URL = import.meta.env.VITE_API_URL ?? '/api/rates'

const loading = ref(false)
const error = ref(null)
const bcvRates = ref({ eur: null, usd: null, raw: {} })
const usdtRate = ref(null)

const items = ref([{ id: 1, name: 'Ejemplo', price: 10, lockedField: 'price' }])

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
  // Formula: Price * (USDT / BCV_USD)
  return price * (usdtRate.value / bcvRates.value.usd)
}

const updateFromReposition = (item, valStr) => {
  if (!usdtRate.value || !bcvRates.value.usd) return
  const val = parseFloat(valStr)
  if (!isNaN(val)) {
    // Price = Reposition * (BCV_USD / USDT)
    item.price = val * (bcvRates.value.usd / usdtRate.value)
  }
}

const updateFromBs = (item, bsValue, rate) => {
  if (!rate) return
  const val = parseFloat(bsValue)
  if (!isNaN(val)) {
    item.price = val / rate
  }
}

const toggleLock = (item, field) => {
  item.lockedField = item.lockedField === field ? 'price' : field
}

const formatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dollarFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const formatBs = (value) => formatter.format(value)
const formatUSD = (value) => dollarFormatter.format(value)

const formatRate = (value) => {
  if (value == null) return 'No disponible'
  return formatter.format(value)
}

const gap = computed(() => {
  if (!usdtRate.value || !bcvRates.value.usd) return null
  return (((usdtRate.value - bcvRates.value.usd) / bcvRates.value.usd) * 100).toFixed(2)
})

const saveToStorage = () => {
  const data = {
    items: items.value,
    bcvRates: bcvRates.value,
    usdtRate: usdtRate.value,
    lastUpdated: new Date().toISOString(),
  }
  localStorage.setItem('usdBoardData', JSON.stringify(data))
}

const loadFromStorage = () => {
  const data = localStorage.getItem('usdBoardData')
  if (data) {
    const parsed = JSON.parse(data)
    if (parsed.items) items.value = parsed.items
    if (parsed.bcvRates) bcvRates.value = parsed.bcvRates
    if (parsed.usdtRate) usdtRate.value = parsed.usdtRate
    return parsed
  }
  return null
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

watch(
  items,
  () => {
    saveToStorage()
  },
  { deep: true },
)

const loadRates = async (fallbackRates = null) => {
  loading.value = true
  error.value = null

  // Capture values before update to maintain locked fields
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

    // Recalculate prices based on preserved values and NEW rates
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
        // Inverse Reposition: Val * (BCV / USDT)
        item.price = saved * (bcvRates.value.usd / usdtRate.value)
      }
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const saved = loadFromStorage()
  loadRates(saved)
})
</script>

<template>
  <main class="min-vh-100 bg-dark d-flex align-items-center justify-content-center py-4">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-11">
          <div class="card shadow-lg border-0 rounded-3 overflow-hidden">
            <!-- Encabezado con color primario -->
            <div class="card-header bg-primary text-white p-3 border-0">
              <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div
                    class="text-white-50 text-uppercase fw-bold tiny-text"
                    style="letter-spacing: 1px"
                  >
                    BCV &bull; P2P.ARMY
                  </div>
                  <h1 class="h5 fw-bold mb-0">Monitor de Tasas</h1>
                </div>
                <button
                  @click="loadRates"
                  class="btn btn-light btn-sm fw-bold shadow-sm d-flex align-items-center gap-2 px-3 rounded-pill btn-custom"
                  :disabled="loading"
                >
                  <span
                    v-if="loading"
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span>{{ loading ? 'Actualizando...' : 'Actualizar' }}</span>
                </button>
              </div>
            </div>

            <div class="card-body bg-white p-3 p-md-4">
              <p class="text-muted mb-4 small">
                Consulta en tiempo real las tasas de cambio oficiales del Banco Central de Venezuela
                y la estimación del mercado P2P en Binance.
              </p>

              <div
                v-if="error"
                class="alert alert-danger py-2 px-3 rounded-2 mb-3 shadow-sm alert-custom"
                role="alert"
              >
                <strong>Error:</strong> {{ error }}
              </div>

              <!-- Grid de Tarjetas -->
              <div class="row g-3 mb-4">
                <!-- Euro -->
                <div class="col-6 col-md-3">
                  <div
                    class="card h-100 border-0 bg-light rounded-3 shadow-sm hover-elevate transition-all"
                  >
                    <div class="card-body text-center p-3">
                      <div class="text-primary fw-bold text-uppercase mb-1 currency-label">
                        Euro (EUR)
                      </div>
                      <h2 class="h4 fw-bold text-dark mb-0">{{ formatRate(bcvRates.eur) }}</h2>
                      <small class="text-muted currency-unit">Bs. Digitales</small>
                    </div>
                  </div>
                </div>

                <!-- Dolar -->
                <div class="col-6 col-md-3">
                  <div
                    class="card border border-0 h-100 bg-light rounded-3 shadow-sm hover-elevate transition-all"
                  >
                    <div class="card-body text-center p-3">
                      <div class="text-success fw-bold text-uppercase mb-1 currency-label">
                        Dólar (USD)
                      </div>
                      <h2 class="h4 fw-bold text-dark mb-0">{{ formatRate(bcvRates.usd) }}</h2>
                      <small class="text-muted currency-unit">Bs. Digitales</small>
                    </div>
                  </div>
                </div>

                <!-- USDT -->
                <div class="col-6 col-md-3">
                  <div
                    class="card h-100 border-0 bg-light rounded-3 shadow-sm hover-elevate transition-all"
                  >
                    <div class="card-body text-center p-3">
                      <div
                        class="text-warning text-dark fw-bold text-uppercase mb-1 currency-label"
                      >
                        USDT (P2P)
                      </div>
                      <h2 class="h4 fw-bold text-dark mb-0">{{ formatRate(usdtRate) }}</h2>
                      <small class="text-muted currency-unit">Bs. Digitales</small>
                    </div>
                  </div>
                </div>

                <!-- GAP -->
                <div class="col-6 col-md-3">
                  <div
                    class="card h-100 border-0 bg-light rounded-3 shadow-sm hover-elevate transition-all"
                  >
                    <div class="card-body text-center p-3">
                      <div class="text-danger fw-bold text-uppercase mb-1 currency-label">
                        Brecha %
                      </div>
                      <h2 class="h4 fw-bold text-dark mb-0">{{ gap ? gap + '%' : '--' }}</h2>
                      <small class="text-muted currency-unit">BCV vs P2P</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tabla de Calculadora -->
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="fw-bold text-secondary mb-0 small me-2">Calculadora de Precios</h6>
                  <div class="d-flex gap-2">
                    <button
                      @click="downloadReport"
                      class="btn btn-outline-success btn-sm rounded-pill px-3 btn-custom small"
                    >
                      Descargar Reporte
                    </button>
                    <button
                      @click="addItem"
                      class="btn btn-primary btn-sm rounded-pill px-3 btn-custom small"
                    >
                      + Agregar Item
                    </button>
                  </div>
                </div>
                <div class="table-responsive rounded-3 border shadow-sm">
                  <table
                    class="table table-hover table-striped mb-0 align-middle text-center small-table text-nowrap"
                  >
                    <thead class="bg-light text-secondary">
                      <tr>
                        <th class="fw-bold text-start ps-3">Item</th>
                        <th class="fw-bold">Precio ($)</th>
                        <th class="fw-bold">Bs (BCV $)</th>
                        <th class="fw-bold">Bs (BCV €)</th>
                        <th class="fw-bold">Bs (P2P)</th>
                        <th class="fw-bold text-danger">Reposición ($)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody class="bg-white">
                      <tr v-for="item in items" :key="item.id">
                        <td class="ps-3">
                          <input
                            type="text"
                            class="form-control form-control-sm border-0 bg-transparent fw-bold text-dark"
                            v-model="item.name"
                            placeholder="Nombre"
                          />
                        </td>
                        <td>
                          <div class="input-group input-group-sm">
                            <input
                              type="number"
                              class="form-control text-center border-0 bg-transparent fw-bold text-dark"
                              v-model="item.price"
                              min="0"
                              step="0.01"
                            />
                            <button
                              class="btn border-0 px-1"
                              :class="
                                item.lockedField === 'price'
                                  ? 'text-primary'
                                  : 'text-muted opacity-25'
                              "
                              @click="toggleLock(item, 'price')"
                              title="Fijar valor"
                            >
                              🔒
                            </button>
                          </div>
                        </td>
                        <td>
                          <div class="input-group input-group-sm">
                            <input
                              type="number"
                              class="form-control text-center border-0 bg-transparent text-muted"
                              :value="calculateBs(item.price, bcvRates.usd).toFixed(2)"
                              @input="updateFromBs(item, $event.target.value, bcvRates.usd)"
                              step="0.01"
                            />
                            <button
                              class="btn border-0 px-1"
                              :class="
                                item.lockedField === 'bs_usd'
                                  ? 'text-primary'
                                  : 'text-muted opacity-25'
                              "
                              @click="toggleLock(item, 'bs_usd')"
                              title="Fijar valor"
                            >
                              🔒
                            </button>
                          </div>
                        </td>
                        <td>
                          <div class="input-group input-group-sm">
                            <input
                              type="number"
                              class="form-control text-center border-0 bg-transparent text-muted"
                              :value="calculateBs(item.price, bcvRates.eur).toFixed(2)"
                              @input="updateFromBs(item, $event.target.value, bcvRates.eur)"
                              step="0.01"
                            />
                            <button
                              class="btn border-0 px-1"
                              :class="
                                item.lockedField === 'bs_eur'
                                  ? 'text-primary'
                                  : 'text-muted opacity-25'
                              "
                              @click="toggleLock(item, 'bs_eur')"
                              title="Fijar valor"
                            >
                              🔒
                            </button>
                          </div>
                        </td>
                        <td>
                          <div class="input-group input-group-sm">
                            <input
                              type="number"
                              class="form-control text-center border-0 bg-transparent text-muted"
                              :value="calculateBs(item.price, usdtRate).toFixed(2)"
                              @input="updateFromBs(item, $event.target.value, usdtRate)"
                              step="0.01"
                            />
                            <button
                              class="btn border-0 px-1"
                              :class="
                                item.lockedField === 'bs_p2p'
                                  ? 'text-primary'
                                  : 'text-muted opacity-25'
                              "
                              @click="toggleLock(item, 'bs_p2p')"
                              title="Fijar valor"
                            >
                              🔒
                            </button>
                          </div>
                        </td>
                        <td>
                          <div class="input-group input-group-sm">
                            <input
                              type="number"
                              class="form-control text-center border-0 bg-transparent fw-bold text-danger"
                              :value="calculateReposition(item.price).toFixed(2)"
                              @input="updateFromReposition(item, $event.target.value)"
                              step="0.01"
                            />
                            <button
                              class="btn border-0 px-1"
                              :class="
                                item.lockedField === 'reposition'
                                  ? 'text-primary'
                                  : 'text-muted opacity-25'
                              "
                              @click="toggleLock(item, 'reposition')"
                              title="Fijar valor"
                            >
                              🔒
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            @click="removeItem(item.id)"
                            class="btn btn-link text-danger p-0 btn-sm"
                            title="Eliminar"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                      <tr v-if="items.length === 0">
                        <td colspan="7" class="text-center py-3 text-muted fst-italic">
                          No hay items. Agrega uno para calcular.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Notas y Footer -->
              <div class="border-top pt-3">
                <h6 class="fw-bold text-secondary mb-2 small">Detalles Técnicos</h6>
                <div
                  class="alert alert-light border text-muted rounded-2 py-2 px-3 mb-0 details-box"
                >
                  <div class="d-flex flex-column gap-1">
                    <div>
                      <span class="badge bg-secondary me-2 badge-custom">BCV</span> Se obtiene del
                      contenedor <code>.recuadrotsmc</code> del sitio oficial.
                    </div>
                    <div>
                      <span class="badge bg-secondary me-2 badge-custom">P2P</span> Se extrae del
                      valor <code>#start-price</code> en p2p.army.
                    </div>
                    <div>
                      <span class="badge bg-info text-dark me-2 badge-custom">Nota</span>
                      Requiere backend activo (<code>npm run backend</code>) para evitar bloqueos
                      CORS.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.tiny-text {
  font-size: 0.65rem;
}
.btn-custom {
  font-size: 0.8rem;
}
.alert-custom {
  font-size: 0.85rem;
}
.currency-label {
  font-size: 0.7rem;
}
.currency-unit {
  font-size: 0.65rem;
}
.details-box {
  font-size: 0.75rem;
}
.badge-custom {
  font-size: 0.65rem;
}

.small-table {
  font-size: 0.75rem;
  min-width: 850px;
}
.small-table input {
  font-size: 0.75rem;
  min-width: 80px;
}

.hover-elevate {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.hover-elevate:hover {
  transform: translateY(-5px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
}
</style>
