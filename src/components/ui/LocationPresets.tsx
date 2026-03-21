'use client'

import { LOCATION_PRESETS } from '@/lib/presets'
import { useMapStore } from '@/store/useMapStore'
import { t } from '@/lib/i18n'

export default function LocationPresets() {
  const observationPoints = useMapStore((s) => s.observationPoints)
  const addObservationPoint = useMapStore((s) => s.addObservationPoint)
  const locale = useMapStore((s) => s.locale)

  const handleAddPreset = (preset: typeof LOCATION_PRESETS[number]) => {
    addObservationPoint(preset.lat, preset.lon)
    // Fly to location via custom event
    window.dispatchEvent(
      new CustomEvent('satellite-tracker:fly-to', {
        detail: { lat: preset.lat, lon: preset.lon, zoom: 10, duration: 1200 },
      })
    )
  }

  return (
    <div className="mt-2">
      <div className="text-xs text-white/40 mb-1.5">{t('presets.title', locale)}</div>
      <div className="flex flex-col gap-1">
        {LOCATION_PRESETS.map((preset) => {
          const label = locale === 'ru' ? preset.labelRu : preset.labelEn
          const alreadyAdded = observationPoints.some(
            (p) => Math.abs(p.lat - preset.lat) < 0.01 && Math.abs(p.lon - preset.lon) < 0.01
          )
          const isRniirs = preset.id === 'rniirs'
          const canAdd = !alreadyAdded && observationPoints.length < 5

          return (
            <button
              key={preset.id}
              disabled={!canAdd}
              onClick={() => handleAddPreset(preset)}
              className={`
                flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg
                text-xs text-left transition-all
                ${
                  alreadyAdded
                    ? 'bg-white/5 text-white/30 cursor-default'
                    : isRniirs && !alreadyAdded
                    ? 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-white cursor-pointer'
                    : 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                }
                disabled:opacity-40
              `}
            >
              <span>{preset.emoji}</span>
              <span className="flex-1 truncate">{label}</span>
              <span className="text-white/40 text-[10px]">
                {alreadyAdded ? '✓' : t('presets.add', locale)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
