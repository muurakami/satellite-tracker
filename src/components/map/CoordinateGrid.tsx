'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import type { FeatureCollection, LineString, Point } from 'geojson'
import { useMapStore } from '@/store/useMapStore'

// Generate latitude line coordinates: from lon=-180 to lon=180
function createLatitudeLine(lat: number): [number, number][] {
  return [
    [-180, lat],
    [-90, lat],
    [0, lat],
    [90, lat],
    [180, lat],
  ]
}

// Generate longitude line coordinates: from lat=-90 to lat=90
function createLongitudeLine(lon: number): [number, number][] {
  return [
    [lon, -90],
    [lon, 0],
    [lon, 90],
  ]
}

// Format label for coordinate intersection
function formatLabel(lat: number, lon: number): string {
  const latDir = lat > 0 ? 'N' : lat < 0 ? 'S' : ''
  const lonDir = lon > 0 ? 'E' : lon < 0 ? 'W' : ''

  const latStr = lat === 0 ? '0°' : `${Math.abs(lat)}°${latDir}`
  const lonStr = lon === 0 ? '0°' : `${Math.abs(lon)}°${lonDir}`

  if (lat === 0 && lon === 0) return '0°'
  if (lat === 0) return `0° ${lonStr}`
  if (lon === 0) return `${latStr} 0°`
  return `${latStr} ${lonStr}`
}

export default function CoordinateGrid() {
  const showGrid = useMapStore((s) => s.showGrid)

  // Generate all grid features once (static, never changes)
  const { gridLines, principalLines, gridLabels } = useMemo(() => {
    const regularLats = [-60, -30, 30, 60] // exclude equator (0) for principal
    const regularLons = [-150, -120, -90, -60, -30, 30, 60, 90, 120, 150] // exclude 0 and 180 for principal

    // Regular latitude lines (excluding equator)
    const latLines: GeoJSON.Feature<LineString>[] = regularLats.map((lat) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: createLatitudeLine(lat),
      },
      properties: {},
    }))

    // Regular longitude lines (excluding prime meridian and date line)
    const lonLines: GeoJSON.Feature<LineString>[] = regularLons.map((lon) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: createLongitudeLine(lon),
      },
      properties: {},
    }))

    const gridLinesCollection: FeatureCollection<LineString> = {
      type: 'FeatureCollection',
      features: [...latLines, ...lonLines],
    }

    // Principal lines: equator (lat=0) and prime meridian (lon=0)
    const principalLinesCollection: FeatureCollection<LineString> = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: createLatitudeLine(0), // equator
          },
          properties: {},
        },
        {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: createLongitudeLine(0), // prime meridian
          },
          properties: {},
        },
      ],
    }

    // Labels at every 30° intersection
    const latitudes = [-60, -30, 0, 30, 60]
    const longitudes = [-120, -90, -60, -30, 0, 30, 60, 90, 120]

    const labelPoints: GeoJSON.Feature<Point>[] = []
    for (const lat of latitudes) {
      for (const lon of longitudes) {
        labelPoints.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [lon, lat],
          },
          properties: {
            label: formatLabel(lat, lon),
          },
        })
      }
    }

    const gridLabelsCollection: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: labelPoints,
    }

    return {
      gridLines: gridLinesCollection,
      principalLines: principalLinesCollection,
      gridLabels: gridLabelsCollection,
    }
  }, [])

  if (!showGrid) return null

  return (
    <>
      {/* Regular grid lines */}
      <Source id="grid-lines" type="geojson" data={gridLines}>
        <Layer
          id="grid-lines-layer"
          type="line"
          source="grid-lines"
          paint={{
            'line-color': '#ffffff',
            'line-opacity': 0.12,
            'line-width': 0.6,
          }}
        />
      </Source>

      {/* Principal lines: equator and prime meridian */}
      <Source id="grid-principal" type="geojson" data={principalLines}>
        <Layer
          id="grid-principal-layer"
          type="line"
          source="grid-principal"
          paint={{
            'line-color': '#ffffff',
            'line-opacity': 0.35,
            'line-width': 1.0,
          }}
        />
      </Source>

      {/* Grid labels */}
      <Source id="grid-labels" type="geojson" data={gridLabels}>
        <Layer
          id="grid-labels-layer"
          type="symbol"
          source="grid-labels"
          minzoom={2}
          layout={{
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Regular', 'Noto Sans Regular'],
            'text-size': 10,
          }}
          paint={{
            'text-color': '#ffffff',
            'text-opacity': 0.4,
            'text-halo-color': '#000000',
            'text-halo-width': 1,
          }}
        />
      </Source>
    </>
  )
}
