'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import type { FeatureCollection, Point } from 'geojson'
import type { Satellite, SatellitePosition } from '@/types/satellite'

interface CoverageConeProps {
  satelliteId: number
  satellites: Satellite[]
  positions: Map<number, SatellitePosition>
}

function computeFootprintRadius(altitudeKm: number): number {
  const EARTH_RADIUS_KM = 6371
  const cosAngle = EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitudeKm)
  const angle = Math.acos(cosAngle)
  return angle * EARTH_RADIUS_KM * 1000 // meters
}

export default function CoverageCone({
  satelliteId,
  satellites,
  positions,
}: CoverageConeProps) {
  const pos = positions.get(satelliteId)
  const sat = satellites.find((s) => s.noradId === satelliteId)

  const circleData = useMemo(() => {
    if (!pos || !sat) return null

    const radiusMeters = computeFootprintRadius(pos.alt)

    const feature: FeatureCollection<Point, { radius: number }> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [pos.lon, pos.lat], // MapLibre uses [lon, lat]
          },
          properties: {
            radius: radiusMeters,
          },
        },
      ],
    }

    return feature
  }, [pos, sat])

  if (!circleData) return null

  // Use static source/layer IDs since only one coverage cone is visible at a time
  // This prevents MapLibre "source id changed" error when switching satellites
  return (
    <Source
      id="coverage-source"
      type="geojson"
      data={circleData}
    >
      <Layer
        id="coverage-layer"
        type="circle"
        source="coverage-source"
        paint={{
          'circle-radius': ['get', 'radius'],
          'circle-color': '#ff4466',
          'circle-opacity': 0.1,
          'circle-stroke-color': '#ff4466',
          'circle-stroke-width': 1,
          'circle-stroke-opacity': 0.8,
        }}
      />
    </Source>
  )
}
