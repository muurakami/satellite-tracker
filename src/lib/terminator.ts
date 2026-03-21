import type { Feature, Polygon } from 'geojson'

function getSubsolarPoint(date: Date): { lat: number; lon: number } {
  const julianDate = date.getTime() / 86400000 + 2440587.5
  const n = julianDate - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180)
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * (Math.PI / 180)
  const epsilon = 23.439 * (Math.PI / 180)
  const lat = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) * (180 / Math.PI)
  const GMST = (18.697375 + 24.065709824279 * (julianDate - 2451545.0)) % 24
  const lon =
    (Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) * (180 / Math.PI)) -
    GMST * 15
  return { lat, lon: ((lon + 180) % 360) - 180 }
}

function buildNightRing(subLat: number, subLon: number): [number, number][] {
  // EQUINOX CASE: subLat ≈ 0 → tan(lat0) ≈ 0 → division by zero
  // Terminator becomes a meridian perpendicular to the sun
  if (Math.abs(subLat) < 0.5) {
    const termLon = ((subLon - 90 + 540) % 360) - 180
    const nightLon = ((subLon + 90 + 540) % 360) - 180
    const ring: [number, number][] = []
    // Down one meridian, up the other — covers night hemisphere
    for (let lat = 90; lat >= -90; lat -= 1) ring.push([termLon, lat])
    for (let lat = -90; lat <= 90; lat += 1) ring.push([nightLon, lat])
    ring.push([termLon, 90])
    return ring
  }

  // STANDARD CASE: iterate by longitude, compute terminator latitude
  const lat0 = subLat * (Math.PI / 180)
  const lon0 = subLon * (Math.PI / 180)
  const points: [number, number][] = []

  for (let lonDeg = -180; lonDeg <= 180; lonDeg += 1) {
    const lon = lonDeg * (Math.PI / 180)
    const latRad = Math.atan(-Math.cos(lon - lon0) / Math.tan(lat0))
    const latDeg = latRad * (180 / Math.PI)
    // Guard against any remaining NaN/Infinity
    if (!isFinite(latDeg)) continue
    points.push([lonDeg, latDeg])
  }

  const pole = subLat > 0 ? -90 : 90
  return [[-180, pole], ...points, [180, pole], [-180, pole]]
}

export function getNightPolygon(date: Date): Feature<Polygon> {
  const { lat, lon } = getSubsolarPoint(date)
  const ring = buildNightRing(lat, lon)
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ring] },
    properties: {},
  }
}
