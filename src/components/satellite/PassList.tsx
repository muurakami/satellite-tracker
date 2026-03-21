'use client'

import { useEffect, useState } from 'react'
import { useMapStore } from '@/store/useMapStore'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useStopMapPropagation } from '@/hooks/useStopMapPropagation'
import { getPassesForPoint } from '@/lib/api'
import { calculatePasses, calculateGeoVisible } from '@/lib/pass-predictor'
import { t } from '@/lib/i18n'
import type { SatellitePass, GeoSatelliteVisible } from '@/types/satellite'

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
  const { ref: panelRef, stopProps } = useStopMapPropagation()
  const selectedPoint = useMapStore((s) => s.selectedPoint)
  const locale = useMapStore((s) => s.locale)
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint)
  const satellites = useSatelliteStore((s) => s.satellites)
  const selectSatellite = useSatelliteStore((s) => s.selectSatellite)
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite)
  const simulationTime = useSimulationStore((s) => s.simulationTime)

  const [passes, setPasses] = useState<SatellitePass[]>([])
  const [geoVisible, setGeoVisible] = useState<GeoSatelliteVisible[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!selectedPoint) {
      setPasses([])
      setGeoVisible([])
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    // Use simulationTime or fall back to real now
    const timeToUse = simulationTime || new Date()

    // Try API first, fallback to client-side calculation
    getPassesForPoint(selectedPoint.lat, selectedPoint.lon, 24)
      .then((data) => {
        if (!cancelled) {
          setPasses(data)
          // Also calculate GEO visibility
          const geo = calculateGeoVisible(satellites, selectedPoint.lat, selectedPoint.lon, timeToUse)
          setGeoVisible(geo)
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
              24,
              timeToUse
            )
            const geo = calculateGeoVisible(satellites, selectedPoint.lat, selectedPoint.lon, timeToUse)
            setPasses(calculated)
            setGeoVisible(geo)
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
  }, [selectedPoint, satellites, simulationTime])

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
    <div ref={panelRef} {...stopProps} className="fixed bottom-4 left-4 z-50 w-72 max-h-96 overflow-y-auto bg-zinc-900/95 backdrop-blur-sm rounded-xl border border-zinc-800 text-white shadow-xl pointer-events-auto">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">
            {t('passes.title', locale)}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-zinc-400">
              {formatCoord(selectedPoint.lat, selectedPoint.lon)}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${selectedPoint.lat.toFixed(6)}, ${selectedPoint.lon.toFixed(6)}`
                )
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/50 hover:text-white text-[10px] transition-all min-w-[60px] justify-center"
              title={t('points.copy_coords', locale)}
            >
              {copied ? '✓ Скопировано' : '📋 Копировать'}
            </button>
          </div>
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

        {!loading && !error && passes.length === 0 && geoVisible.length === 0 && (
          <p className="text-zinc-400 text-sm text-center py-4">
            {t('passes.empty', locale)}
          </p>
        )}

        {/* Regular passes */}
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

        {/* GEO satellites section */}
        {!loading && !error && geoVisible.length > 0 && (
          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="text-xs text-white/40 mb-2">
              {t('passes.geo_visible', locale)} ({geoVisible.length})
            </div>
            <div className="space-y-1">
              {geoVisible.map((geo) => {
                const isSelected = selectedSatellite?.noradId === geo.noradId

                return (
                  <button
                    key={geo.noradId}
                    onClick={() => {
                      const sat = satellites.find((s) => s.noradId === geo.noradId)
                      if (sat) selectSatellite(sat)
                    }}
                    className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded transition-colors ${
                      isSelected
                        ? 'bg-[#ff4466]/20 ring-1 ring-[#ff4466]'
                        : 'hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-xs truncate text-[#ff4466] flex-1">
                      {geo.name}
                    </span>
                    <span className="text-xs text-white/60 ml-2">
                      ↑ {geo.elevationDeg.toFixed(1)}°
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
