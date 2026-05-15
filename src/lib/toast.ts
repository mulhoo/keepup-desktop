export type ToastVariant = 'success' | 'error'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

type Listener = (item: ToastItem) => void

const listeners = new Set<Listener>()

function emit(item: ToastItem) {
  listeners.forEach(l => l(item))
}

export function subscribeToast(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const toast = {
  success: (message: string) =>
    emit({ id: crypto.randomUUID(), message, variant: 'success' }),
  error: (message: string) =>
    emit({ id: crypto.randomUUID(), message, variant: 'error' }),
}
