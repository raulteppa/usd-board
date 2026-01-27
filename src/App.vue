<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import CalculatorTable from './components/CalculatorTable.vue'
import ConversionCalculator from './components/ConversionCalculator.vue'
import { useRatesStore } from './stores/rates.js'
import { useToast } from './composables/useToast.js'

const BCV_URL = 'https://www.bcv.org.ve/'
const P2P_ARMY_URL = 'https://p2p.army/en/p2p/fiats/VES'

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

const rateCards = computed(() => [
  {
    id: 'usd',
    label: 'Dólar (USD)',
    value: formatRate(store.bcvRates.usd),
    className: 'text-success',
    footer: 'BCV Oficial',
    link: BCV_URL,
  },
  {
    id: 'eur',
    label: 'Euro (EUR)',
    value: formatRate(store.bcvRates.eur),
    className: 'text-primary',
    footer: 'BCV Oficial',
    link: BCV_URL,
  },
  {
    id: 'usdt',
    label: 'USDT (P2P)',
    value: formatRate(store.usdtRate),
    className: store.theme === 'dark' ? 'text-warning ' : 'text-secondary ',
    footer: 'Binance USDT-P2P',
    link: P2P_ARMY_URL,
  },
  {
    id: 'gap',
    label: 'Brecha %',
    value: gap.value ? `${gap.value}%` : '--',
    className: 'text-danger',
    footer: 'BCV vs USDT-P2P',
  },
])

const selectView = (view) => {
  currentView.value = view
}

const viewOrder = ['rates', 'convert', 'calculator']
const transitionName = ref('slide-left')

const { toasts, removeToast } = useToast()

const toastIcon = (type) => {
  switch (type) {
    case 'success':
      return 'bi-check-circle-fill'
    case 'danger':
      return 'bi-exclamation-triangle-fill'
    default:
      return 'bi-info-circle-fill'
  }
}

const toastVariant = (type) => {
  switch (type) {
    case 'success':
      return 'bg-success bg-opacity-15 border-success text-success'
    case 'danger':
      return 'bg-danger bg-opacity-15 border-danger text-danger'
    default:
      return store.theme === 'dark'
        ? 'bg-dark border border-white-25 text-white-75'
        : 'bg-white border text-dark'
  }
}

watch(currentView, (next, prev) => {
  const nextIndex = viewOrder.indexOf(next)
  const prevIndex = viewOrder.indexOf(prev)
  transitionName.value = nextIndex > prevIndex ? 'slide-left' : 'slide-right'
})

onMounted(() => {
  const saved = store.loadFromStorage()
  store.loadRates(saved)
})
</script>

<template>
  <div class="col-12 bg-dark" style="height: 100dvh">
    <div class="card h-100 shadow-lg border-0 rounded-0 overflow-hidden">
      <!-- Encabezado con color primario -->
      <div class="card-header bg-primary text-white rounded-0 p-3 border-0">
        <div class="container">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <div
                class="text-white-50 text-uppercase fw-bold tiny-text"
                style="letter-spacing: 1px"
              >
                VES &bull; TASAS DE CAMBIO
              </div>
              <h1 class="h5 fw-bold mb-0 text-uppercase">Monitor de Tasas</h1>
            </div>
            <div class="d-flex gap-2">
              <button
                @click="store.toggleTheme()"
                class="btn btn-sm shadow-sm d-flex align-items-center justify-content-center rounded-circle btn-custom"
                :class="
                  store.theme === 'dark' ? 'btn-dark text-warning' : 'btn-light text-secondary'
                "
                title="Cambiar tema"
                aria-label="Cambiar tema"
                style="width: 32px; height: 32px"
              >
                <i
                  class="bi"
                  :class="store.theme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill'"
                ></i>
              </button>
              <button
                @click="store.loadRates()"
                class="btn btn-light btn-sm fw-bold shadow-sm d-flex align-items-center gap-1 px-3 pe-lg-4 rounded-pill btn-custom"
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
                <span
                  :class="[
                    ' d-none d-lg-inline justify-content-center fst-normal',
                    { 'text-muted': store.loading },
                  ]"
                  >Actualizar<span v-if="store.loading">...</span></span
                >
              </button>
            </div>
          </div>
          <div class="header-tabs mt-3">
            <button
              class="btn btn-sm rounded-pill px-3 btn-tab shadow-sm"
              :class="currentView === 'rates' ? 'btn-light text-primary' : 'btn-outline-light'"
              @click="selectView('rates')"
              title="Resumen"
              aria-label="Resumen"
            >
              <i class="bi bi-grid-fill"></i>
            </button>

            <button
              class="btn btn-sm rounded-pill px-3 btn-tab shadow-sm"
              :class="currentView === 'convert' ? 'btn-light text-primary' : 'btn-outline-light'"
              @click="selectView('convert')"
              title="Conversor"
              aria-label="Conversor"
            >
              <i class="bi bi-arrow-left-right"></i>
            </button>
            <button
              class="btn btn-sm rounded-pill px-3 btn-tab shadow-sm"
              :class="currentView === 'calculator' ? 'btn-light text-primary' : 'btn-outline-light'"
              @click="selectView('calculator')"
              title="Calculadora"
              aria-label="Calculadora"
            >
              <i class="bi bi-calculator-fill"></i>
            </button>
          </div>
        </div>
      </div>

      <div
        class="card-body p-3 p-md-4 overflow-y-auto"
        :class="store.theme === 'dark' ? 'bg-dark text-white' : 'bg-white text-dark'"
      >
        <div class="container d-flex flex-column justify-content-between h-100">
          <p
            v-if="currentView === 'rates'"
            class="mb-4 small"
            :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
          >
            Consulta en tiempo real las tasas de cambio oficiales del Banco Central de Venezuela y
            la estimación del mercado P2P en Binance.
          </p>

          <div
            v-if="store.error"
            class="alert alert-danger py-2 px-3 rounded-2 mb-3 shadow-sm alert-custom"
            role="alert"
          >
            <strong>Error:</strong> {{ store.error }}
          </div>

          <transition :name="transitionName" mode="out-in">
            <div :key="currentView">
              <!-- Grid de Tarjetas -->
              <div v-if="currentView === 'rates'" class="row g-3 mb-4">
                <div v-for="card in rateCards" :key="card.id" class="col-6 col-md-3">
                  <div
                    class="card h-100 rounded-3 shadow-sm hover-elevate transition-all"
                    :class="
                      store.theme === 'dark'
                        ? 'bg-secondary bg-opacity-25 border-secondary'
                        : 'bg-light'
                    "
                  >
                    <div class="card-body text-center p-3">
                      <div
                        class="fw-bold text-uppercase mb-1 currency-label"
                        :class="card.className"
                      >
                        {{ card.label }}
                      </div>
                      <h2
                        class="h4 fw-bold mb-0"
                        :class="store.theme === 'dark' ? 'text-white' : 'text-dark'"
                      >
                        {{ card.value }}
                      </h2>
                      <small
                        class="currency-unit"
                        :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
                      >
                        {{ card.footer ?? 'Bs. Digitales' }}
                      </small>
                      <a
                        v-if="card.link"
                        :href="card.link"
                        class="btn btn-link btn-sm rounded-pill mt-0 position-absolute top-0 end-0 me-1 p-1"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <i class="bi bi-arrow-up-right-square me-0"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tabla de Calculadora -->
              <CalculatorTable v-else-if="currentView === 'calculator'" />

              <!-- Conversor -->
              <ConversionCalculator v-else />
            </div>
          </transition>

          <div
            class="border-top pt-3 d-flex flex-column justify-content-end mt-auto border-light border-opacity-25"
          >
            <h6
              :class="[
                'fw-bold',
                'mb-2',
                'small',
                store.theme === 'dark' ? 'text-white-50' : 'text-muted',
              ]"
            >
              Detalles Técnicos
            </h6>

            <p
              :class="[
                'mt-3',
                'small',
                store.theme === 'dark' ? 'text-white-50' : 'text-muted',
                'mb-0',
              ]"
            >
              Este sitio obtiene sus datos mediante web scraping al Banco Central de Venezuela y a
              la plataforma de P2P Army. La información también está disponible a través de la API
              en
              <code>https://usd-board.vercel.app/api/rates</code>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div
      class="toast-wrapper position-fixed start-50 bottom-0 translate-middle-x mb-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <transition-group name="toast-fade" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'toast-notification d-flex align-items-center justify-content-between gap-3 px-3 py-2 rounded-3 shadow-sm border pointer-events-auto',
            toastVariant(toast.type),
          ]"
          role="status"
        >
          <div class="d-flex text-white align-items-center gap-2 flex-grow-1">
            <i :class="['bi', toastIcon(toast.type)]"></i>
            <span class="flex-grow-1 text-truncate">{{ toast.message }}</span>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-link text-muted p-0"
            aria-label="Cerrar notificación"
            @click="removeToast(toast.id)"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </transition-group>
    </div>
  </div>
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

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.15s ease;
}

.slide-left-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.slide-left-leave-to,
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}

/* Scrollbar Styles */
.card-body::-webkit-scrollbar {
  width: 8px;
}
.card-body::-webkit-scrollbar-track {
  background: transparent;
}

.card-body::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
.card-body::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.4);
}

.toast-wrapper {
  pointer-events: none;
  z-index: 1200;
  width: 100%;
  max-width: 420px;
}

.toast-notification {
  pointer-events: auto;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
