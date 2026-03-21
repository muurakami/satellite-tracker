'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import type { FeatureCollection, LineString } from 'geojson'

export default function SatelliteLinks() {
  const positions = useSatelliteStore((s) => s.positions)
  const getSatelliteLinks = useSatelliteStore((s) => s.getSatelliteLinks)

  const geojsonData = useMemo((): FeatureCollection<LineString> => {
    const links = getSatelliteLinks()

    const features = links
      .map((link) => {
        const from = positions.get(link.fromNoradId)
        const to = positions.get(link.toNoradId)
        if (!from || !to) return null

        // Handle antimeridian crossing: if longitude diff > 180, we need to split
        // For simplicity, just draw a direct line (MapLibre handles wrapping)
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [from.lon, from.lat],
              [to.lon, to.lat],
            ],
          },
          properties: {
            fromId: link.fromNoradId,
            toId: link.toNoradId,
          },
        }
      })
      .filter(Boolean) as FeatureCollection<LineString>['features']

    return {
      type: 'FeatureCollection',
      features,
    }
  }, [positions, getSatelliteLinks])

  if (geojsonData.features.length === 0) return null

  return (
    <Source id="satellite-links-source" type="geojson" data={geojsonData}>
      {/* Glow effect — wider, more transparent */}
      <Layer
        id="satellite-links-glow"
        type="line"
        paint={{
          'line-color': '#00ffff',
          'line-width': 6,
          'line-opacity': 0.15,
          'line-blur': 4,
        }}
      />
      {/* Main link line */}
      <Layer
        id="satellite-links-layer"
        type="line"
        paint={{
          'line-color': '#00ffff',
          'line-width': 1.5,
          'line-opacity': 0.85,
          'line-dasharray': [4, 3],
        }}
      />
    </Source>
  )
}
