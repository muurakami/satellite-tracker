'use client'

import { useEffect, useState } from 'react'
import { useSatelliteStore, type PassAlert } from '@/store/useSatelliteStore'
import { startPassNotifier } from '@/lib/pass-notifier'
import { useStopMapPropagation } from '@/hooks/useStopMapPropagation'

// Orbit type colors
const ORBIT_COLORS: Record<string, string> = {
  LEO: '#00ff88',
  MEO: '#ffaa00',
  GEO: '#ff4466',
  HEO: '#aa88ff',
}

interface ToastItem {
  alert: PassAlert
  remainingSeconds: number
}

function getOrbitColor(satelliteName: string): string {
  // Default to LEO color
  return ORBIT_COLORS.LEO
}

export default function NotificationToast() {
  const { ref: panelRef, stopProps } = useStopMapPropagation()
  const passAlerts = useSatelliteStore((s) => s.passAlerts)
  const dismissPassAlert = useSatelliteStore((s) => s.dismissPassAlert)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())

  // Start/stop pass notifier
  useEffect(() => {
    const cleanup = startPassNotifier()
    return cleanup
  }, [])

  // Convert alerts to toasts, filter dismissed, limit to 3
  useEffect(() => {
    const active = passAlerts
      .filter((a) => !a.dismissed)
      .slice(0, 3)
      .map((alert) => ({
        alert,
        remainingSeconds: 10,
      }))

    setToasts(active)
  }, [passAlerts])

  // Countdown timer - update every second
  useEffect(() => {
    if (toasts.length === 0) return

    const interval = setInterval(() => {
      setToasts((prev) =>
        prev.map((t) => ({
          ...t,
          remainingSeconds: Math.max(0, t.remainingSeconds - 1),
        }))
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [toasts.length])

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    for (const toast of toasts) {
      if (toast.remainingSeconds <= 0) {
        handleDismiss(toast.alert.id)
      }
    }
  }, [toasts])

  const handleDismiss = (id: string) => {
    // Start exit animation
    setExitingIds((prev) => new Set(prev).add(id))

    // Actually dismiss after animation
    setTimeout(() => {
      dismissPassAlert(id)
      setExitingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }

  if (toasts.length === 0) return null

  return (
    <div ref={panelRef} {...stopProps} className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
      {toasts.map((toast) => {
        const isExiting = exitingIds.has(toast.alert.id)
        const progress = (toast.remainingSeconds / 10) * 100

        return (
          <div
            key={toast.alert.id}
            className={`w-72 bg-zinc-900 border-l-4 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
              isExiting ? 'opacity-0 translate-x-4' : 'animate-slide-in'
            }`}
            style={{ borderLeftColor: getOrbitColor(toast.alert.satelliteName) }}
          >
            {/* Content */}
            <div className="p-3">
              {/* Header with close button */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛰️</span>
                  <span className="font-semibold text-white text-sm truncate">
                    {toast.alert.satelliteName}
                  </span>
                </div>
                <button
                  onClick={() => handleDismiss(toast.alert.id)}
                  className="text-zinc-400 hover:text-white text-lg leading-none -m-1 p-1"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>

              {/* Countdown */}
              <p className="text-emerald-400 font-medium text-sm mt-1">
                Passes in {toast.alert.minutesUntil} min
              </p>

              {/* Details */}
              <p className="text-zinc-400 text-xs mt-1">
                Max elevation: {toast.alert.maxElevationDeg.toFixed(1)}°
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-zinc-800">
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  backgroundColor: getOrbitColor(toast.alert.satelliteName),
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
