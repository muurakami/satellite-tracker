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
  const canShowTable = comparisonCount >= 2

  return (
    <div className="space-y-3">
      {/* Search input */}
      <input
        type="text"
        placeholder={t('groups.search', locale)}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full px-2 py-1 rounded bg-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">{t('groups.title', locale)}</label>
        <button
          onClick={resetToDefaults}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {t('groups.reset', locale)}
        </button>
      </div>
      
      {/* Group list - each group is a row with toggle and compare button */}
      <div className="space-y-1">
        {filteredGroups.map((group) => {
          const config = GROUP_CONFIG[group]
          const isActive = activeGroups.includes(group)
          const isComparing = comparisonGroups.includes(group)
          const count = useGroupCount(group)
          
          return (
            <div 
              key={group} 
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-zinc-800/50 transition-colors"
            >
              {/* Active toggle checkbox */}
              <button
                onClick={() => toggleGroup(group)}
                className={`
                  w-5 h-5 rounded flex items-center justify-center text-xs transition-all shrink-0
                  ${isActive 
                    ? 'bg-zinc-600 text-white' 
                    : 'bg-zinc-800 text-zinc-600 hover:text-zinc-400'
                  }
                `}
                title={isActive ? t('groups.deactivate', locale) : t('groups.activate', locale)}
              >
                {isActive && '✓'}
              </button>

              {/* Group info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{config.icon}</span>
                  <span className={`text-xs truncate ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                    {config.name}
                  </span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1 rounded shrink-0 ${
                      isActive ? 'bg-zinc-600 text-zinc-300' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </div>
              </div>

              {/* Compare toggle button - always visible */}
              <button
                onClick={() => toggleComparisonGroup(group)}
                className={`
                  px-2 py-1 rounded text-[10px] font-medium shrink-0 transition-all
                  ${isComparing 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-zinc-800 text-zinc-500 hover:bg-cyan-700 hover:text-white'
                  }
                `}
                title={isComparing 
                  ? t('groups.removeFromCompare', locale) 
                  : t('groups.addToCompare', locale)
                }
              >
                {isComparing ? '⚖️ ✓' : '⚖️'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Compare button at bottom */}
      <div className="pt-2 border-t border-zinc-700">
        <button
          className={`
            w-full px-3 py-2.5 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2
            ${canShowTable 
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg animate-pulse' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }
          `}
          disabled={!canShowTable}
          title={canShowTable ? t('groups.compareActive', locale) : t('groups.selectToCompare', locale)}
        >
          <span className="text-base">⚖️</span>
          <span>{t('groups.compare', locale)}</span>
          {comparisonCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {comparisonCount}
            </span>
          )}
        </button>
        {comparisonCount > 0 && !canShowTable && (
          <p className="text-xs text-zinc-500 text-center mt-1.5">
            {2 - comparisonCount} {t('groups.moreToCompare', locale)}
          </p>
        )}
      </div>
    </div>
  )
}
