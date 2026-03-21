'use client'

import { useEffect, useState } from 'react'
import { useMapStore } from '@/store/useMapStore'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { getPassesForPoint } from '@/lib/api'
import { calculatePasses } from '@/lib/pass-predictor'
import { t } from '@/lib/i18n'
import type { SatellitePass } from '@/types/satellite'

function formatCoord(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lonDir = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(1)}°${latDir} ${Math.abs(lon).toFixed(1)}°${lonDir}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }) + ' UTC'
}

function formatDuration(aosIso: string, losIso: string): string {
  const aos = new Date(aosIso).getTime()
  const los = new Date(losIso).getTime()
  const minutes = Math.round((los - aos) / 60000)
  return `${minutes} min`
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-12 bg-zinc-800 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export default function PassList() {
  const selectedPoint = useMapStore((s) => s.selectedPoint)
  const locale = useMapStore((s) => s.locale)
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint)
  const satellites = useSatelliteStore((s) => s.satellites)
  const selectSatellite = useSatelliteStore((s) => s.selectSatellite)
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite)

  const [passes, setPasses] = useState<SatellitePass[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!selectedPoint) {
      setPasses([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    // Try API first, fallback to client-side calculation
    getPassesForPoint(selectedPoint.lat, selectedPoint.lon, 24)
      .then((data) => {
        if (!cancelled) {
          setPasses(data)
          setError(false)
        }
      })
      .catch(() => {
        // Fallback to client-side calculation
        if (!cancelled) {
          try {
            const calculated = calculatePasses(
              satellites,
              selectedPoint.lat,
              selectedPoint.lon,
              24
            )
            setPasses(calculated)
            setError(false)
          } catch {
            setError(true)
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedPoint, satellites])

  // Refresh every 30 seconds
  useEffect(() => {
    if (!selectedPoint) return

    const interval = setInterval(() => {
      getPassesForPoint(selectedPoint.lat, selectedPoint.lon, 24)
        .then(setPasses)
        .catch(() => {
          // Silently fail on refresh, keep existing data
        })
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedPoint])

  if (!selectedPoint) return null

  const now = Date.now()
  const thirtyMinMs = 30 * 60 * 1000

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 max-h-96 overflow-y-auto bg-zinc-900/95 backdrop-blur-sm rounded-xl border border-zinc-800 text-white shadow-xl">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">
            {t('passes.title', locale)}
          </h3>
          <p className="text-xs text-zinc-400">
            {formatCoord(selectedPoint.lat, selectedPoint.lon)}
          </p>
        </div>
        <button
          onClick={() => setSelectedPoint(null)}
          className="text-zinc-400 hover:text-white text-lg leading-none p-1 -m-1"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Count badge */}
      <div className="px-4 py-2 bg-zinc-800/50 text-xs text-zinc-400">
        {passes.length} {t('passes.hours24', locale)}
      </div>

      {/* Content */}
      <div className="p-3">
        {loading && <LoadingSkeleton />}

        {!loading && error && (
          <p className="text-zinc-400 text-sm text-center py-4">
            {t('passes.error', locale)}
          </p>
        )}

        {!loading && !error && passes.length === 0 && (
          <p className="text-zinc-400 text-sm text-center py-4">
            {t('passes.empty', locale)}
          </p>
        )}

        {!loading && !error && passes.length > 0 && (
          <div className="space-y-2">
            {passes.map((pass, i) => {
              const aosTime = new Date(pass.aos).getTime()
              const isUpcoming = aosTime > now && aosTime - now <= thirtyMinMs
              const isSelected = selectedSatellite?.noradId === pass.noradId

              return (
                <button
                  key={`${pass.noradId}-${i}`}
                  onClick={() => {
                    const sat = satellites.find((s) => s.noradId === pass.noradId)
                    if (sat) selectSatellite(sat)
                  }}
                  className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                    isUpcoming
                      ? 'border-l-2 border-emerald-500 bg-emerald-500/10'
                      : 'bg-zinc-800/50 hover:bg-zinc-800'
                  } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-sm truncate flex-1">
                      {pass.name}
                    </span>
                    <span className="text-xs text-zinc-400 shrink-0">
                      {formatTime(pass.aos)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                    <span>{formatDuration(pass.aos, pass.los)}</span>
                    <span className="text-emerald-400 font-medium">
                      ↑ {pass.maxElevationDeg.toFixed(1)}°
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
