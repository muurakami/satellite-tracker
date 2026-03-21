import * as satellite from 'satellite.js'
import type { Satellite, SatellitePass, GeoSatelliteVisible, OrbitType } from '@/types/satellite'

interface PassEvent {
  time: Date
  elevation: number
  inPass: boolean
}

const MIN_ELEVATION_DEG = 2 // Lower threshold from 5° to 2°

export function calculatePasses(
  satellites: Satellite[],
  lat: number,
  lon: number,
  hours: number = 24,
  fromTime: Date = new Date()
): SatellitePass[] {
  // Filter to LEO/MEO/HEO only, cap at 200 for performance
  const candidates = satellites
    .filter((s) => s.orbitType !== 'GEO')
    .slice(0, 200)

  const observerGd = {
    longitude: satellite.degreesToRadians(lon),
    latitude: satellite.degreesToRadians(lat),
    height: 0, // km
  }

  const startTimeMs = fromTime.getTime()
  const endTimeMs = fromTime.getTime() + hours * 60 * 60 * 1000

  const passes: SatellitePass[] = []

  for (const sat of candidates) {
    try {
      const satrec = satellite.twoline2satrec(sat.tle.line1, sat.tle.line2)
      if (!satrec) continue

      const passEvents: PassEvent[] = []
      let currentTimeMs = startTimeMs

      // Adaptive step size: 15s for low LEO (< 600km), 30s for others
      const stepMs = sat.altitudeKm < 600 ? 15000 : 30000

      // Walk through time window
      while (currentTimeMs <= endTimeMs) {
        const currentTime = new Date(currentTimeMs)
        const result = satellite.propagate(satrec, currentTime)

        if (
          result &&
          typeof result.position !== 'boolean' &&
          result.position
        ) {
          const gmst = satellite.gstime(currentTime)
          const positionEci = result.position

          // Convert ECI to ECF
          const positionEcf = satellite.eciToEcf(positionEci, gmst)

          // Calculate look angles (elevation, azimuth)
          const lookAngles = satellite.ecfToLookAngles(
            observerGd,
            positionEcf
          )

          const elevationDeg = satellite.radiansToDegrees(lookAngles.elevation)

          passEvents.push({
            time: new Date(currentTime),
            elevation: elevationDeg,
            inPass: elevationDeg > 0,
          })
        }

        currentTimeMs = currentTimeMs + stepMs
      }

      // Find passes (AOS -> LOS transitions)
      let inPass = false
      let aosTime: Date | null = null
      let maxElevation = -90

      for (const event of passEvents) {
        if (event.inPass && !inPass) {
          // AOS - entering pass
          inPass = true
          aosTime = event.time
          maxElevation = event.elevation
        } else if (event.inPass && inPass) {
          // During pass
          if (event.elevation > maxElevation) {
            maxElevation = event.elevation
          }
        } else if (!event.inPass && inPass) {
          // LOS - exiting pass
          inPass = false

          if (aosTime && maxElevation >= MIN_ELEVATION_DEG) {
            passes.push({
              noradId: sat.noradId,
              name: sat.name,
              orbitType: sat.orbitType,
              aos: aosTime.toISOString(),
              los: event.time.toISOString(),
              maxElevationDeg: maxElevation,
            })
          }

          aosTime = null
          maxElevation = -90
        }
      }

      // Handle pass that extends beyond end of window
      if (inPass && aosTime && maxElevation >= MIN_ELEVATION_DEG) {
        passes.push({
          noradId: sat.noradId,
          name: sat.name,
          orbitType: sat.orbitType,
          aos: aosTime.toISOString(),
          los: new Date(endTimeMs).toISOString(),
          maxElevationDeg: maxElevation,
        })
      }
    } catch {
      // Skip satellites that fail to propagate
      continue
    }
  }

  // Sort by AOS time
  passes.sort((a, b) => new Date(a.aos).getTime() - new Date(b.aos).getTime())

  // Limit to first 50 results
  return passes.slice(0, 50)
}

export function calculateGeoVisible(
  satellites: Satellite[],
  lat: number,
  lon: number,
  atTime: Date = new Date()
): GeoSatelliteVisible[] {
  // Filter to GEO only
  const geoSatellites = satellites.filter((s) => s.orbitType === 'GEO')

  const observerGd = {
    longitude: satellite.degreesToRadians(lon),
    latitude: satellite.degreesToRadians(lat),
    height: 0, // km
  }

  const visible: GeoSatelliteVisible[] = []

  for (const sat of geoSatellites) {
    try {
      const satrec = satellite.twoline2satrec(sat.tle.line1, sat.tle.line2)
      if (!satrec) continue

      const result = satellite.propagate(satrec, atTime)

      if (
        result &&
        typeof result.position !== 'boolean' &&
        result.position
      ) {
        const gmst = satellite.gstime(atTime)
        const positionEci = result.position
        const positionEcf = satellite.eciToEcf(positionEci, gmst)
        const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf)

        const elevationDeg = satellite.radiansToDegrees(lookAngles.elevation)
        const azimuthDeg = satellite.radiansToDegrees(lookAngles.azimuth)

        // Only include if above horizon
        if (elevationDeg > 0) {
          visible.push({
            noradId: sat.noradId,
            name: sat.name,
            orbitType: 'GEO',
            elevationDeg,
            azimuthDeg,
          })
        }
      }
    } catch {
      continue
    }
  }

  // Sort by elevation (highest first)
  visible.sort((a, b) => b.elevationDeg - a.elevationDeg)

  return visible
}
