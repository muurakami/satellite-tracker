'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'
import { useStopMapPropagation } from '@/hooks/useStopMapPropagation'
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

export default function FilterPanel() {
  const { ref: panelRef, stopProps } = useStopMapPropagation()
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

  const [searchText, setSearchText] = useState('')
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

  return (
    <div ref={panelRef} {...stopProps} className="fixed top-4 left-4 z-50 w-64 bg-zinc-900 rounded-xl p-4 text-white shadow-lg pointer-events-auto">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">{t('filters.title', locale)}</h3>
        <button
          onClick={() => refreshSatellites()}
          disabled={isRefreshing}
          title={locale === 'ru' ? 'Обновить TLE данные с CelesTrak' : 'Refresh TLE data from CelesTrak'}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            isRefreshing
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          <span className={isRefreshing ? 'animate-spin inline-block' : ''}>🔄</span>
          {isRefreshing ? t('filters.loading', locale) : t('filters.refresh', locale)}
        </button>
      </div>

      {/* Performance Mode toggle */}
      <button
        onClick={togglePerformanceMode}
        className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors mb-3 flex items-center justify-between ${
          performanceMode
            ? 'bg-amber-600 text-white'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
      >
        <span>{t('filters.performanceMode', locale)}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${performanceMode ? 'bg-amber-700' : 'bg-zinc-700'}`}>
          {performanceMode ? `≤${performanceLimit}` : 'ALL'}
        </span>
      </button>

      {/* Group selector - primary filter */}
      <div className="mb-4">
        <GroupSelector />
      </div>

      <div className="border-t border-zinc-700 pt-3 mb-3">
        <input
          type="text"
          placeholder={t('filters.searchPlaceholder', locale)}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-3 py-1.5 rounded bg-zinc-800 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      <label className="block text-xs text-zinc-400 mb-1">{t('filters.orbitType', locale)}</label>
      <select
        onChange={(e) =>
          setFilters({
            orbit: (e.target.value as OrbitType) || undefined,
          })
        }
        className="w-full px-2 py-1.5 rounded bg-zinc-800 text-sm text-white outline-none mb-3"
      >
        <option value="">{t('filters.all', locale)}</option>
        {ORBIT_OPTIONS.filter(Boolean).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <label className="block text-xs text-zinc-400 mb-1">{t('filters.purpose', locale)}</label>
      <select
        onChange={(e) =>
          setFilters({
            purpose: (e.target.value as SatellitePurpose) || undefined,
          })
        }
        className="w-full px-2 py-1.5 rounded bg-zinc-800 text-sm text-white outline-none mb-3"
      >
        <option value="">{t('filters.all', locale)}</option>
        {PURPOSE_OPTIONS.filter(Boolean).map((p) => (
          <option key={p} value={p}>
            {t(`purpose.${p}` as Parameters<typeof t>[0], locale)}
          </option>
        ))}
      </select>

      {/* Viewport filter toggle */}
      <button
        onClick={toggleViewportOnly}
        className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors mb-3 ${
          viewportOnly
            ? 'bg-emerald-600 text-white'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
      >
        📍 {viewportOnly ? t('filters.viewportOnly', locale) : t('filters.showAll', locale)}
      </button>

      {/* Load TLE from file */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".tle,.txt,.3le"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-3 py-2 rounded text-sm font-medium transition-colors mb-3 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      >
        {t('filters.loadFromFile', locale)}
      </button>

      <p className="text-xs text-zinc-400">
        {count} {t('filters.satellites', locale)}
        {performanceMode && count > performanceLimit && (
          <span className="text-amber-400 ml-1">({t('filters.showing', locale)} {performanceLimit})</span>
        )}
      </p>

      {/* Add observation point button */}
      <div className="mt-3 border-t border-zinc-700 pt-3">
        <AddPointButton />
        <LocationPresets />
      </div>
    </div>
  )
}
