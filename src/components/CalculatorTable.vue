<script setup>
import { computed, ref } from 'vue'
import { useRatesStore } from '../stores/rates.js'

const store = useRatesStore()
const viewMode = ref('table')

const formatRate = (value) => {
  if (value == null) return '--'
  return store.formatMoney(value)
}

const totalUsd = computed(() => store.items.reduce((sum, item) => sum + (item.price || 0), 0))

const totalBsBcv = computed(() => {
  if (!store.bcvRates.usd) return 0
  return totalUsd.value * store.bcvRates.usd
})

const copyTotalUsd = async () => {
  if (!totalUsd.value) return
  try {
    await navigator.clipboard.writeText(store.formatMoney(totalUsd.value))
    store.showCopyNotification({
      message: 'Copiado',
      type: 'success',
      icon: 'bi-check-lg',
    })
  } catch (error) {
    console.error('No se pudo copiar el total', error)
    store.showCopyNotification({
      message: 'Error',
      type: 'danger',
      icon: 'bi-exclamation-triangle-fill',
    })
  }
}

const copyTotalBsBcv = async () => {
  if (!totalBsBcv.value) return
  try {
    await navigator.clipboard.writeText(store.formatMoney(totalBsBcv.value))
    store.showCopyNotification({
      message: 'Copiado',
      type: 'success',
      icon: 'bi-check-lg',
    })
  } catch (error) {
    console.error('No se pudo copiar el total en Bs', error)
    store.showCopyNotification({
      message: 'Error',
      type: 'danger',
      icon: 'bi-exclamation-triangle-fill',
    })
  }
}

const isTableView = computed(() => viewMode.value === 'table')

const lockButtonClasses = (item, field) => {
  const isLocked = item.lockedField === field
  return [
    isLocked ? 'text-warning' : 'opacity-25',
    isLocked ? '' : store.theme === 'dark' ? 'text-white-50' : 'text-muted',
  ]
}

const themedBadgeClass = (light, dark) => (store.theme === 'dark' ? dark : light)
</script>

<template>
  <div class="mb-4">
    <div class="d-flex justify-content-between align-items-center mb-4 mt-1">
      <h5 :class="['fw-bold', 'mb-0', 'me-2', store.theme === 'dark' ? 'text-white' : 'text-dark']">
        Calculadora de Precios
      </h5>
      <div class="d-flex gap-2">
        <div class="btn-group" role="group" aria-label="Cambiar vista">
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm rounded-start-pill px-3 btn-custom small"
            :class="isTableView ? 'active' : ''"
            title="Vista tabla"
            aria-label="Vista tabla"
            @click="viewMode = 'table'"
          >
            <i class="bi bi-table"></i>
          </button>
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm rounded-end-pill px-3 btn-custom small"
            :class="!isTableView ? 'active' : ''"
            title="Vista tarjetas"
            aria-label="Vista tarjetas"
            @click="viewMode = 'cards'"
          >
            <i class="bi bi-grid-fill"></i>
          </button>
        </div>
        <button
          @click="store.downloadReport"
          class="btn btn-success btn-sm rounded-pill px-3 btn-custom small"
          title="Descargar reporte"
          aria-label="Descargar reporte"
        >
          <i class="bi bi-download"></i>
        </button>
        <button
          @click="store.addItem"
          class="btn btn-primary btn-sm rounded-pill px-3 btn-custom small"
          title="Agregar item"
          aria-label="Agregar item"
        >
          <i class="bi bi-plus-lg"></i>
        </button>
      </div>
    </div>
    <div class="d-flex flex-wrap justify-content-between gap-2 mb-3">
      <span
        class="badge col"
        :class="[
          'badge-rate',
          themedBadgeClass(
            'bg-light text-dark border border-light',
            'bg-dark border border-white-25 text-white-75',
          ),
        ]"
      >
        <i class="bi bi-currency-euro me-1"></i>
        {{ formatRate(store.bcvRates.eur) }}
      </span>
      <span
        class="badge col"
        :class="[
          'badge-rate',
          themedBadgeClass(
            'bg-success-subtle text-success border border-success-subtle',
            'bg-dark border border-success text-success',
          ),
        ]"
      >
        <i class="bi bi-currency-dollar me-1"></i>
        {{ formatRate(store.bcvRates.usd) }}
      </span>
      <span
        class="badge col"
        :class="[
          'badge-rate',
          themedBadgeClass(
            'bg-warning-subtle text-dark border border-warning-subtle',
            'bg-dark border border-warning text-warning',
          ),
        ]"
      >
        <i class="bi bi-coin me-1"></i>
        {{ formatRate(store.usdtRate) }}
      </span>
      <span
        class="badge col"
        :class="[
          'badge-rate',
          themedBadgeClass(
            'bg-danger-subtle text-danger border border-danger-subtle',
            'bg-dark border border-danger text-danger',
          ),
        ]"
      >
        <i class="bi bi-graph-up me-1"></i>
        {{ store.gap ? store.gap + '%' : '--' }}
      </span>
      <span
        v-if="totalUsd > 0"
        class="badge justify-content-end gap-3 col-lg-4 col col-md-5"
        :class="[
          'badge-rate',
          themedBadgeClass(
            'bg-info-subtle text-muted ps-3 ps-3 border border-info-subtle',
            'bg-dark border  border-info text-info',
          ),
        ]"
        role="button"
        tabindex="0"
        @click="copyTotalUsd"
        title="Copiar total en USD"
      >
        Total $: {{ store.formatMoney(totalUsd) }}
        <i class="bi bi-clipboard me-1"></i>
      </span>
      <span
        v-if="totalBsBcv > 0"
        class="badge justify-content-end gap-3 col-lg-4 col col-md-5"
        :class="[
          'badge-rate',
          themedBadgeClass(
            'bg-info-subtle text-muted ps-3 border border-info-subtle',
            'bg-dark border border-info text-info',
          ),
        ]"
        role="button"
        tabindex="0"
        @click="copyTotalBsBcv"
        title="Copiar total en Bs (BCV $)"
      >
        Total Bs (BCV $): {{ store.formatMoney(totalBsBcv) }}
        <i class="bi bi-clipboard me-1"></i>
      </span>
    </div>
    <div
      v-if="isTableView"
      class="table-responsive rounded-3 border shadow-sm"
      :class="store.theme === 'dark' ? 'border-secondary' : 'border-light'"
    >
      <table
        class="table table-hover mb-0 align-middle text-center small-table text-nowrap"
        :class="store.theme === 'dark' ? 'table-dark text-white' : 'table-striped'"
      >
        <thead :class="store.theme === 'dark' ? 'bg-black text-white' : 'bg-light text-secondary'">
          <tr>
            <th class="fw-bold text-start ps-3">Item</th>
            <th class="fw-bold">Precio ($)</th>
            <th class="fw-bold">Bs (BCV $)</th>
            <th class="fw-bold">Bs (BCV €)</th>
            <th class="fw-bold">Bs (P2P)</th>
            <th class="fw-bold text-danger">Reposición ($)</th>
            <th>Quitar</th>
          </tr>
        </thead>
        <tbody :class="store.theme === 'dark' ? 'bg-dark' : 'bg-white'">
          <tr v-for="item in store.items" :key="item.id">
            <td class="ps-3">
              <input
                type="text"
                class="form-control form-control-sm border-0 bg-transparent fw-bold"
                :class="store.theme === 'dark' ? 'text-white' : 'text-dark'"
                v-model="item.name"
                placeholder="Nombre"
              />
            </td>
            <td>
              <div class="input-group input-group-sm">
                <input
                  type="text"
                  inputmode="decimal"
                  class="form-control text-center border-0 bg-transparent fw-bold"
                  :class="store.theme === 'dark' ? 'text-white' : 'text-dark'"
                  :value="store.formatMoney(item.price)"
                  @input="store.updateFromPrice(item, $event.target.value)"
                  min="0"
                  step="0.01"
                />
                <button
                  class="btn border-0 px-1"
                  :class="lockButtonClasses(item, 'price')"
                  @click="store.toggleLock(item, 'price')"
                  title="Fijar valor"
                  aria-label="Fijar valor"
                >
                  <i class="bi bi-lock-fill"></i>
                </button>
              </div>
            </td>
            <td>
              <div class="input-group input-group-sm">
                <input
                  type="text"
                  inputmode="decimal"
                  class="form-control text-center border-0 bg-transparent"
                  :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
                  :value="store.formatMoney(store.calculateBs(item.price, store.bcvRates.usd))"
                  @input="store.updateFromBs(item, $event.target.value, store.bcvRates.usd)"
                  step="0.01"
                />
                <button
                  class="btn border-0 px-1"
                  :class="lockButtonClasses(item, 'bs_usd')"
                  @click="store.toggleLock(item, 'bs_usd')"
                  title="Fijar valor"
                  aria-label="Fijar valor"
                >
                  <i class="bi bi-lock-fill"></i>
                </button>
              </div>
            </td>
            <td>
              <div class="input-group input-group-sm">
                <input
                  type="text"
                  inputmode="decimal"
                  class="form-control text-center border-0 bg-transparent"
                  :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
                  :value="store.formatMoney(store.calculateBs(item.price, store.bcvRates.eur))"
                  @input="store.updateFromBs(item, $event.target.value, store.bcvRates.eur)"
                  step="0.01"
                />
                <button
                  class="btn border-0 px-1"
                  :class="lockButtonClasses(item, 'bs_eur')"
                  @click="store.toggleLock(item, 'bs_eur')"
                  title="Fijar valor"
                  aria-label="Fijar valor"
                >
                  <i class="bi bi-lock-fill"></i>
                </button>
              </div>
            </td>
            <td>
              <div class="input-group input-group-sm">
                <input
                  type="text"
                  inputmode="decimal"
                  class="form-control text-center border-0 bg-transparent"
                  :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
                  :value="store.formatMoney(store.calculateBs(item.price, store.usdtRate))"
                  @input="store.updateFromBs(item, $event.target.value, store.usdtRate)"
                  step="0.01"
                />
                <button
                  class="btn border-0 px-1"
                  :class="lockButtonClasses(item, 'bs_p2p')"
                  @click="store.toggleLock(item, 'bs_p2p')"
                  title="Fijar valor"
                  aria-label="Fijar valor"
                >
                  <i class="bi bi-lock-fill"></i>
                </button>
              </div>
            </td>
            <td>
              <div class="input-group input-group-sm">
                <input
                  type="text"
                  inputmode="decimal"
                  class="form-control text-center border-0 bg-transparent fw-bold text-danger"
                  :value="store.formatMoney(store.calculateReposition(item.price))"
                  @input="store.updateFromReposition(item, $event.target.value)"
                  step="0.01"
                />
                <button
                  class="btn border-0 px-1"
                  :class="lockButtonClasses(item, 'reposition')"
                  @click="store.toggleLock(item, 'reposition')"
                  title="Fijar valor"
                  aria-label="Fijar valor"
                >
                  <i class="bi bi-lock-fill"></i>
                </button>
              </div>
            </td>
            <td>
              <button
                @click="store.removeItem(item.id)"
                class="btn btn-link text-danger p-0 btn-sm"
                title="Eliminar"
                aria-label="Eliminar"
              >
                <i class="bi bi-trash-fill"></i>
              </button>
            </td>
          </tr>
          <tr v-if="store.items.length === 0">
            <td
              colspan="7"
              class="text-center py-3 fst-italic"
              :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
            >
              No hay items. Agrega uno para calcular.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="row g-2">
      <div
        v-for="(item, index) in store.items"
        :key="item.id"
        class="col-12 col-sm-6 col-lg-4 col-xl-3"
      >
        <div
          class="card border-1 rounded-3 shadow-sm compact-card"
          :class="store.theme === 'dark' ? 'bg-dark text-white border-secondary' : ''"
        >
          <div class="card-body p-2">
            <!-- Row 1: Name + Delete -->
            <div class="d-flex align-items-center gap-1 mb-1">
              <input
                type="text"
                class="form-control form-control-sm border-0 bg-transparent fw-bold px-1 py-0"
                :class="store.theme === 'dark' ? 'text-white' : 'text-dark'"
                style="font-size: 0.75rem; height: 24px"
                v-model="item.name"
                placeholder="Item {{ index + 1 }}"
              />
              <button
                @click="store.removeItem(item.id)"
                class="btn btn-sm px-1 py-0 border-0"
                :class="store.theme === 'dark' ? 'text-white-50' : 'text-muted'"
                title="Eliminar"
                aria-label="Eliminar"
              >
                <i class="bi bi-x-lg" style="font-size: 0.65rem"></i>
              </button>
            </div>
            <!-- Row 2: Price with $ prefix -->
            <div class="input-group input-group-sm mb-1">
              <span
                class="input-group-text border-0 fw-bold px-1"
                :class="store.theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'"
                style="font-size: 0.75rem"
                >$</span
              >
              <input
                type="text"
                inputmode="decimal"
                class="form-control text-center border-0 fw-bold shadow-none"
                :class="store.theme === 'dark' ? 'bg-dark text-white' : 'bg-light text-dark'"
                style="font-size: 0.8rem; height: 26px"
                :value="store.formatMoney(item.price)"
                @input="store.updateFromPrice(item, $event.target.value)"
                min="0"
                step="0.01"
              />
              <button
                class="btn border-0 px-1"
                :class="lockButtonClasses(item, 'price')"
                @click="store.toggleLock(item, 'price')"
                title="Fijar valor"
                aria-label="Fijar valor"
                style="font-size: 0.65rem"
              >
                <i class="bi bi-lock-fill"></i>
              </button>
            </div>
            <!-- Row 3: 4 compact fields -->
            <div class="row g-1">
              <div class="col-3 px-1">
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-control text-center border-0 rounded-1 px-0"
                    :class="
                      store.theme === 'dark'
                        ? 'bg-black bg-opacity-25 text-white-50'
                        : 'bg-light text-muted'
                    "
                    style="font-size: 0.65rem; height: 22px"
                    :value="store.formatMoney(store.calculateBs(item.price, store.bcvRates.usd))"
                    @input="store.updateFromBs(item, $event.target.value, store.bcvRates.usd)"
                    step="0.01"
                    title="BCV $"
                  />
                  <button
                    class="btn border-0 px-0 d-flex align-items-center"
                    :class="lockButtonClasses(item, 'bs_usd')"
                    @click="store.toggleLock(item, 'bs_usd')"
                    title="Fijar valor"
                    aria-label="Fijar valor"
                    style="font-size: 0.5rem"
                  >
                    <i class="bi bi-lock-fill"></i>
                  </button>
                </div>
              </div>
              <div class="col-3 px-1">
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-control text-center border-0 rounded-1 px-0"
                    :class="
                      store.theme === 'dark'
                        ? 'bg-black bg-opacity-25 text-white-50'
                        : 'bg-light text-muted'
                    "
                    style="font-size: 0.65rem; height: 22px"
                    :value="store.formatMoney(store.calculateBs(item.price, store.bcvRates.eur))"
                    @input="store.updateFromBs(item, $event.target.value, store.bcvRates.eur)"
                    step="0.01"
                    title="BCV €"
                  />
                  <button
                    class="btn border-0 px-0 d-flex align-items-center"
                    :class="lockButtonClasses(item, 'bs_eur')"
                    @click="store.toggleLock(item, 'bs_eur')"
                    title="Fijar valor"
                    aria-label="Fijar valor"
                    style="font-size: 0.5rem"
                  >
                    <i class="bi bi-lock-fill"></i>
                  </button>
                </div>
              </div>
              <div class="col-3 px-1">
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-control text-center border-0 rounded-1 px-0"
                    :class="
                      store.theme === 'dark'
                        ? 'bg-black bg-opacity-25 text-white-50'
                        : 'bg-light text-muted'
                    "
                    style="font-size: 0.65rem; height: 22px"
                    :value="store.formatMoney(store.calculateBs(item.price, store.usdtRate))"
                    @input="store.updateFromBs(item, $event.target.value, store.usdtRate)"
                    step="0.01"
                    title="P2P"
                  />
                  <button
                    class="btn border-0 px-0 d-flex align-items-center"
                    :class="lockButtonClasses(item, 'bs_p2p')"
                    @click="store.toggleLock(item, 'bs_p2p')"
                    title="Fijar valor"
                    aria-label="Fijar valor"
                    style="font-size: 0.5rem"
                  >
                    <i class="bi bi-lock-fill"></i>
                  </button>
                </div>
              </div>
              <div class="col-3 px-1">
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-control text-center border-0 rounded-1 px-0 fw-semibold text-danger"
                    :class="store.theme === 'dark' ? 'bg-black bg-opacity-25' : 'bg-light'"
                    style="font-size: 0.65rem; height: 22px"
                    :value="store.formatMoney(store.calculateReposition(item.price))"
                    @input="store.updateFromReposition(item, $event.target.value)"
                    step="0.01"
                    title="Reposición"
                  />
                  <button
                    class="btn border-0 px-0 d-flex align-items-center"
                    :class="lockButtonClasses(item, 'reposition')"
                    @click="store.toggleLock(item, 'reposition')"
                    title="Fijar valor"
                    aria-label="Fijar valor"
                    style="font-size: 0.5rem"
                  >
                    <i class="bi bi-lock-fill"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="store.items.length === 0" class="col-12">
        <div class="text-center py-3 text-muted fst-italic">
          No hay items. Agrega uno para calcular.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.small-table {
  font-size: 0.75rem;
  min-width: 850px;
}
/* scroll */
.table-responsive::-webkit-scrollbar {
  height: 6px;
}
.table-responsive::-webkit-scrollbar-track {
  background: transparent;
}
.table-responsive::-webkit-scrollbar-thumb {
  background-color: rgba(134, 134, 134, 0.349);
  border-radius: 4px;
}

.small-table input {
  font-size: 0.75rem;
  min-width: 80px;
}

.badge-rate {
  font-size: 0.8rem;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.compact-card {
  transition: box-shadow 0.2s ease;
}

.compact-card:hover {
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.12) !important;
}

.compact-card input:focus {
  box-shadow: none !important;
}
</style>
