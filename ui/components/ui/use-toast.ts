"use client"

import { useState, useEffect, useCallback } from "react"

type ToastType = "success" | "error" | "info" | "default"

interface ToastState {
  message: string
  type: ToastType
  duration?: number
}

export function useToast() {
  const [toastState, setToastState] = useState<ToastState | null>(null)

  const toast = useCallback(
    ({ title, description, variant = "default" }: { title: string; description: string; variant?: ToastType }) => {
      setToastState({ message: `${title}: ${description}`, type: variant as ToastType, duration: 3000 })
    },
    [],
  )

  useEffect(() => {
    if (toastState) {
      const timer = setTimeout(() => {
        setToastState(null)
      }, toastState.duration)

      return () => clearTimeout(timer)
    }
  }, [toastState])

  return { toast, toastState }
}

