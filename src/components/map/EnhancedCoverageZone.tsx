'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import type { FeatureCollection, Polygon } from 'geojson'
import { useCoverageStore } from '@/store/useCoverageStore'
import { generateGradientCoverage, type CoveragePoint } from '@/lib/coverage-geometry'

export interface EnhancedCoverageZoneProps {
  position: CoveragePoint
  noradId: string
}

export default function EnhancedCoverageZone({
  position,
  noradId,
}: EnhancedCoverageZoneProps) {
  const { showCoverage, showGradient, minElevationDeg, gradientRings } =
    useCoverageStore()

  const sourceId = `coverage-source-${noradId}`
  const fillLayerId = `coverage-fill-${noradId}`
  const borderLayerId = `coverage-border-${noradId}`

  const coverageData = useMemo((): FeatureCollection<Polygon> | null => {
    if (!showCoverage) return null

    return generateGradientCoverage(
      position,
      minElevationDeg,
      showGradient ? gradientRings : 1
    )
  }, [position, showCoverage, showGradient, minElevationDeg, gradientRings])

  if (!coverageData || coverageData.features.length === 0) return null

  return (
    <Source
      id={sourceId}
      type="geojson"
      data={coverageData}
    >
      {/* Fill layer - color based on zone type using case expression */}
      <Layer
        id={fillLayerId}
        type="fill"
        paint={{
          'fill-color': [
            'case',
            ['==', ['get', 'zone'], 'outer'], '#ff4444',
            ['==', ['get', 'zone'], 'middle'], '#ffaa00',
            ['==', ['get', 'zone'], 'center'], '#00ff88',
            ['==', ['get', 'zone'], 'full'], '#00ff88',
            '#ffffff'
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'zone'], 'outer'], 0.08,
            ['==', ['get', 'zone'], 'middle'], 0.12,
            ['==', ['get', 'zone'], 'center'], 0.2,
            ['==', ['get', 'zone'], 'full'], 0.15,
            0.1
          ],
        }}
      />

      {/* Border lines */}
      <Layer
        id={borderLayerId}
        type="line"
        paint={{
          'line-color': '#ffffff',
          'line-width': 0.5,
          'line-opacity': 0.5,
        }}
      />
    </Source>
  )
}
