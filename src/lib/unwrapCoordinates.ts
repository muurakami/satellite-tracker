/**
 * Unwraps longitude coordinates to prevent antimeridian crossing artifacts.
 * MapLibre supports longitudes outside [-180, 180], so we make the path
 * continuous instead of splitting it at ±180°.
 */
export function unwrapLongitudes(
  coords: [number, number][]
): [number, number][] {
  if (coords.length === 0) return []

  const result: [number, number][] = [[coords[0][0], coords[0][1]]]
  let offset = 0

  for (let i = 1; i < coords.length; i++) {
    const prevLon = result[i - 1][0] // already with offset applied
    const rawLon = coords[i][0]

    // Normalize difference to [-180, 180]
    let delta = rawLon - (prevLon - offset)
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360

    const unwrapped = prevLon + delta

    result.push([unwrapped, coords[i][1]])
  }

  return result
}

/**
 * Splits a long track into segments by orbits.
 * This is needed so the end of one orbit doesn't connect to the start of the next.
 */
export function splitIntoOrbits(
  coords: [number, number][],
  pointsPerOrbit: number
): [number, number][][] {
  const segments: [number, number][][] = []

  for (let i = 0; i < coords.length; i += pointsPerOrbit) {
    const segment = coords.slice(i, i + pointsPerOrbit + 1) // +1 for overlap
    if (segment.length > 1) {
      segments.push(unwrapLongitudes(segment))
    }
  }

  return segments
}
