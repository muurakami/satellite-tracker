import type { Satellite, OrbitType, SatellitePurpose, TLE } from '@/types/satellite'

const CELESTRAK_URL =
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle'

// Proxy URL to avoid CORS issues in browser
const PROXY_URL = '/api/celestrak-proxy'

interface RawTLEEntry {
  name: string
  line1: string
  line2: string
}

/**
 * Parse raw TLE text format into structured entries.
 * TLE format: 3 lines per satellite (name, line1, line2)
 */
export function parseTLEText(text: string): RawTLEEntry[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const entries: RawTLEEntry[] = []

  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i]
    const line1 = lines[i + 1]
    const line2 = lines[i + 2]

    // Validate TLE lines start with 1 and 2
    if (line1.startsWith('1 ') && line2.startsWith('2 ')) {
      entries.push({ name, line1, line2 })
    }
  }

  return entries
}

/**
 * Determine orbit type from TLE line 2 (inclination + mean motion)
 */
function determineOrbitType(line2: string): OrbitType {
  // Mean motion (revolutions per day) is in columns 52-63
  const meanMotionStr = line2.substring(52, 63).trim()
  const meanMotion = parseFloat(meanMotionStr)

  if (isNaN(meanMotion)) return 'LEO'

  // Period in minutes = 1440 / meanMotion
  const periodMin = 1440 / meanMotion

  if (periodMin < 128) return 'LEO'       // < ~2 hours
  if (periodMin < 720) return 'MEO'       // 2-12 hours
  if (periodMin < 1500) return 'GEO'      // ~24 hours (geostationary)
  return 'HEO'                             // > 24 hours (highly elliptical)
}

/**
 * Extract NORAD ID from TLE line 1
 */
function extractNoradId(line1: string): number {
  const noradStr = line1.substring(2, 7).trim()
  return parseInt(noradStr, 10)
}

/**
 * Extract orbital inclination (degrees) from TLE line 2 (columns 8-16)
 */
function extractInclination(line2: string): number {
  return parseFloat(line2.substring(8, 16).trim())
}

/**
 * Extract Right Ascension of Ascending Node (degrees) from TLE line 2 (columns 17-25)
 */
function extractRaan(line2: string): number {
  return parseFloat(line2.substring(17, 25).trim())
}

/**
 * Convert raw TLE entry to Satellite object
 */
function tleEntryToSatellite(entry: RawTLEEntry): Satellite {
  const noradId = extractNoradId(entry.line1)
  const orbitType = determineOrbitType(entry.line2)
  const inclinationDeg = extractInclination(entry.line2)
  const raan = extractRaan(entry.line2)

  // Estimate altitude from mean motion
  const meanMotion = parseFloat(entry.line2.substring(52, 63).trim())
  const periodMin = 1440 / meanMotion
  // Kepler's third law: a^3 = (T/2π)^2 * GM
  // Simplified: altitude ≈ (periodMin/90)^(2/3) * 400 km (rough estimate)
  const altitudeKm = Math.round(Math.pow(periodMin / 90, 2 / 3) * 400)

  return {
    noradId,
    name: entry.name,
    country: 'Unknown',
    operator: 'Unknown',
    orbitType,
    purpose: 'unknown' as SatellitePurpose,
    altitudeKm,
    periodMin: Math.round(periodMin),
    inclinationDeg: isNaN(inclinationDeg) ? undefined : inclinationDeg,
    raan: isNaN(raan) ? undefined : raan,
    tle: {
      line1: entry.line1,
      line2: entry.line2,
    } as TLE,
  }
}

/**
 * Fetch TLE data from CelesTrak via proxy API route
 */
export async function fetchCelesTrakTLE(): Promise<Satellite[]> {
  const res = await fetch(PROXY_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch TLE data: ${res.status}`)
  }
  const text = await res.text()
  const entries = parseTLEText(text)
  return entries.map(tleEntryToSatellite)
}

/**
 * Parse TLE text directly into Satellite objects (for file upload)
 */
export function fetchCelesTrakTLEFromText(text: string): Satellite[] {
  const entries = parseTLEText(text)
  return entries.map(tleEntryToSatellite)
}

/**
 * Fetch TLE data directly (for server-side or when CORS is not an issue)
 */
export async function fetchCelesTrakTLEDirect(): Promise<Satellite[]> {
  const res = await fetch(CELESTRAK_URL, {
    headers: {
      'Accept': 'text/plain',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch TLE data: ${res.status}`)
  }
  const text = await res.text()
  const entries = parseTLEText(text)
  return entries.map(tleEntryToSatellite)
}
