'use client'

import { useEffect, useState } from 'react'
import { useMapStore } from '@/store/useMapStore'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { getPassesForPoint } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { SatellitePass } from '@/types/satellite'

export default function PassList() {
  const selectedPoint = useMapStore((s) => s.selectedPoint)
  const locale = useMapStore((s) => s.locale)
  const satellites = useSatelliteStore((s) => s.satellites)
  const selectSatellite = useSatelliteStore((s) => s.selectSatellite)
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite)
  const [passes, setPasses] = useState<SatellitePass[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedPoint) {
      setPasses([])
      return
    }

    let cancelled = false
    setLoading(true)

    getPassesForPoint(selectedPoint.lat, selectedPoint.lon, 24)
      .then((data) => {
        if (!cancelled) setPasses(data)
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedPoint])

  // Refresh passes periodically (every 30 seconds)
  useEffect(() => {
    if (!selectedPoint) return
    
    const interval = setInterval(() => {
      getPassesForPoint(selectedPoint.lat, selectedPoint.lon, 24)
        .then(setPasses)
        .catch(console.error)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [selectedPoint])

  if (!selectedPoint) return null

  const now = Date.now()
  const sixtyMinMs = 60 * 60 * 1000

  function isWithinNextHour(aosIso: string): boolean {
    const aosTime = new Date(aosIso).getTime()
    return aosTime > now && aosTime - now <= sixtyMinMs
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed bottom-14 left-4 z-50 w-72 max-h-80 overflow-y-auto bg-zinc-900 rounded-xl p-4 text-white shadow-lg pointer-events-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold">
          {t('passes.title', locale)} ({selectedPoint.lat.toFixed(2)},{' '}
          {selectedPoint.lon.toFixed(2)})
        </h3>
        <button
          onClick={() => useMapStore.getState().setSelectedPoint(null)}
          className="text-zinc-400 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>

      {loading && <p className="text-zinc-400 text-sm">Loading...</p>}

      {!loading && passes.length === 0 && (
        <p className="text-zinc-400 text-sm">No passes found</p>
      )}

      <div className="space-y-2">
        {passes.map((pass, i) => {
          const highlight = isWithinNextHour(pass.aos)
          const isSelected = selectedSatellite?.noradId === pass.noradId
          return (
            <button
              key={`${pass.noradId}-${i}`}
              onClick={() => {
                const sat = satellites.find(
                  (s) => s.noradId === pass.noradId
                )
                if (sat) selectSatellite(sat)
              }}
              className={`w-full text-left p-2 rounded text-sm relative ${
                highlight
                  ? 'border border-emerald-500 bg-zinc-800'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 text-xs bg-blue-500 text-white px-1 rounded">
                  Selected
                </span>
              )}
              <p className="font-medium">{pass.name}</p>
              <p className="text-zinc-400 text-xs">
                AOS: {formatTime(pass.aos)} — LOS: {formatTime(pass.los)}
              </p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-zinc-700 text-xs">
                {pass.maxElevationDeg.toFixed(1)}°
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
