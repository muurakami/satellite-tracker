'use client'

import { useMemo } from 'react'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'
import { useComparisonGroupStats } from '@/hooks/useGroupStats'
import { GROUP_CONFIG, type SatelliteGroup, type GroupStats, type OrbitType } from '@/types/satellite'
import { t } from '@/lib/i18n'
import { useStopMapPropagation } from '@/hooks/useStopMapPropagation'

interface ComparisonRow {
  key: keyof GroupStats
  label: string
  unit: string
  better: 'higher' | 'lower' | null
  format: (value: number | Record<OrbitType, number>) => string
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { 
    key: 'totalCount', 
    label: 'Total satellites', 
    unit: '', 
    better: 'higher',
    format: (v) => String(v)
  },
  { 
    key: 'activeCount', 
    label: 'Active now', 
    unit: '', 
    better: 'higher',
    format: (v) => String(v)
  },
  { 
    key: 'avgAltitudeKm', 
    label: 'Avg altitude', 
    unit: 'km', 
    better: null,
    format: (v) => `${Math.round(v as number).toLocaleString()}`
  },
  { 
    key: 'avgVelocityKmS', 
    label: 'Avg velocity', 
    unit: 'km/s', 
    better: null,
    format: (v) => (v as number).toFixed(2)
  },
  { 
    key: 'minAltitudeKm', 
    label: 'Min altitude', 
    unit: 'km', 
    better: null,
    format: (v) => `${Math.round(v as number).toLocaleString()}`
  },
  { 
    key: 'maxAltitudeKm', 
    label: 'Max altitude', 
    unit: 'km', 
    better: null,
    format: (v) => `${Math.round(v as number).toLocaleString()}`
  },
]

function getOrbitType(distribution: Record<OrbitType, number>): string {
  const entries = Object.entries(distribution).filter(([, count]) => count > 0)
  if (entries.length === 0) return 'N/A'
  if (entries.length === 1) return entries[0][0]
  const types = entries.map(([type]) => type).join('+')
  return types
}

export default function GroupComparisonTable() {
  const { ref: panelRef, stopProps } = useStopMapPropagation()
  const comparisonGroups = useSatelliteStore((s) => s.comparisonGroups)
  const removeComparisonGroup = useSatelliteStore((s) => s.removeComparisonGroup)
  const clearComparisonGroups = useSatelliteStore((s) => s.clearComparisonGroups)
  const locale = useMapStore((s) => s.locale)

  const stats = useComparisonGroupStats(comparisonGroups)

  // Determine best values for highlighting
  const bestValues = useMemo(() => {
    const best: Record<string, { value: number; isHigherBetter: boolean }> = {}
    
    for (const row of COMPARISON_ROWS) {
      if (!row.better) continue
      
      const values = stats.map((s) => ({
        groupId: s.groupId,
        value: typeof s[row.key] === 'number' ? (s[row.key] as number) : 0
      }))
      
      if (values.length === 0) continue
      
      const bestValue = row.better === 'higher'
        ? Math.max(...values.map(v => v.value))
        : Math.min(...values.map(v => v.value))
      
      best[row.key] = {
        value: bestValue,
        isHigherBetter: row.better === 'higher'
      }
    }
    
    return best
  }, [stats])

  if (comparisonGroups.length < 2) return null

  return (
    <div 
      ref={panelRef} 
      {...stopProps} 
      className="fixed bottom-4 left-4 right-4 z-40 bg-zinc-900/95 backdrop-blur rounded-xl p-4 text-white shadow-xl border border-zinc-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          ⚖️ {t('comparison.title', locale)}
        </h3>
        <div className="flex items-center gap-2">
          {comparisonGroups.map((group) => (
            <button
              key={group}
              onClick={() => removeComparisonGroup(group)}
              className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-red-600 transition-colors"
            >
              {GROUP_CONFIG[group].name} ×
            </button>
          ))}
          {comparisonGroups.length > 0 && (
            <button
              onClick={clearComparisonGroups}
              className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              {t('comparison.clear', locale)}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="text-left py-2 px-3 text-zinc-500 font-medium text-xs">
                {t('comparison.parameter', locale)}
              </th>
              {comparisonGroups.map((group) => (
                <th 
                  key={group} 
                  className="text-center py-2 px-3 font-bold"
                >
                  <span className="text-lg mr-1">{GROUP_CONFIG[group].icon}</span>
                  {GROUP_CONFIG[group].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr 
                key={row.key} 
                className="border-b border-zinc-800 hover:bg-zinc-800/50"
              >
                <td className="py-2 px-3 text-zinc-400">
                  {t(`comparison.${row.key}` as Parameters<typeof t>[0], locale) || row.label}
                  {row.unit && <span className="text-zinc-600 ml-1">({row.unit})</span>}
                </td>
                {stats.map((stat) => {
                  const value = stat[row.key]
                  const formatted = row.key === 'orbitDistribution' 
                    ? getOrbitType(value as Record<OrbitType, number>)
                    : row.format(value as number)
                  
                  const best = bestValues[row.key]
                  const isBest = best && (value as number) === best.value
                  
                  return (
                    <td 
                      key={stat.groupId} 
                      className={`text-center py-2 px-3 ${
                        isBest ? 'text-green-400 font-bold' : 'text-white'
                      }`}
                    >
                      {isBest && <span className="mr-1">★</span>}
                      {formatted}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
