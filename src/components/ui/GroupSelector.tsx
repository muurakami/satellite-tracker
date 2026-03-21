'use client'

import { useState, useMemo } from 'react'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'
import { useGroupCount } from '@/hooks/useGroupStats'
import { GROUP_CONFIG, type SatelliteGroup, ALL_GROUPS } from '@/types/satellite'
import { t } from '@/lib/i18n'

interface GroupSelectorProps {
  onSelect?: (groupId: SatelliteGroup) => void
}

export default function GroupSelector({ onSelect }: GroupSelectorProps) {
  const activeGroups = useSatelliteStore((s) => s.activeGroups)
  const addGroup = useSatelliteStore((s) => s.addGroup)
  const removeGroup = useSatelliteStore((s) => s.removeGroup)
  const resetToDefaults = useSatelliteStore((s) => s.resetToDefaults)
  const comparisonGroups = useSatelliteStore((s) => s.comparisonGroups)
  const toggleComparisonGroup = useSatelliteStore((s) => s.toggleComparisonGroup)
  const locale = useMapStore((s) => s.locale)
  
  const [searchText, setSearchText] = useState('')

  const toggleGroup = (group: SatelliteGroup) => {
    if (activeGroups.includes(group)) {
      removeGroup(group)
    } else {
      addGroup(group)
    }
    onSelect?.(group)
  }

  // Filter groups by search
  const filteredGroups = useMemo(() => {
    if (!searchText) return ALL_GROUPS
    const search = searchText.toLowerCase()
    return ALL_GROUPS.filter((group) => {
      const config = GROUP_CONFIG[group]
      return (
        config.name.toLowerCase().includes(search) ||
        config.description.toLowerCase().includes(search)
      )
    })
  }, [searchText])

  const comparisonCount = comparisonGroups.length

  return (
    <div className="space-y-2">
      {/* Search input */}
      <input
        type="text"
        placeholder={t('groups.search', locale)}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full px-2 py-1 rounded bg-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
      />

      {/* Header with reset and compare count */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">{t('groups.title', locale)}</label>
        <div className="flex items-center gap-2">
          {comparisonCount > 0 && (
            <span className="text-xs text-cyan-400">
              ⚖️ {comparisonCount}
            </span>
          )}
          <button
            onClick={resetToDefaults}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {t('groups.reset', locale)}
          </button>
        </div>
      </div>
      
      {/* Group buttons with counts */}
      <div className="flex flex-wrap gap-1.5">
        {filteredGroups.map((group) => {
          const config = GROUP_CONFIG[group]
          const isActive = activeGroups.includes(group)
          const isComparing = comparisonGroups.includes(group)
          const count = useGroupCount(group)
          
          return (
            <div key={group} className="relative group/button">
              <button
                onClick={() => toggleGroup(group)}
                className={`
                  px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1
                  ${isActive 
                    ? 'bg-zinc-700 text-white ring-1 ring-zinc-500' 
                    : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }
                `}
                title={config.description}
              >
                <span>{config.icon}</span>
                <span>{config.name}</span>
                {count > 0 && (
                  <span className={`ml-0.5 px-1 rounded text-[10px] ${
                    isActive ? 'bg-zinc-600' : 'bg-zinc-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
              
              {/* Compare button - shows on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleComparisonGroup(group)
                }}
                className={`
                  absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center
                  transition-all opacity-0 group-hover/button:opacity-100
                  ${isComparing 
                    ? 'bg-cyan-600 text-white opacity-100' 
                    : 'bg-zinc-600 text-zinc-300 hover:bg-cyan-600'
                  }
                `}
                title={isComparing 
                  ? t('groups.removeFromCompare', locale) 
                  : t('groups.addToCompare', locale)
                }
              >
                ⚖️
              </button>
            </div>
          )
        })}
      </div>

      {/* Compare button - visible when groups are selected */}
      {comparisonCount > 0 && (
        <div className="pt-2 border-t border-zinc-700">
          <button
            onClick={() => {
              // GroupComparisonTable will show automatically when comparisonCount >= 2
            }}
            className="w-full px-3 py-2.5 rounded-md text-sm font-semibold bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <span className="text-base">⚖️</span>
            <span>{t('groups.compare', locale)}</span>
            {comparisonCount >= 2 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {comparisonCount}
              </span>
            )}
          </button>
          {comparisonCount > 0 && comparisonCount < 2 && (
            <p className="text-xs text-zinc-500 text-center mt-1">
              {2 - comparisonCount} {t('groups.moreToCompare', locale)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
