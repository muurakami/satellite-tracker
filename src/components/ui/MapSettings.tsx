'use client'

import { useState } from 'react'
import { useMapStore, MAP_THEMES, type MapTheme, type ViewMode } from '@/store/useMapStore'
import { t, getLocaleLabel, type Locale } from '@/lib/i18n'

const PRESET_COLORS = [
  '#ffffff', '#ffff00', '#ff6600', '#ff0066',
  '#00ffff', '#00ff00', '#ff0000', '#6600ff',
]

const VIEW_MODES: { value: ViewMode; label: { ru: string; en: string }; icon: string }[] = [
  { value: '2d', label: { ru: '2D Карта', en: '2D Map' }, icon: '🗺️' },
  { value: '3d-tilt', label: { ru: '3D Наклон', en: '3D Tilt' }, icon: '🌐' },
  { value: '3d-globe', label: { ru: '3D Глобус', en: '3D Globe' }, icon: '🌍' },
]

const LOCALES: Locale[] = ['ru', 'en']

export default function MapSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const mapTheme = useMapStore((s) => s.mapTheme)
  const selectedSatelliteColor = useMapStore((s) => s.selectedSatelliteColor)
  const viewMode = useMapStore((s) => s.viewMode)
  const orbitScale = useMapStore((s) => s.orbitScale)
  const showHeatmap = useMapStore((s) => s.showHeatmap)
  const showClusters = useMapStore((s) => s.showClusters)
  const showGrid = useMapStore((s) => s.showGrid)
  const locale = useMapStore((s) => s.locale)
  const setMapTheme = useMapStore((s) => s.setMapTheme)
  const setSelectedSatelliteColor = useMapStore((s) => s.setSelectedSatelliteColor)
  const setViewMode = useMapStore((s) => s.setViewMode)
  const setOrbitScale = useMapStore((s) => s.setOrbitScale)
  const toggleHeatmap = useMapStore((s) => s.toggleHeatmap)
  const toggleClusters = useMapStore((s) => s.toggleClusters)
  const toggleGrid = useMapStore((s) => s.toggleGrid)
  const setLocale = useMapStore((s) => s.setLocale)

  return (
    <div className="fixed z-50 pointer-events-auto" style={{ top: '4rem', right: '1rem' }}>
      {/* Settings toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 border border-zinc-700"
        title={t('settings.title', locale)}
      >
        ⚙️
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-zinc-900 rounded-xl p-4 text-white shadow-xl border border-zinc-700 max-h-[80vh] overflow-y-auto">
          <h3 className="text-sm font-bold mb-3">{t('settings.title', locale)}</h3>

          {/* Language selector */}
          <div className="mb-4">
            <label className="block text-xs text-zinc-400 mb-2">{t('settings.language', locale)}</label>
            <div className="flex gap-1">
              {LOCALES.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={`flex-1 px-3 py-1.5 rounded text-sm ${
                    locale === loc
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {getLocaleLabel(loc)}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode */}
          <div className="mb-4">
            <label className="block text-xs text-zinc-400 mb-2">{t('settings.viewMode', locale)}</label>
            <div className="flex flex-col gap-1">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={`px-3 py-1.5 rounded text-sm text-left ${
                    viewMode === mode.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {mode.icon} {mode.label[locale]}
                </button>
              ))}
            </div>
          </div>

          {/* Map Theme (only for 2D and 3D-tilt) */}
          {viewMode !== '3d-globe' && (
            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-2">{t('settings.theme', locale)}</label>
              <div className="grid grid-cols-2 gap-1">
                {(Object.keys(MAP_THEMES) as MapTheme[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setMapTheme(theme)}
                    className={`px-2 py-1.5 rounded text-xs ${
                      mapTheme === theme
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {MAP_THEMES[theme].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orbit Scale (only for 3D Globe) */}
          {viewMode === '3d-globe' && (
            <div className="mb-4">
              <label className="block text-xs text-zinc-400 mb-2">
                {t('settings.orbitScale', locale)}: {orbitScale.toFixed(1)}x
              </label>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={orbitScale}
                onChange={(e) => setOrbitScale(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {/* Selected Satellite Color */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              {t('settings.selectedColor', locale)}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedSatelliteColor(color)}
                  className={`w-7 h-7 rounded-full border-2 ${
                    selectedSatelliteColor === color
                      ? 'border-white scale-110'
                      : 'border-zinc-600 hover:border-zinc-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div className="border-t border-zinc-700 pt-3 mt-3">
            <button
              onClick={toggleClusters}
              className={`w-full px-3 py-2 rounded text-sm text-left mb-2 transition-colors ${
                showClusters
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {showClusters ? `✅ ${t('settings.clusters', locale)}` : `⭕ ${t('settings.clusters', locale)}`}
            </button>
            
            <button
              onClick={toggleHeatmap}
              className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                showHeatmap
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {showHeatmap ? `🔥 ${t('settings.heatmap', locale)}` : `⭕ ${t('settings.heatmap', locale)}`}
            </button>

            <button
              onClick={toggleGrid}
              className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
                showGrid
                  ? 'bg-cyan-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {showGrid ? `✅ ${t('settings.grid', locale)}` : `⭕ ${t('settings.grid', locale)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
