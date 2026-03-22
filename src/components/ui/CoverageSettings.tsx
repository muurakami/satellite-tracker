'use client'

import { useCoverageStore, ANTENNA_PRESETS, CoverageAntennaType } from '@/store/useCoverageStore'
import { useMapStore } from '@/store/useMapStore'
import { t } from '@/lib/i18n'

export default function CoverageSettings() {
  const {
    showCoverage,
    minElevationDeg,
    showGradient,
    gradientRings,
    antennaType,
    setShowCoverage,
    setMinElevationDeg,
    setShowGradient,
    setGradientRings,
    setAntennaType,
  } = useCoverageStore()

  const locale = useMapStore((s) => s.locale)

  const handlePresetClick = (preset: CoverageAntennaType) => {
    setAntennaType(preset)
    const presetSettings = ANTENNA_PRESETS[preset]
    setMinElevationDeg(presetSettings.minElevation)
  }

  return (
    <div className="space-y-4">
      {/* Visibility Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showCoverage"
          checked={showCoverage}
          onChange={(e) => setShowCoverage(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="showCoverage" className="text-sm text-zinc-300">
          {t('coverage.showCoverageZone', locale)}
        </label>
      </div>

      {showCoverage && (
        <>
          {/* Antenna Presets */}
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">
          {t('coverage.antennaType', locale)}
        </label>
            <div className="flex gap-1">
              {(Object.keys(ANTENNA_PRESETS) as CoverageAntennaType[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    antennaType === preset
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Min Elevation Slider */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>{t('coverage.minElevation', locale)}</span>
              <span>{minElevationDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={minElevationDeg}
              onChange={(e) => setMinElevationDeg(Number(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>0°</span>
              <span>15°</span>
              <span>30°</span>
            </div>
          </div>

          {/* Gradient Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showGradient"
              checked={showGradient}
              onChange={(e) => setShowGradient(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showGradient" className="text-sm text-zinc-300">
              {t('coverage.gradientRings', locale)}
            </label>
          </div>

          {/* Gradient Rings Slider */}
          {showGradient && (
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>{t('coverage.gradientRings', locale)}</span>
                <span>{gradientRings}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={gradientRings}
                onChange={(e) => setGradientRings(Number(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Color Legend */}
          <div className="pt-2 border-t border-zinc-700">
            <div className="text-xs text-zinc-400 mb-2">
            {t('coverage.signalStrength', locale)}
          </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                <span className="text-xs text-zinc-400">
                  {t('coverage.high', locale)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <span className="text-xs text-zinc-400">
                  {t('coverage.medium', locale)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="text-xs text-zinc-400">
                  {t('coverage.low', locale)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
