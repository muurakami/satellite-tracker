import type { SatellitePosition, Satellite } from '@/types/satellite'

/**
 * Calculate dot product of two 3D vectors
 */
function dotProduct(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/**
 * Normalize a 3D vector
 */
function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  return [v[0] / len, v[1] / len, v[2] / len]
}

/**
 * Convert lat/lon/alt to 3D position on unit sphere
 */
function latLonAltToUnitXYZ(
  lat: number,
  lon: number,
  altKm: number
): [number, number, number] {
  const r = 1 + (altKm / 6371) // Earth radius = 1
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -r * Math.sin(phi) * Math.cos(theta)
  const y = r * Math.cos(phi)
  const z = r * Math.sin(phi) * Math.sin(theta)

  return [x, y, z]
}

/**
 * Check if a satellite is visible from the camera position
 * A satellite is visible if it's on the side of Earth facing the camera
 * 
 * @param satellitePos - 3D position of satellite on unit sphere
 * @param cameraDirection - Normalized camera direction vector (pointing at Earth center)
 * @param threshold - Dot product threshold (0 = exactly on terminator, positive = visible)
 */
export function isSatelliteVisible(
  satellitePos: [number, number, number],
  cameraDirection: [number, number, number],
  threshold: number = -0.1 // Slightly behind terminator for smoother transition
): boolean {
  // Satellite is visible if it's on the side facing the camera
  // Dot product > threshold means satellite is facing camera
  const normalizedSat = normalize(satellitePos)
  return dotProduct(normalizedSat, cameraDirection) > threshold
}

/**
 * Filter satellites visible from camera position in 3D globe view
 * 
 * @param positions - Map of satellite positions
 * @param satellites - Array of satellites to filter
 * @param cameraPosition - 3D camera position [x, y, z]
 * @returns Filtered array of satellites visible from camera
 */
export function filterBy3DViewport(
  positions: Map<number, SatellitePosition>,
  satellites: Satellite[],
  cameraPosition: [number, number, number]
): Satellite[] {
  // Camera direction points from camera to Earth center (origin)
  const cameraDirection = normalize([
    -cameraPosition[0],
    -cameraPosition[1],
    -cameraPosition[2]
  ])

  return satellites.filter(sat => {
    const pos = positions.get(sat.noradId)
    if (!pos) return false

    const satPos = latLonAltToUnitXYZ(pos.lat, pos.lon, pos.alt)
    return isSatelliteVisible(satPos, cameraDirection)
  })
}

/**
 * Get camera direction from OrbitControls state
 * In react-three-fiber, camera position is relative to scene origin
 */
export function getCameraDirectionFromPosition(
  cameraPosition: [number, number, number]
): [number, number, number] {
  return normalize([
    -cameraPosition[0],
    -cameraPosition[1],
    -cameraPosition[2]
  ])
}
