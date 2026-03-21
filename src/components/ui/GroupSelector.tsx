'use client'

import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'
import { GROUP_CONFIG, type SatelliteGroup, ALL_GROUPS } from '@/types/satellite'
import { t } from '@/lib/i18n'

export default function GroupSelector() {
  const activeGroups = useSatelliteStore((s) => s.activeGroups)
  const addGroup = useSatelliteStore((s) => s.addGroup)
  const removeGroup = useSatelliteStore((s) => s.removeGroup)
  const resetToDefaults = useSatelliteStore((s) => s.resetToDefaults)
  const locale = useMapStore((s) => s.locale)

  const toggleGroup = (group: SatelliteGroup) => {
    if (activeGroups.includes(group)) {
      removeGroup(group)
    } else {
      addGroup(group)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">{t('groups.title', locale)}</label>
        <button
          onClick={resetToDefaults}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {t('groups.reset', locale)}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {ALL_GROUPS.map((group) => {
          const config = GROUP_CONFIG[group]
          const isActive = activeGroups.includes(group)
          
          return (
            <button
              key={group}
              onClick={() => toggleGroup(group)}
              className={`
                px-2 py-1 rounded-md text-xs font-medium transition-all
                ${isActive 
                  ? 'bg-zinc-700 text-white ring-1 ring-zinc-500' 
                  : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                }
              `}
              title={config.description}
            >
              <span className="mr-1">{config.icon}</span>
              {config.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
