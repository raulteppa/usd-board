<script setup>
import { computed, ref } from 'vue'
import { useRatesStore } from '../stores/rates.js'

const store = useRatesStore()
const viewMode = ref('table')

const formatRate = (value) => {
  if (value == null) return '--'
  return store.formatMoney(value)
}

const isTableView = computed(() => viewMode.value === 'table')
</script>

<template>
  <div class="mb-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="fw-bold text-secondary mb-0 small me-2">Calculadora de Precios</h6>
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
            <i class="bi bi-grid"></i>
          </button>
        </div>
        <button
          @click="store.downloadReport"
          class="btn btn-outline-success btn-sm rounded-pill px-3 btn-custom small"
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
    <div class="d-flex flex-wrap gap-2 mb-3">
      <span class="badge badge-rate bg-light text-dark border">
        <i class="bi bi-currency-euro me-1"></i>
        {{ formatRate(store.bcvRates.eur) }}
      </span>
      <span class="badge badge-rate bg-success-subtle text-success border border-success-subtle">
        <i class="bi bi-currency-dollar me-1"></i>
        {{ formatRate(store.bcvRates.usd) }}
      </span>
      <span class="badge badge-rate bg-warning-subtle text-dark border">
        <i class="bi bi-coin me-1"></i>
        {{ formatRate(store.usdtRate) }}
      </span>
      <span class="badge badge-rate bg-danger-subtle text-danger border">
        <i class="bi bi-graph-up me-1"></i>
        {{ store.gap ? store.gap + '%' : '--' }}
      </span>
    </div>
    <div v-if="isTableView" class="table-responsive rounded-3 border shadow-sm">
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
            <th>Quitar</th>
          </tr>
        </thead>
        <tbody class="bg-white">
          <tr v-for="item in store.items" :key="item.id">
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
                  type="text"
                  inputmode="decimal"
                  class="form-control text-center border-0 bg-transparent fw-bold text-dark"
                  :value="store.formatMoney(item.price)"
                  @input="store.updateFromPrice(item, $event.target.value)"
                  min="0"
                  step="0.01"
                />
                <button
                  class="btn border-0 px-1"
                  :class="item.lockedField === 'price' ? 'text-primary' : 'text-muted opacity-25'"
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
                  class="form-control text-center border-0 bg-transparent text-muted"
                  :value="store.formatMoney(store.calculateBs(item.price, store.bcvRates.usd))"
                  @input="store.updateFromBs(item, $event.target.value, store.bcvRates.usd)"
                  step="0.01"
                />
                <button
                  class="btn border-0 px-1"
                  :class="item.lockedField === 'bs_usd' ? 'text-primary' : 'text-muted opacity-25'"
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
                  class="form-control text-center border-0 bg-transparent text-muted"
                  :value="store.formatMoney(store.calculateBs(item.price, store.bcvRates.eur))"
                  @input="store.updateFromBs(item, $event.target.value, store.bcvRates.eur)"
                  step="0.01"
                />
                <button
                  class="btn border-0 px-1"
                  :class="item.lockedField === 'bs_eur' ? 'text-primary' : 'text-muted opacity-25'"
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
                  class="form-control text-center border-0 bg-transparent text-muted"
                  :value="store.formatMoney(store.calculateBs(item.price, store.usdtRate))"
                  @input="store.updateFromBs(item, $event.target.value, store.usdtRate)"
                  step="0.01"
                />
                <button
                  class="btn border-0 px-1"
                  :class="item.lockedField === 'bs_p2p' ? 'text-primary' : 'text-muted opacity-25'"
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
                  :class="
                    item.lockedField === 'reposition' ? 'text-primary' : 'text-muted opacity-25'
                  "
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
            <td colspan="7" class="text-center py-3 text-muted fst-italic">
              No hay items. Agrega uno para calcular.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="row g-3">
      <div v-for="item in store.items" :key="item.id" class="col-12">
        <div class="card h-100 border rounded-3 shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <input
                type="text"
                class="form-control me-2 form-control-sm rounded-3 bg-transparent fw-bold text-dark"
                v-model="item.name"
                placeholder="Nombre"
              />
              <button
                @click="store.removeItem(item.id)"
                class="btn btn-danger rounded-3 bg-danger-subtle text-danger btn-sm"
                title="Eliminar"
                aria-label="Eliminar"
              >
                <i class="bi bi-trash-fill"></i>
              </button>
            </div>
            <div class="row g-2">
              <div class="col-12 col-md-6">
                <label class="form-label small text-muted fw-bold mb-1">Precio ($):</label>
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-control text-center border-0 bg-light fw-bold text-dark"
                    :value="store.formatMoney(item.price)"
                    @input="store.updateFromPrice(item, $event.target.value)"
                    min="0"
                    step="0.01"
                  />
                  <button
                    class="btn border-0 px-1"
                    :class="item.lockedField === 'price' ? 'text-primary' : 'text-muted opacity-25'"
                    @click="store.toggleLock(item, 'price')"
                    title="Fijar valor"
                    aria-label="Fijar valor"
                  >
                    <i class="bi bi-lock-fill"></i>
                  </button>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small text-muted fw-bold mb-1">Bs (BCV $):</label>
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-control text-center border-0 bg-light text-muted"
                    :value="store.formatMoney(store.calculateBs(item.price, store.bcvRates.usd))"
                    @input="store.updateFromBs(item, $event.target.value, store.bcvRates.usd)"
                    step="0.01"
                  />
                  <button
                    class="btn border-0 px-1"
                    :class="
                      item.lockedField === 'bs_usd' ? 'text-primary' : 'text-muted opacity-25'
                    "
                    @click="store.toggleLock(item, 'bs_usd')"
                    title="Fijar valor"
                    aria-label="Fijar valor"
                  >
                    <i class="bi bi-lock-fill"></i>
                  </button>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small text-muted fw-bold mb-1">Bs (BCV €):</label>
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-control text-center border-0 bg-light text-muted"
                    :value="store.formatMoney(store.calculateBs(item.price, store.bcvRates.eur))"
                    @input="store.updateFromBs(item, $event.target.value, store.bcvRates.eur)"
                    step="0.01"
                  />
                  <button
                    class="btn border-0 px-1"
                    :class="
                      item.lockedField === 'bs_eur' ? 'text-primary' : 'text-muted opacity-25'
                    "
                    @click="store.toggleLock(item, 'bs_eur')"
                    title="Fijar valor"
                    aria-label="Fijar valor"
                  >
                    <i class="bi bi-lock-fill"></i>
                  </button>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small text-muted fw-bold mb-1">Bs (P2P-USDT):</label>
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-control text-center border-0 bg-light text-muted"
                    :value="store.formatMoney(store.calculateBs(item.price, store.usdtRate))"
                    @input="store.updateFromBs(item, $event.target.value, store.usdtRate)"
                    step="0.01"
                  />
                  <button
                    class="btn border-0 px-1"
                    :class="
                      item.lockedField === 'bs_p2p' ? 'text-primary' : 'text-muted opacity-25'
                    "
                    @click="store.toggleLock(item, 'bs_p2p')"
                    title="Fijar valor"
                    aria-label="Fijar valor"
                  >
                    <i class="bi bi-lock-fill"></i>
                  </button>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small text-muted fw-bold mb-1">Reposición ($):</label>
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    inputmode="decimal"
                    class="form-control text-center border-0 bg-light fw-bold text-danger"
                    :value="store.formatMoney(store.calculateReposition(item.price))"
                    @input="store.updateFromReposition(item, $event.target.value)"
                    step="0.01"
                  />
                  <button
                    class="btn border-0 px-1"
                    :class="
                      item.lockedField === 'reposition' ? 'text-primary' : 'text-muted opacity-25'
                    "
                    @click="store.toggleLock(item, 'reposition')"
                    title="Fijar valor"
                    aria-label="Fijar valor"
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
</style>
