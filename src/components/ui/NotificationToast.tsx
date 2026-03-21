'use client'

import { useEffect, useState, useCallback } from 'react'
import wsClient from '@/lib/ws-client'
import type { PassNotification } from '@/types/satellite'

interface ToastItem {
  id: number
  notification: PassNotification
}

let nextId = 0

export default function NotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [queue, setQueue] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    if (toasts.length < 3 && queue.length > 0) {
      const [next, ...rest] = queue
      setQueue(rest)
      setToasts((prev) => [...prev, next])
    }
  }, [toasts.length, queue])

  useEffect(() => {
    const handleNotification = (n: PassNotification) => {
      const item: ToastItem = { id: nextId++, notification: n }
      setToasts((prev) => {
        if (prev.length < 3) return [...prev, item]
        setQueue((q) => [...q, item])
        return prev
      })
    }

    wsClient.subscribeToNotifications(handleNotification)
  }, [])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (const toast of toasts) {
      const timer = setTimeout(() => {
        removeToast(toast.id)
      }, 8000)
      timers.push(timer)
    }
    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [toasts, removeToast])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm shadow-lg max-w-xs"
        >
          <p>
            🛰 {toast.notification.satelliteName} passes in{' '}
            {toast.notification.minutesUntilAos} min | Max elevation:{' '}
            {toast.notification.maxElevation}°
          </p>
        </div>
      ))}
    </div>
  )
}
