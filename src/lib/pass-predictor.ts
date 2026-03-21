import * as satellite from 'satellite.js'
import type { Satellite, SatellitePass } from '@/types/satellite'

interface PassEvent {
  time: Date
  elevation: number
  inPass: boolean
}

export function calculatePasses(
  satellites: Satellite[],
  lat: number,
  lon: number,
  hours: number = 24
): SatellitePass[] {
  // GEO satellites never "pass" over a point in classical sense - they stay fixed
  // Filter to LEO/MEO/HEO only, cap at 200 for performance
  const candidates = satellites
    .filter((s) => s.orbitType !== 'GEO')
    .slice(0, 200)

  const observerGd = {
    longitude: satellite.degreesToRadians(lon),
    latitude: satellite.degreesToRadians(lat),
    height: 0, // km
  }

  const now = new Date()
  const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000)
  const stepMs = 30 * 1000 // 30 seconds

  const passes: SatellitePass[] = []

  for (const sat of candidates) {
    try {
      const satrec = satellite.twoline2satrec(sat.tle.line1, sat.tle.line2)
      if (!satrec) continue

      const passEvents: PassEvent[] = []
      let currentTime = new Date(now)

      // Walk through time window
      while (currentTime <= endTime) {
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

        currentTime = new Date(currentTime.getTime() + stepMs)
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

          if (aosTime && maxElevation >= 5) {
            passes.push({
              noradId: sat.noradId,
              name: sat.name,
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
      if (inPass && aosTime && maxElevation >= 5) {
        passes.push({
          noradId: sat.noradId,
          name: sat.name,
          aos: aosTime.toISOString(),
          los: endTime.toISOString(),
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
