<script setup>
import { computed, onMounted, ref } from 'vue'
import CalculatorTable from './components/CalculatorTable.vue'
import { useRatesStore } from './stores/rates.js'

const store = useRatesStore()
const currentView = ref('rates')

const formatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatRate = (value) => {
  if (value == null) return 'No disponible'
  return formatter.format(value)
}

const gap = computed(() => store.gap)

const selectView = (view) => {
  currentView.value = view
}

const viewOrder = ['rates', 'calculator']
const touchStartX = ref(null)
const touchStartY = ref(null)

const onTouchStart = (event) => {
  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
}

const onTouchEnd = (event) => {
  if (touchStartX.value === null || touchStartY.value === null) return
  const touch = event.changedTouches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value
  const horizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)
  const threshold = 60

  if (horizontalSwipe && Math.abs(deltaX) > threshold) {
    const currentIndex = viewOrder.indexOf(currentView.value)
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1
    const clampedIndex = Math.min(Math.max(nextIndex, 0), viewOrder.length - 1)
    currentView.value = viewOrder[clampedIndex]
  }

  touchStartX.value = null
  touchStartY.value = null
}

onMounted(() => {
  const saved = store.loadFromStorage()
  store.loadRates(saved)
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
                  @click="store.loadRates()"
                  class="btn btn-light btn-sm fst-italic fw-bold shadow-sm d-flex align-items-center gap-2 px-3 rounded-pill btn-custom"
                  :disabled="store.loading"
                  title="Actualizar"
                  aria-label="Actualizar"
                >
                  <span
                    v-if="store.loading"
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <i v-else class="bi bi-arrow-clockwise fw-medium"></i>
                  <span :class="{ 'text-muted': store.loading }"
                    >Actualizar<span v-if="store.loading">...</span></span
                  >
                </button>
              </div>
              <div class="header-tabs mt-3">
                <button
                  class="btn btn-sm rounded-pill px-3 btn-tab"
                  :class="currentView === 'rates' ? 'btn-light text-primary' : 'btn-outline-light'"
                  @click="selectView('rates')"
                  title="Resumen"
                  aria-label="Resumen"
                >
                  <i class="bi bi-grid-fill"></i>
                </button>
                <button
                  class="btn btn-sm rounded-pill px-3 btn-tab"
                  :class="
                    currentView === 'calculator' ? 'btn-light text-primary' : 'btn-outline-light'
                  "
                  @click="selectView('calculator')"
                  title="Calculadora"
                  aria-label="Calculadora"
                >
                  <i class="bi bi-calculator-fill"></i>
                </button>
              </div>
            </div>

            <div
              class="card-body bg-white p-3 p-md-4"
              @touchstart.passive="onTouchStart"
              @touchend.passive="onTouchEnd"
            >
              <p class="text-muted mb-4 small">
                Consulta en tiempo real las tasas de cambio oficiales del Banco Central de Venezuela
                y la estimación del mercado P2P en Binance.
              </p>

              <div
                v-if="store.error"
                class="alert alert-danger py-2 px-3 rounded-2 mb-3 shadow-sm alert-custom"
                role="alert"
              >
                <strong>Error:</strong> {{ store.error }}
              </div>

              <!-- Grid de Tarjetas -->
              <div v-if="currentView === 'rates'" class="row g-3 mb-4">
                <!-- Euro -->
                <div class="col-6 col-md-3">
                  <div
                    class="card h-100 border-0 bg-light rounded-3 shadow-sm hover-elevate transition-all"
                  >
                    <div class="card-body text-center p-3">
                      <div class="text-primary fw-bold text-uppercase mb-1 currency-label">
                        Euro (EUR)
                      </div>
                      <h2 class="h4 fw-bold text-dark mb-0">
                        {{ formatRate(store.bcvRates.eur) }}
                      </h2>
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
                      <h2 class="h4 fw-bold text-dark mb-0">
                        {{ formatRate(store.bcvRates.usd) }}
                      </h2>
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
                      <h2 class="h4 fw-bold text-dark mb-0">
                        {{ formatRate(store.usdtRate) }}
                      </h2>
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
                      <h2 class="h4 fw-bold text-dark mb-0">
                        {{ gap ? gap + '%' : '--' }}
                      </h2>
                      <small class="text-muted currency-unit">BCV vs P2P</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tabla de Calculadora -->
              <CalculatorTable v-if="currentView === 'calculator'" />

              <!-- Notas y Footer
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
              </div> -->
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

.header-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  -webkit-overflow-scrolling: touch;
}
.btn-tab {
  white-space: nowrap;
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
