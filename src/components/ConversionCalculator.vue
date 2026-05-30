<script setup>
import { computed, ref, watch } from 'vue'
import { useRatesStore } from '../stores/rates.js'

const store = useRatesStore()
const usdAmount = ref(null)
const vesAmount = ref(null)
const selectedRate = ref('usd')

const blockNonNumeric = (event) => {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowUp',
    'ArrowRight',
    'ArrowDown',
    'Home',
    'End',
  ]
  if (allowedKeys.includes(event.key)) return
  if (event.key === 'a' && (event.ctrlKey || event.metaKey)) return
  if (event.key === 'c' && (event.ctrlKey || event.metaKey)) return
  if (event.key === 'x' && (event.ctrlKey || event.metaKey)) return
  if (event.key === 'v' && (event.ctrlKey || event.metaKey)) return
  if (/^\d$/.test(event.key)) return
  event.preventDefault()
}

const rateOptions = computed(() => [
  {
    id: 'usd',
    label: 'USD',
    sub: 'BCV',
    icon: 'bi-bank',
    value: store.bcvRates.usd,
    color: 'primary text-white',
  },
  {
    id: 'eur',
    label: 'EUR',
    sub: 'BCV',
    icon: 'bi-currency-euro',
    value: store.bcvRates.eur,
    color: store.theme === 'dark' ? 'white text-dark' : 'secondary text-white',
  },
  {
    id: 'usdt',
    label: 'USDT',
    sub: 'P2P',
    icon: 'bi-wallet2',
    value: store.usdtRate,
    color: 'success text-white',
  },
])

const currentRate = computed(() => {
  const match = rateOptions.value.find((option) => option.id === selectedRate.value)
  return match?.value ?? null
})

const normalizeMoneyInput = (raw) => {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return 0
  const value = Number(digits) / 100
  return Number.isNaN(value) ? 0 : value
}

const updateFromUsd = (event) => {
  const val = normalizeMoneyInput(event.target.value)
  usdAmount.value = val
  if (currentRate.value) {
    vesAmount.value = val * currentRate.value
  }
}

const updateFromVes = (event) => {
  const val = normalizeMoneyInput(event.target.value)
  vesAmount.value = val
  if (currentRate.value) {
    usdAmount.value = val / currentRate.value
  }
}

const setPreset = (amount) => {
  usdAmount.value = amount
  if (currentRate.value) {
    vesAmount.value = amount * currentRate.value
  }
}

watch(currentRate, (newRate) => {
  if (newRate && usdAmount.value > 0) {
    vesAmount.value = usdAmount.value * newRate
  }
})

const presetAmounts = [5, 10, 20, 50, 100]

const copyAmount = async (value, label) => {
  if (!value && value !== 0) return
  try {
    await navigator.clipboard.writeText(store.formatMoney(value))
    store.showCopyNotification({
      message: `Copiado`,
      type: 'success',
      icon: 'bi-check-lg',
    })
  } catch (error) {
    console.error('No se pudo copiar', error)
    store.showCopyNotification({
      message: 'No se pudo copiar al portapapeles',
      type: 'danger',
      icon: 'bi-exclamation-triangle-fill',
    })
  }
}
</script>

<template>
  <div class="d-flex justify-content-center">
    <div
      class="card border-0 rounded-4 overflow-hidden w-100"
      :class="store.theme === 'dark' ? 'bg-dark' : 'bg-transparent'"
    >
      <!-- Header with Gradient -->
      <div :class="['px-3 py-1', { 'text-white': store.theme === 'dark' }]">
        <h5 class="mb-0 fw-bold"><i class="bi bi-arrow-left-right me-2"></i>Conversor</h5>
        <div class="small opacity-75" style="font-size: 0.8rem">Calculadora de Cambio Rápida</div>
      </div>
      <div class="card-body p-3">
        <!-- Input Section USD -->
        <div
          class="p-2 rounded-4 shadow-sm mb-2 position-relative"
          :class="
            store.theme === 'dark' ? 'bg-secondary bg-opacity-10 border-secondary' : 'bg-white'
          "
        >
          <label
            class="small text-center fw-bold d-block mb-1 text-uppercase"
            :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
            style="font-size: 0.7rem"
            >Monto en Divisa ({{ selectedRate.toUpperCase() }})</label
          >
          <div class="d-flex align-items-center justify-content-center mb-2 gap-2">
            <span class="fs-2 mx-2" :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
              >$</span
            >
            <input
              type="text"
              inputmode="decimal"
              class="form-control border-0 p-0 fs-1 fw-bold text-center shadow-none bg-transparent"
              :class="store.theme === 'dark' ? 'text-white' : 'text-dark'"
              :value="usdAmount != null && usdAmount > 0 ? store.formatMoney(usdAmount) : ''"
              @input="updateFromUsd"
              @keydown="blockNonNumeric"
              placeholder="0,00"
              style="max-width: 300px"
              id="input-usd"
              autocomplete="off"
            />
            <button
              type="button"
              class="btn btn-link"
              title="Copiar USD"
              aria-label="Copiar USD"
              @click="copyAmount(usdAmount, 'USD')"
            >
              <i class="bi bi-copy"></i>
            </button>
          </div>
          <!-- Preset Badges -->
          <div class="d-flex justify-content-center gap-2 flex-wrap mt-2">
            <button
              v-for="preset in presetAmounts"
              :key="preset"
              @click="setPreset(preset)"
              class="btn btn-sm btn-outline-primary rounded-pill py-1 px-3 border-opacity-25 shadow-sm preset-btn"
              style="font-size: 0.75rem"
            >
              ${{ preset }}
            </button>
          </div>
        </div>

        <!-- Divider with Arrow -->
        <div class="position-relative my-2 text-center" style="height: 30px">
          <hr
            class="opacity-10 position-absolute top-50 w-100 m-0 z-0"
            :class="store.theme === 'dark' ? 'border-light' : 'border-secondary'"
          />
          <div
            class="position-relative z-1 d-inline-block px-2"
            :class="store.theme === 'dark' ? 'bg-dark' : 'bg-white'"
          >
            <div
              class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
              style="width: 28px; height: 28px"
            >
              <i class="bi bi-arrow-down-up fw-bold" style="font-size: 0.8rem"></i>
            </div>
          </div>
        </div>

        <!-- Result Section (Editable VES) -->
        <div
          class="p-2 mb-3 rounded-4 shadow-sm border border-primary border-opacity-10 text-center position-relative overflow-hidden"
          :class="store.theme === 'dark' ? 'bg-secondary bg-opacity-10' : 'bg-white'"
        >
          <div
            class="position-absolute top-0 start-0 w-100 h-100 bg-primary opacity-5 pointer-events-none"
          ></div>
          <label
            class="small text-primary fw-bold d-block mb-0 text-uppercase position-relative"
            style="font-size: 0.7rem"
            >Monto en Bolívares</label
          >
          <div class="d-flex align-items-center justify-content-center position-relative gap-2">
            <span class="text-primary opacity-50 mx-2 fw-bold" style="font-size: 1.2rem">Bs.</span>
            <input
              type="text"
              inputmode="decimal"
              class="form-control border-0 p-0 fs-1 fw-bold text-primary text-center shadow-none bg-transparent"
              :value="vesAmount != null && vesAmount > 0 ? store.formatMoney(vesAmount) : ''"
              @input="updateFromVes"
              @keydown="blockNonNumeric"
              placeholder="0,00"
              style="max-width: 300px"
              id="input-ves"
              autocomplete="off"
            />
            <button
              type="button"
              class="btn btn-link"
              title="Copiar VES"
              aria-label="Copiar bolívares"
              @click="copyAmount(vesAmount, 'VES')"
            >
              <i class="bi bi-copy"></i>
            </button>
          </div>
          <!-- <div class="small text-muted position-relative" style="font-size: 0.75rem">VES</div> -->
        </div>
        <!-- Rate Selector -->
        <div class="mb-3">
          <div class="row mx-auto g-lg-4 g-2 col-lg-7">
            <div class="col mb-lg-2" v-for="option in rateOptions" :key="option.id">
              <input
                type="radio"
                class="btn-check"
                :name="'rate-option'"
                :id="'rate-' + option.id"
                :value="option.id"
                v-model="selectedRate"
                autocomplete="off"
              />
              <label
                class="btn w-100 h-100 d-flex flex-column align-items-center justify-content-center py-2 rounded-3 border-0 shadow-sm"
                :class="[
                  selectedRate === option.id
                    ? `bg-${option.color} `
                    : store.theme === 'dark'
                      ? 'bg-secondary bg-opacity-25 text-light'
                      : 'bg-white text-secondary',
                ]"
                :for="'rate-' + option.id"
              >
                <i :class="['bi', option.icon, 'fs-6 mb-1']"></i>
                <span class="fw-bold lh-1 small">{{ option.label }}</span>
                <span class="opacity-75 lh-1 mt-1" style="font-size: 0.7rem">{{ option.sub }}</span>
              </label>
            </div>
          </div>

          <!-- Current Rate Display -->
          <div class="text-center mt-2 collapse show" v-if="currentRate">
            <div
              class="d-inline-flex align-items-center px-3 py-1 rounded-pill shadow-sm border"
              :class="
                store.theme === 'dark'
                  ? 'bg-secondary bg-opacity-25 border-secondary'
                  : 'bg-white border-light'
              "
            >
              <i class="bi bi-info-circle text-primary me-2" style="font-size: 0.8rem"></i>
              <span
                class="small"
                :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
                style="font-size: 0.75rem"
              >
                1 {{ selectedRate.toUpperCase() }} =
                <span class="fw-bold" :class="store.theme === 'dark' ? 'text-white' : 'text-dark'"
                  >{{ store.formatMoney(currentRate) }} VES</span
                >
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
}
.opacity-5 {
  opacity: 0.05;
}
.pointer-events-none {
  pointer-events: none;
}
/* Smooth Transitions */
.btn {
  transition: all 0.2s ease-in-out;
}
.btn:hover:not(.active) {
  transform: translateY(-2px);
}
</style>
