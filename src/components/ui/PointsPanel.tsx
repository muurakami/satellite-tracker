'use client'

import { useMapStore } from '@/store/useMapStore'
import { t } from '@/lib/i18n'

export default function PointsPanel() {
  const points = useMapStore((s) => s.observationPoints)
  const activePointId = useMapStore((s) => s.activePointId)
  const setActivePoint = useMapStore((s) => s.setActivePoint)
  const removeObservationPoint = useMapStore((s) => s.removeObservationPoint)
  const mapBounds = useMapStore((s) => s.mapBounds)
  const addObservationPoint = useMapStore((s) => s.addObservationPoint)
  const isAddingPoint = useMapStore((s) => s.isAddingPoint)
  const toggleAddingPoint = useMapStore((s) => s.toggleAddingPoint)
  const locale = useMapStore((s) => s.locale)

  // Always show panel (at minimum showing hints when adding)
  // Note: AddPointButton is now in FilterPanel, so we only show list + hints here

  const addAtCenter = () => {
    if (!mapBounds) return
    const centerLat = (mapBounds[1] + mapBounds[3]) / 2
    const centerLon = (mapBounds[0] + mapBounds[2]) / 2
    addObservationPoint(centerLat, centerLon)
  }

  const canAddMore = points.length < 5

  const formatCoord = (lat: number, lon: number): string => {
    const latDir = lat >= 0 ? 'N' : 'S'
    const lonDir = lon >= 0 ? 'E' : 'W'
    return `${Math.abs(lat).toFixed(1)}°${latDir} ${Math.abs(lon).toFixed(1)}°${lonDir}`
  }

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 w-56 bg-zinc-900/95 backdrop-blur-sm rounded-xl border text-white shadow-xl transition-all ${
        isAddingPoint
          ? 'border-blue-400 animate-pulse'
          : 'border-zinc-800'
      }`}
    >
      {/* Header - only show when there are points */}
      {points.length > 0 && (
        <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
            📍 {t('points.label', locale)}
          </span>
        </div>
      )}

      {/* Points list */}
      {points.length > 0 && (
        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
          {points.map((point) => {
            const isActive = point.id === activePointId

            return (
              <div
                key={point.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  isActive ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                }`}
                onClick={() => setActivePoint(point.id)}
              >
                {/* Color dot */}
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    isActive ? '' : 'border border-zinc-500'
                  }`}
                  style={{ backgroundColor: isActive ? point.color : 'transparent' }}
                />

                {/* Label + coords */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">
                      {point.label}
                    </span>
                    {isActive && (
                      <span className="text-green-400 text-xs">●</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {formatCoord(point.lat, point.lon)}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeObservationPoint(point.id)
                  }}
                  className="text-zinc-500 hover:text-red-400 p-1 -m-1"
                  aria-label={t('points.remove', locale)}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Hint when adding */}
      {isAddingPoint && (
        <div className="px-3 py-2 text-xs text-zinc-400 text-center border-t border-zinc-800">
          📍 {t('points.hint', locale)}
        </div>
      )}

      {/* Counter */}
      {points.length > 0 && (
        <div className="px-3 py-2 border-t border-zinc-800 text-xs text-zinc-500 text-center">
          {points.length}/5
        </div>
      )}
    </div>
  )
}
