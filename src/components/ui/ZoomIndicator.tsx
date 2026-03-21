'use client'

import { useMemo } from 'react'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'

export default function ZoomIndicator() {
  const satellites = useSatelliteStore((s) => s.satellites)
  const activeGroups = useSatelliteStore((s) => s.activeGroups)
  const filteredByGroups = useSatelliteStore((s) => s.filteredByGroups)
  const performanceMode = useSatelliteStore((s) => s.performanceMode)
  const performanceLimit = useSatelliteStore((s) => s.performanceLimit)
  const viewportOnly = useMapStore((s) => s.viewportOnly)
  const showHeatmap = useMapStore((s) => s.showHeatmap)
  const showClusters = useMapStore((s) => s.showClusters)
  
  const totalSatellites = satellites.length
  // Memoized to avoid recalculating on every position update
  const visibleCount = useMemo(
    () => filteredByGroups().length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [satellites, activeGroups]
  )

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-zinc-900/90 rounded-lg px-3 py-2 text-white text-xs shadow-lg pointer-events-auto">
      <div className="flex items-center gap-3">
        <span className="text-zinc-400">
          🛰️ {performanceMode ? `${Math.min(performanceLimit, visibleCount)}` : visibleCount} / {totalSatellites} satellites
        </span>
        <span className="text-zinc-500">|</span>
        <span className="text-zinc-400">{activeGroups.length} groups</span>
      </div>
      
      {/* Active features indicators */}
      <div className="flex items-center gap-2 mt-1">
        {performanceMode && (
          <span className="px-1.5 py-0.5 rounded bg-amber-600/30 text-amber-400 text-xs">
            ⚡ Perf
          </span>
        )}
        {viewportOnly && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-400 text-xs">
            📍 Viewport
          </span>
        )}
        {showClusters && (
          <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 text-xs">
            🔵 Clusters
          </span>
        )}
        {showHeatmap && (
          <span className="px-1.5 py-0.5 rounded bg-orange-600/30 text-orange-400 text-xs">
            🔥 Heatmap
          </span>
        )}
      </div>
    </div>
  )
}
