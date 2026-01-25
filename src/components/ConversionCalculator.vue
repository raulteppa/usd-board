<script setup>
import { computed, ref, watch } from 'vue'
import { useRatesStore } from '../stores/rates.js'

const store = useRatesStore()
const usdAmount = ref(0)
const vesAmount = ref(0)
const selectedRate = ref('usd')

const rateOptions = computed(() => [
  {
    id: 'usd',
    label: 'USD',
    sub: 'BCV',
    icon: 'bi-bank',
    value: store.bcvRates.usd,
    color: 'primary',
  },
  {
    id: 'eur',
    label: 'EUR',
    sub: 'BCV',
    icon: 'bi-currency-euro',
    value: store.bcvRates.eur,
    color: 'secondary',
  },
  {
    id: 'usdt',
    label: 'USDT',
    sub: 'P2P',
    icon: 'bi-wallet2',
    value: store.usdtRate,
    color: 'success',
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
</script>

<template>
  <div class="d-flex justify-content-center">
    <div class="card border-0 rounded-4 overflow-hidden w-100">
      <!-- Header with Gradient -->
      <div class="px-3 py-1">
        <h5 class="mb-0 fw-bold"><i class="bi bi-arrow-left-right me-2"></i>Conversor</h5>
        <div class="small opacity-75" style="font-size: 0.8rem">Calculadora de Cambio Rápida</div>
      </div>
      <div class="card-body p-3">
        <!-- Input Section USD -->
        <div class="bg-white p-3 rounded-4 shadow-sm mb-3 border position-relative">
          <label
            class="small text-muted text-center fw-bold d-block mb-1 text-uppercase"
            style="font-size: 0.7rem"
            >Monto en Divisa ({{ selectedRate.toUpperCase() }})</label
          >
          <div class="d-flex align-items-center justify-content-center mb-2">
            <span class="fs-2 text-muted me-2">$</span>
            <input
              type="text"
              inputmode="decimal"
              class="form-control border-0 p-0 fs-1 fw-bold text-dark text-center shadow-none bg-transparent"
              :value="store.formatMoney(usdAmount)"
              @input="updateFromUsd"
              placeholder="0,00"
              style="max-width: 200px"
              id="input-usd"
            />
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

        <!-- Rate Selector -->
        <div class="mb-3">
          <div class="row g-2">
            <div class="col" v-for="option in rateOptions" :key="option.id">
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
                :class="
                  selectedRate === option.id
                    ? `bg-${option.color} text-white`
                    : 'bg-white text-secondary'
                "
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
              class="d-inline-flex align-items-center bg-white px-3 py-1 rounded-pill shadow-sm border border-light"
            >
              <i class="bi bi-info-circle text-primary me-2" style="font-size: 0.8rem"></i>
              <span class="text-muted" style="font-size: 0.75rem">
                1 {{ selectedRate.toUpperCase() }} =
                <span class="fw-bold text-dark">{{ store.formatMoney(currentRate) }} VES</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Divider with Arrow -->
        <div class="position-relative my-2 text-center" style="height: 30px">
          <hr class="border-secondary opacity-10 position-absolute top-50 w-100 m-0 z-0" />
          <div class="position-relative z-1 d-inline-block bg-light px-2">
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
          class="bg-white p-3 rounded-4 shadow-sm border border-primary border-opacity-10 text-center position-relative overflow-hidden"
        >
          <div
            class="position-absolute top-0 start-0 w-100 h-100 bg-primary opacity-5 pointer-events-none"
          ></div>
          <label
            class="small text-primary fw-bold d-block mb-0 text-uppercase position-relative"
            style="font-size: 0.7rem"
            >Monto en Bolívares</label
          >
          <div class="d-flex align-items-center justify-content-center position-relative">
            <span class="text-primary opacity-50 me-2 fw-bold" style="font-size: 1.2rem">Bs.</span>
            <input
              type="text"
              inputmode="decimal"
              class="form-control border-0 p-0 fs-1 fw-bold text-primary text-center shadow-none bg-transparent"
              :value="store.formatMoney(vesAmount)"
              @input="updateFromVes"
              placeholder="0,00"
              style="max-width: 220px"
              id="input-ves"
            />
          </div>
          <div class="small text-muted position-relative" style="font-size: 0.75rem">VES</div>
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
