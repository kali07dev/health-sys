// components/ui/use-toast.ts
import { useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  title?: string
  description: string
  type: ToastType
}

interface ToastFunction {
  (props: { title?: string; description: string; type?: ToastType }): void
}

export function useToast() {
  const [toastState, setToastState] = useState<ToastState | null>(null)

  const toast: ToastFunction = useCallback(({ title, description, type = 'info' }) => {
    setToastState({ title, description, type })
  }, [])

  return { toast, toastState }
}