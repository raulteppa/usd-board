import { readonly, ref } from 'vue'

const toasts = ref([])
const DEFAULT_DURATION = 3000

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const removeToast = (id) => {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

export const useToast = () => {
  const showToast = (message, options = {}) => {
    const toast = {
      id: createId(),
      message,
      type: options.type ?? 'info',
      duration: options.duration ?? DEFAULT_DURATION,
    }
    toasts.value.push(toast)
    if (toast.duration > 0) {
      setTimeout(() => removeToast(toast.id), toast.duration)
    }
  }

  return {
    toasts: readonly(toasts),
    showToast,
    removeToast,
  }
}
