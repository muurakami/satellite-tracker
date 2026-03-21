'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import * as satellite from 'satellite.js'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import { unwrapLongitudes, splitIntoOrbits } from '@/lib/unwrapCoordinates'
import type { FeatureCollection, LineString } from 'geojson'
import type { OrbitType } from '@/types/satellite'

const ORBIT_COLORS: Record<OrbitType, string> = {
  LEO: '#00ff88',
  MEO: '#ffaa00',
  GEO: '#ff4466',
  HEO: '#aa88ff',
}

interface TrackPoint {
  lon: number
  lat: number
  ts: number
}

// Convert segments to GeoJSON FeatureCollection
function toFeatureCollection(segs: [number, number][][]): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: segs
      .filter((s) => s.length >= 2)
      .map((s) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: s,
        },
        properties: {},
      })),
  }
}

export default function GroundTrack() {
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite)
  const showGroundTrack = useMapStore((s) => s.showGroundTrack)
  const showFullTrack = useMapStore((s) => s.showFullTrack)
  const simulationTime = useSimulationStore((s) => s.simulationTime)

  const { pastTracks, futureTracks, orbitColor } = useMemo(() => {
    const empty = { type: 'FeatureCollection' as const, features: [] }

    if (!selectedSatellite?.tle?.line1 || !showGroundTrack) {
      return { pastTracks: empty, futureTracks: empty, orbitColor: '#00ff88' }
    }

    const { tle, periodMin = 90, altitudeKm = 500, orbitType = 'LEO' } = selectedSatellite
    const orbitColor = ORBIT_COLORS[orbitType]

    // Period in milliseconds (defensive)
    const periodMs = periodMin * 60 * 1000
    // Higher resolution for LEO (faster), lower for higher orbits
    const stepMs = altitudeKm < 600 ? 15_000 : 30_000

    // Points per orbit: ~90 min orbit / 15s step = ~360 points, or ~180 for 30s step
    const pointsPerOrbit = altitudeKm < 600 ? 360 : 180

    const simTs = simulationTime instanceof Date
      ? simulationTime.getTime()
      : Date.now()

    // Number of orbits to show
    const pastOrbits = showFullTrack ? 5 : 1
    const futureOrbits = showFullTrack ? 5 : 2

    // Time range based on showFullTrack
    const startTime = simTs - periodMs * pastOrbits
    const endTime = simTs + periodMs * futureOrbits

    // Create satellite record from TLE
    let satrec: satellite.SatRec
    try {
      satrec = satellite.twoline2satrec(tle.line1, tle.line2)
    } catch {
      return { pastTracks: empty, futureTracks: empty, orbitColor }
    }

    // Generate all points with continuous longitudes
    const allPoints: TrackPoint[] = []
    let cumulativeLon = 0 // Track cumulative longitude to avoid jumps

    for (let ts = startTime; ts <= endTime; ts += stepMs) {
      try {
        const pv = satellite.propagate(satrec, new Date(ts))
        if (!pv || !pv.position || typeof pv.position === 'boolean') continue

        const gmst = satellite.gstime(new Date(ts))
        const geo = satellite.eciToGeodetic(
          pv.position as satellite.EciVec3<number>,
          gmst
        )
        const rawLon = satellite.degreesLong(geo.longitude)
        const lat = satellite.degreesLat(geo.latitude)

        if (!isFinite(rawLon) || !isFinite(lat)) continue

        // Normalize lon to be continuous (unwrap)
        const normalizedLon = rawLon + cumulativeLon * 360

        // Track when we cross the antimeridian to adjust cumulative offset
        if (allPoints.length > 0) {
          const prevRawLon = allPoints[allPoints.length - 1].lon - cumulativeLon * 360
          const diff = rawLon - prevRawLon

          // If diff > 180, we crossed westward (e.g., 179 → -179)
          // If diff < -180, we crossed eastward (e.g., -179 → 179)
          if (diff > 180) {
            cumulativeLon -= 1
          } else if (diff < -180) {
            cumulativeLon += 1
          }
        }

        const unwrappedLon = rawLon + cumulativeLon * 360

        allPoints.push({ lon: unwrappedLon, lat, ts })
      } catch {
        continue
      }
    }

    if (allPoints.length < 2) {
      return { pastTracks: empty, futureTracks: empty, orbitColor }
    }

    // Split past / future
    const pastPoints = allPoints.filter((p) => p.ts <= simTs)
    const futurePoints = allPoints.filter((p) => p.ts >= simTs)

    // Convert to coordinate arrays
    const pastCoords = pastPoints.map((p) => [p.lon, p.lat] as [number, number])
    const futureCoords = futurePoints.map((p) => [p.lon, p.lat] as [number, number])

    // For full track, split into orbits to avoid connecting end of one orbit to start of next
    let pastFC: FeatureCollection<LineString>
    let futureFC: FeatureCollection<LineString>

    if (showFullTrack) {
      // Split into orbits for full track mode
      const pastOrbitSegments = splitIntoOrbits(pastCoords, pointsPerOrbit)
      const futureOrbitSegments = splitIntoOrbits(futureCoords, pointsPerOrbit)

      pastFC = toFeatureCollection(pastOrbitSegments)
      futureFC = toFeatureCollection(futureOrbitSegments)
    } else {
      // For short track, just unwrap and use as single feature
      pastFC = toFeatureCollection([unwrapLongitudes(pastCoords)])
      futureFC = toFeatureCollection([unwrapLongitudes(futureCoords)])
    }

    return { pastTracks: pastFC, futureTracks: futureFC, orbitColor }
  }, [selectedSatellite, simulationTime, showGroundTrack, showFullTrack])

  if (!showGroundTrack || !selectedSatellite) {
    return null
  }

  return (
    <>
      {/* Past track - dashed, dimmer */}
      <Source
        id="groundtrack-past-source"
        type="geojson"
        data={pastTracks ?? { type: 'FeatureCollection', features: [] }}
      >
        <Layer
          id="groundtrack-past-layer"
          type="line"
          source="groundtrack-past-source"
          paint={{
            'line-color': orbitColor,
            'line-width': 1.5,
            'line-opacity': 0.35,
            'line-dasharray': [2, 2],
          }}
        />
      </Source>
      {/* Future track - solid, brighter */}
      <Source
        id="groundtrack-future-source"
        type="geojson"
        data={futureTracks ?? { type: 'FeatureCollection', features: [] }}
      >
        <Layer
          id="groundtrack-future-layer"
          type="line"
          source="groundtrack-future-source"
          paint={{
            'line-color': orbitColor,
            'line-width': 2,
            'line-opacity': 0.85,
          }}
        />
      </Source>
    </>
  )
}
