'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import * as satellite from 'satellite.js'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import type { FeatureCollection, LineString } from 'geojson'
import type { OrbitType } from '@/types/satellite'

const ORBIT_COLORS: Record<OrbitType, string> = {
  LEO: '#00ff88',
  MEO: '#ffaa00',
  GEO: '#ff4466',
  HEO: '#aa88ff',
}

// Split points into segments where antimeridian is crossed
function splitAtAntimeridian(points: [number, number][]): [number, number][][] {
  if (points.length < 2) return [points]

  const segments: [number, number][][] = []
  let currentSegment: [number, number][] = []

  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    currentSegment.push(point)

    if (i < points.length - 1) {
      const nextPoint = points[i + 1]
      const lonDelta = Math.abs(nextPoint[0] - point[0])

      // Crossed antimeridian if longitude delta > 180
      if (lonDelta > 180) {
        segments.push(currentSegment)
        currentSegment = []
      }
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }

  return segments
}

export default function GroundTrack() {
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite)
  const showGroundTrack = useMapStore((s) => s.showGroundTrack)
  const simulationTime = useSimulationStore((s) => s.simulationTime)

  const { pastTracks, futureTracks, orbitColor } = useMemo(() => {
    if (!selectedSatellite || !simulationTime) {
      return { pastTracks: null, futureTracks: null, orbitColor: '#00ff88' }
    }

    const { tle, periodMin, orbitType } = selectedSatellite
    const orbitColor = ORBIT_COLORS[orbitType]

    // Create satellite record from TLE
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2)

    const periodSeconds = periodMin * 60
    const startTime = new Date(simulationTime.getTime() - periodSeconds * 1000) // 1 orbit behind
    const endTime = new Date(simulationTime.getTime() + 2 * periodSeconds * 1000) // 2 orbits ahead
    const stepMs = 30 * 1000 // 30 seconds

    const allPoints: { point: [number, number]; time: Date; isPast: boolean }[] = []

    // Propagate positions
    let currentTime = new Date(startTime.getTime())
    while (currentTime.getTime() <= endTime.getTime()) {
      const result = satellite.propagate(satrec, currentTime)
      if (!result) {
        currentTime = new Date(currentTime.getTime() + stepMs)
        continue
      }
      const position = result.position
      if (position) {
        const gmst = satellite.gstime(currentTime)
        const geodetic = satellite.eciToGeodetic(position, gmst)
        const lon = satellite.degreesLong(geodetic.longitude)
        const lat = satellite.degreesLat(geodetic.latitude)

        const isPast = currentTime.getTime() < simulationTime.getTime()

        allPoints.push({
          point: [lon, lat],
          time: new Date(currentTime.getTime()),
          isPast,
        })
      }

      currentTime = new Date(currentTime.getTime() + stepMs)
    }

    if (allPoints.length === 0) {
      return { pastTracks: null, futureTracks: null, orbitColor }
    }

    // Find index closest to simulationTime
    let closestIndex = 0
    let closestDiff = Infinity
    for (let i = 0; i < allPoints.length; i++) {
      const diff = Math.abs(allPoints[i].time.getTime() - simulationTime.getTime())
      if (diff < closestDiff) {
        closestDiff = diff
        closestIndex = i
      }
    }

    // Split into past and future
    const pastPoints = allPoints.slice(0, closestIndex + 1).map((p) => p.point)
    const futurePoints = allPoints.slice(closestIndex).map((p) => p.point)

    // Split each at antimeridian
    const pastSegments = splitAtAntimeridian(pastPoints)
    const futureSegments = splitAtAntimeridian(futurePoints)

    // Build FeatureCollections
    const pastFeatures: GeoJSON.Feature<LineString>[] = pastSegments.map((segment) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: segment,
      },
      properties: {},
    }))

    const futureFeatures: GeoJSON.Feature<LineString>[] = futureSegments.map((segment) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: segment,
      },
      properties: {},
    }))

    const pastTracks: FeatureCollection<LineString> = {
      type: 'FeatureCollection',
      features: pastFeatures,
    }

    const futureTracks: FeatureCollection<LineString> = {
      type: 'FeatureCollection',
      features: futureFeatures,
    }

    return { pastTracks, futureTracks, orbitColor }
  }, [selectedSatellite, simulationTime])

  if (!showGroundTrack || !selectedSatellite) return null

  return (
    <>
      {/* Past track - dashed line */}
      <Source id="groundtrack-past-source" type="geojson" data={pastTracks ?? { type: 'FeatureCollection', features: [] }}>
        <Layer
          id="groundtrack-past-layer"
          type="line"
          source="groundtrack-past-source"
          paint={{
            'line-color': orbitColor,
            'line-opacity': 0.4,
            'line-width': 1.5,
            'line-dasharray': [2, 2],
          }}
        />
      </Source>
      {/* Future track - solid line */}
      <Source id="groundtrack-future-source" type="geojson" data={futureTracks ?? { type: 'FeatureCollection', features: [] }}>
        <Layer
          id="groundtrack-future-layer"
          type="line"
          source="groundtrack-future-source"
          paint={{
            'line-color': orbitColor,
            'line-opacity': 0.9,
            'line-width': 2,
          }}
        />
      </Source>
    </>
  )
}
