import * as satellite from 'satellite.js'
import type {
  Satellite as SatelliteData,
  SatellitePosition,
  WorkerMessageIn,
  WorkerMessageOut,
} from '@/types/satellite'

function degreesLat(rad: number): number {
  return satellite.degreesLat(rad)
}

function degreesLong(rad: number): number {
  return satellite.degreesLong(rad)
}

function calculatePosition(
  sat: SatelliteData,
  date: Date
): SatellitePosition | null {
  try {
    const satrec = satellite.twoline2satrec(sat.tle.line1, sat.tle.line2)
    const result = satellite.propagate(satrec, date)

    if (
      !result ||
      typeof result.position === 'boolean' ||
      !result.position ||
      typeof result.velocity === 'boolean' ||
      !result.velocity
    ) {
      return null
    }

    const positionEci = result.position
    const velocityEci = result.velocity

    const gmst = satellite.gstime(date)
    const positionGd = satellite.eciToGeodetic(positionEci, gmst)

    const velocityKmS = Math.sqrt(
      velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
    )

    return {
      noradId: sat.noradId,
      lat: degreesLat(positionGd.latitude),
      lon: degreesLong(positionGd.longitude),
      alt: positionGd.height,
      velocityKmS,
      ts: date.getTime(),
    }
  } catch {
    return null
  }
}

let isCalculating = false

self.onmessage = (e: MessageEvent<WorkerMessageIn>) => {
  const { type, payload } = e.data

  if (type === 'CALCULATE') {
    // Skip if previous calculation is still in progress
    if (isCalculating) return

    isCalculating = true

    try {
      const date = new Date(payload.timestamp)
      const positions: SatellitePosition[] = []

      for (const sat of payload.satellites) {
        const pos = calculatePosition(sat, date)
        if (pos) {
          positions.push(pos)
        }
      }

      const response: WorkerMessageOut = {
        type: 'POSITIONS',
        payload: positions,
      }

      self.postMessage(response)
    } catch (err) {
      console.error('[Worker] calculation failed:', err)
    } finally {
      isCalculating = false
    }
  }
}
