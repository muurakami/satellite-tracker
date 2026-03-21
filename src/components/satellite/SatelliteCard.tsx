'use client'

import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'
import { t } from '@/lib/i18n'

// Global event for centering on map
const CENTER_ON_MAP_EVENT = 'satellite-tracker:center-on-map'

export function centerOnMap() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CENTER_ON_MAP_EVENT))
  }
}

export default function SatelliteCard() {
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite)
  const positions = useSatelliteStore((s) => s.positions)
  const selectSatellite = useSatelliteStore((s) => s.selectSatellite)
  const toggleGroundTrack = useMapStore((s) => s.toggleGroundTrack)
  const toggleCoverage = useMapStore((s) => s.toggleCoverage)
  const selectedPoint = useMapStore((s) => s.selectedPoint)
  const showGroundTrack = useMapStore((s) => s.showGroundTrack)
  const showCoverage = useMapStore((s) => s.showCoverage)
  const locale = useMapStore((s) => s.locale)
  const linkedSatellites = useSatelliteStore((s) => s.linkedSatellites)
  const toggleSatelliteLink = useSatelliteStore((s) => s.toggleSatelliteLink)
  const clearLinks = useSatelliteStore((s) => s.clearLinks)

  if (!selectedSatellite) return null

  const pos = positions.get(selectedSatellite.noradId)
  const isLinked = linkedSatellites.includes(selectedSatellite.noradId)

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-zinc-900 rounded-xl p-4 text-white shadow-lg pointer-events-auto">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-bold">{selectedSatellite.name}</h2>
        <button
          onClick={() => selectSatellite(null)}
          className="text-zinc-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-1 text-sm text-zinc-300">
        <p>
          <span className="text-zinc-500">{t('card.country', locale)}:</span>{' '}
          {selectedSatellite.country}
        </p>
        <p>
          <span className="text-zinc-500">{t('card.operator', locale)}:</span>{' '}
          {selectedSatellite.operator}
        </p>
        <div className="flex gap-2 mt-1 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-zinc-700 text-xs">
            {selectedSatellite.orbitType}
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-700 text-xs">
            {selectedSatellite.purpose}
          </span>
          {selectedSatellite.inclinationDeg !== undefined && (
            <span className="px-2 py-0.5 rounded bg-zinc-700 text-xs">
              i={selectedSatellite.inclinationDeg.toFixed(1)}°
            </span>
          )}
        </div>
      </div>

      {pos && (
        <div className="mt-3 space-y-1 text-sm text-zinc-300 border-t border-zinc-700 pt-3">
          <p>
            <span className="text-zinc-500">{t('card.lat', locale)}:</span>{' '}
            {pos.lat.toFixed(4)}°
          </p>
          <p>
            <span className="text-zinc-500">{t('card.lon', locale)}:</span>{' '}
            {pos.lon.toFixed(4)}°
          </p>
          <p>
            <span className="text-zinc-500">{t('card.alt', locale)}:</span>{' '}
            {pos.alt.toFixed(1)} km
          </p>
          <p>
            <span className="text-zinc-500">{t('card.velocity', locale)}:</span>{' '}
            {pos.velocityKmS.toFixed(2)} km/s
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <button
          onClick={centerOnMap}
          className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-500"
        >
          {t('card.centerOnMap', locale)}
        </button>
        <button
          onClick={toggleGroundTrack}
          className={`px-3 py-1.5 rounded text-sm ${
            showGroundTrack
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {t('card.orbitTrack', locale)}
        </button>
        <button
          onClick={toggleCoverage}
          className={`px-3 py-1.5 rounded text-sm ${
            showCoverage
              ? 'bg-rose-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {t('card.coverageZone', locale)}
        </button>
        {/* Satellite Link button (KSP-style) */}
        <button
          onClick={() => toggleSatelliteLink(selectedSatellite.noradId)}
          className={`px-3 py-1.5 rounded text-sm flex items-center justify-between ${
            isLinked
              ? 'bg-cyan-600 text-white'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          <span>{isLinked ? t('card.unlink', locale) : t('card.link', locale)}</span>
          {linkedSatellites.length > 0 && (
            <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">
              {linkedSatellites.length} {t('card.linked', locale)}
            </span>
          )}
        </button>
        {linkedSatellites.length > 0 && (
          <button
            onClick={clearLinks}
            className="px-3 py-1.5 rounded text-sm bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 text-xs"
          >
            {t('card.clearLinks', locale)}
          </button>
        )}
        <button
          disabled={!selectedPoint}
          className="px-3 py-1.5 rounded text-sm bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('card.passesOverPoint', locale)}
        </button>
      </div>
    </div>
  )
}
