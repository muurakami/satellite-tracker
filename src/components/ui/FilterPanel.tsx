'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore, MAP_THEMES } from '@/store/useMapStore'
import type { OrbitType, SatellitePurpose } from '@/types/satellite'
import { t } from '@/lib/i18n'
import { fetchCelesTrakTLEFromText } from '@/lib/celestrak'
import GroupSelector from './GroupSelector'
import AddPointButton from './AddPointButton'
import LocationPresets from './LocationPresets'

const ORBIT_OPTIONS: (OrbitType | '')[] = ['', 'LEO', 'MEO', 'GEO', 'HEO']
const PURPOSE_OPTIONS: (SatellitePurpose | '')[] = [
  '',
  'communications',
  'navigation',
  'earth-observation',
  'scientific',
]

const PRESET_COLORS = [
  '#ffffff', '#ffff00', '#ff6600', '#ff0066',
  '#00ffff', '#00ff00', '#ff0000', '#6600ff',
]

export default function FilterPanel() {
  const setFilters = useSatelliteStore((s) => s.setFilters)
  const filteredByGroups = useSatelliteStore((s) => s.filteredByGroups)
  const viewportOnly = useMapStore((s) => s.viewportOnly)
  const toggleViewportOnly = useMapStore((s) => s.toggleViewportOnly)
  const performanceMode = useSatelliteStore((s) => s.performanceMode)
  const performanceLimit = useSatelliteStore((s) => s.performanceLimit)
  const togglePerformanceMode = useSatelliteStore((s) => s.togglePerformanceMode)
  const refreshSatellites = useSatelliteStore((s) => s.refreshSatellites)
  const isRefreshing = useSatelliteStore((s) => s.isRefreshing)
  const setSatellites = useSatelliteStore((s) => s.setSatellites)
  const satellites = useSatelliteStore((s) => s.satellites)
  const activeGroups = useSatelliteStore((s) => s.activeGroups)
  const locale = useMapStore((s) => s.locale)
  // Settings-related state
  const orbitScale = useMapStore((s) => s.orbitScale)
  const setOrbitScale = useMapStore((s) => s.setOrbitScale)
  const selectedSatelliteColor = useMapStore((s) => s.selectedSatelliteColor)
  const setSelectedSatelliteColor = useMapStore((s) => s.setSelectedSatelliteColor)
  const showHeatmap = useMapStore((s) => s.showHeatmap)
  const toggleHeatmap = useMapStore((s) => s.toggleHeatmap)
  const showClusters = useMapStore((s) => s.showClusters)
  const toggleClusters = useMapStore((s) => s.toggleClusters)
  const showGrid = useMapStore((s) => s.showGrid)
  const toggleGrid = useMapStore((s) => s.toggleGrid)
  const showTerminator = useMapStore((s) => s.showTerminator)
  const toggleTerminator = useMapStore((s) => s.toggleTerminator)
  const showGroundTrack = useMapStore((s) => s.showGroundTrack)
  const toggleGroundTrack = useMapStore((s) => s.toggleGroundTrack)
  const showFullTrack = useMapStore((s) => s.showFullTrack)
  const toggleFullTrack = useMapStore((s) => s.toggleFullTrack)

  const [searchText, setSearchText] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const isCollapsed = useMapStore((s) => s.isFilterPanelCollapsed)
  const toggleFilterPanel = useMapStore((s) => s.toggleFilterPanel)
  const mapTheme = useMapStore((s) => s.mapTheme)
  const setMapTheme = useMapStore((s) => s.setMapTheme)
  const viewMode = useMapStore((s) => s.viewMode)
  const setViewMode = useMapStore((s) => s.setViewMode)
  const setLocale = useMapStore((s) => s.setLocale)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters({ q: searchText || undefined })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchText, setFilters])

  // Memoized count
  const count = useMemo(
    () => filteredByGroups().length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [satellites, activeGroups, searchText]
  )

  // Handle TLE file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      try {
        const sats = fetchCelesTrakTLEFromText(text)
        if (sats.length > 0) {
          setSatellites(sats)
        } else {
          console.warn('[FilterPanel] No satellites parsed from file')
        }
      } catch (err) {
        console.error('[FilterPanel] Failed to parse TLE file:', err)
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }

  // Full settings content (consolidated from MapSettings)
  const settingsContent = (
    <div className="space-y-4">
      {/* Language */}
      <div>
        <label className="block text-xs text-zinc-400 mb-2">{t('settings.language', locale)}</label>
        <div className="flex gap-1">
          {(['ru', 'en'] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`flex-1 px-3 py-1.5 rounded text-sm ${
                locale === loc
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {loc === 'ru' ? 'RU' : 'EN'}
            </button>
          ))}
        </div>
      </div>

      {/* View Mode */}
      <div>
        <label className="block text-xs text-zinc-400 mb-2">{t('settings.viewMode', locale)}</label>
        <div className="flex flex-col gap-1">
          {([
            { value: '2d' as const, icon: '🗺️', label: locale === 'ru' ? '2D Карта' : '2D Map' },
            { value: '3d-tilt' as const, icon: '🌐', label: locale === 'ru' ? '3D Наклон' : '3D Tilt' },
            { value: '3d-globe' as const, icon: '🌍', label: locale === 'ru' ? '3D Глобус' : '3D Globe' },
          ]).map((mode) => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={`px-3 py-1.5 rounded text-sm text-left ${
                viewMode === mode.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {mode.icon} {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Theme (only for 2D and 3D-tilt) */}
      {viewMode !== '3d-globe' && (
        <div>
          <label className="block text-xs text-zinc-400 mb-2">{t('settings.mapTheme', locale)}</label>
          <div className="flex flex-wrap gap-1">
            {(['dark', 'light', 'satellite', 'terrain'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => setMapTheme(theme)}
                className={`px-2 py-1 rounded text-xs ${
                  mapTheme === theme
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {theme === 'dark' ? '🌑' : theme === 'light' ? '☀️' : theme === 'satellite' ? '🛰️' : '⛰️'} {MAP_THEMES[theme].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orbit Scale (only for 3D Globe) */}
      {viewMode === '3d-globe' && (
        <div>
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
        <div className="flex flex-wrap gap-1.5">
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

      {/* Display Options — toggle buttons */}
      <div className="border-t border-zinc-700 pt-3 space-y-2">
        <button
          onClick={toggleClusters}
          className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
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

        <button
          onClick={toggleTerminator}
          className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
            showTerminator
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {showTerminator ? `🌙 ${t('settings.terminator', locale)}` : `⭕ ${t('settings.terminator', locale)}`}
        </button>

        <button
          onClick={toggleGroundTrack}
          className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
            showGroundTrack
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {showGroundTrack ? `🛰️ ${t('settings.groundTrack', locale)}` : `⭕ ${t('settings.groundTrack', locale)}`}
        </button>

        <button
          onClick={toggleFullTrack}
          className={`w-full px-3 py-2 rounded text-sm text-left transition-colors ${
            showFullTrack
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {showFullTrack ? `🌐 ${t('settings.fullTrack', locale)}` : `⭕ ${t('settings.fullTrack', locale)}`}
        </button>
      </div>
    </div>
  )

  return (
    // Full-height sidebar layout with collapse
    <div className="flex flex-col h-full bg-zinc-900 text-white">
      {/* Header — always visible */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-zinc-800 flex-shrink-0 gap-1">
        <button
          onClick={toggleFilterPanel}
          className="flex items-center gap-1 text-white hover:text-zinc-300 transition-colors p-1"
          aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
        >
          <span
            className={`text-xs transition-transform duration-200 ${
              isCollapsed ? '-rotate-90' : ''
            }`}
          >
            ▼
          </span>
          {!isCollapsed && (
            <span className="text-sm font-semibold">
              {t('filters.title', locale)}
            </span>
          )}
        </button>

        {!isCollapsed && (
          <>
            {/* Settings gear */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded text-sm transition-colors ${
                showSettings
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title={t('settings.title', locale)}
            >
              ⚙️
            </button>

            {/* Refresh button */}
            <button
              onClick={() => refreshSatellites()}
              disabled={isRefreshing}
              title="Refresh TLE data from CelesTrak"
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                isRefreshing
                  ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              <span className={isRefreshing ? 'animate-spin inline-block' : ''}>
                🔄
              </span>
            </button>
          </>
        )}

        {isCollapsed && (
          // When collapsed, show settings and refresh as icons
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                if (isCollapsed) {
                  toggleFilterPanel() // сначала развернуть
                  setTimeout(() => setShowSettings(true), 300) // потом открыть настройки
                } else {
                  setShowSettings(!showSettings)
                }
              }}
              className="p-1 rounded text-sm text-zinc-400 hover:text-white hover:bg-zinc-800"
              title={t('settings.title', locale)}
            >
              ⚙️
            </button>
            <button
              onClick={() => refreshSatellites()}
              disabled={isRefreshing}
              className="p-1 rounded text-sm text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <span className={isRefreshing ? 'animate-spin inline-block' : ''}>🔄</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings dropdown */}
      {showSettings && !isCollapsed && (
        <div className="px-4 py-3 bg-zinc-800 border-b border-zinc-700">
          {settingsContent}
        </div>
      )}

      {/* Scrollable body — collapse via max-height + opacity */}
      <div
        className={`flex-1 overflow-y-auto transition-all duration-200 ${
          isCollapsed
            ? 'max-h-0 opacity-0 pointer-events-none'
            : 'max-h-full opacity-100'
        }`}
      >
        <div className="px-4 py-3 space-y-4">
          {/* Performance mode */}
          <button
            onClick={togglePerformanceMode}
            className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-between ${
              performanceMode
                ? 'bg-amber-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <span>{t('filters.performanceMode', locale)}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                performanceMode ? 'bg-amber-700' : 'bg-zinc-700'
              }`}
            >
              {performanceMode ? `≤${performanceLimit}` : 'ALL'}
            </span>
          </button>

          {/* Group selector */}
          <GroupSelector />

          {/* Search */}
          <div className="border-t border-zinc-800 pt-3">
            <input
              type="text"
              placeholder={t('filters.searchPlaceholder', locale)}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-zinc-800 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          {/* Orbit type */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t('filters.orbitType', locale)}
            </label>
            <select
              onChange={(e) =>
                setFilters({
                  orbit: (e.target.value as OrbitType) || undefined,
                })
              }
              className="w-full px-2 py-1.5 rounded bg-zinc-800 text-sm text-white outline-none"
            >
              <option value="">{t('filters.all', locale)}</option>
              {ORBIT_OPTIONS.filter(Boolean).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              {t('filters.purpose', locale)}
            </label>
            <select
              onChange={(e) =>
                setFilters({
                  purpose: (e.target.value as SatellitePurpose) || undefined,
                })
              }
              className="w-full px-2 py-1.5 rounded bg-zinc-800 text-sm text-white outline-none"
            >
              <option value="">{t('filters.all', locale)}</option>
              {PURPOSE_OPTIONS.filter(Boolean).map((p) => (
                <option key={p} value={p}>
                  {t(`purpose.${p}` as Parameters<typeof t>[0], locale)}
                </option>
              ))}
            </select>
          </div>

          {/* Viewport only */}
          <button
            onClick={toggleViewportOnly}
            className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
              viewportOnly
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            📍{' '}
            {viewportOnly
              ? t('filters.viewportOnly', locale)
              : t('filters.showAll', locale)}
          </button>

          {/* TLE file upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".tle,.txt,.3le"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-2 rounded text-sm font-medium transition-colors bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          >
            {t('filters.loadFromFile', locale)}
          </button>

          {/* Observation points */}
          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <AddPointButton />
            <LocationPresets />
          </div>
        </div>
      </div>

      {/* Footer — counter, always visible */}
      <div className="px-4 py-2 border-t border-zinc-800 flex-shrink-0">
        <p className="text-xs text-zinc-400">
          {count} {t('filters.satellites', locale)}
          {performanceMode && count > performanceLimit && (
            <span className="text-amber-400 ml-1">
              ({t('filters.showing', locale)} {performanceLimit})
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
