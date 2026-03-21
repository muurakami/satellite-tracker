import type { Satellite, SatellitePosition } from '@/types/satellite'

/**
 * Filter satellites by current map viewport bounds
 */
export function filterByViewport(
  positions: Map<number, SatellitePosition>,
  bounds: [number, number, number, number], // [west, south, east, north]
  satellites: Satellite[]
): Satellite[] {
  const [west, south, east, north] = bounds
  
  return satellites.filter((sat) => {
    const pos = positions.get(sat.noradId)
    if (!pos) return false
    
    // Handle longitude wrapping (map can show -180 to 180 or 0 to 360)
    const lon = pos.lon
    const lat = pos.lat
    
    // Standard case
    if (west <= east) {
      return lat >= south && lat <= north && lon >= west && lon <= east
    }
    
    // Wrapping case (e.g., bounds cross the antimeridian)
    return lat >= south && lat <= north && (lon >= west || lon <= east)
  })
}

/**
 * Get bounds from map instance
 */
export function getMapBounds(map: maplibregl.Map): [number, number, number, number] | null {
  const bounds = map.getBounds()
  if (!bounds) return null
  
  return [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ]
}

/**
 * Check if a point is within bounds
 */
export function isPointInBounds(
  lat: number,
  lon: number,
  bounds: [number, number, number, number]
): boolean {
  const [west, south, east, north] = bounds
  
  if (west <= east) {
    return lat >= south && lat <= north && lon >= west && lon <= east
  }
  
  return lat >= south && lat <= north && (lon >= west || lon <= east)
}
