import type { FeatureCollection } from 'geojson'
import type {
  OrbitType,
  Satellite,
  SatellitePass,
  SatellitePosition,
  SatellitePurpose,
  StatsResponse,
  Subscription,
} from '@/types/satellite'
import {
  getMockSatellites,
  getMockStats,
  getMockPassesForPoint,
  getMockGroundTrack,
  mockSubscribe,
  mockUnsubscribe,
} from './mock-data'
import { fetchCelesTrakTLE } from './celestrak'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8888'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

// Use CelesTrak for real TLE data when in mock mode
const USE_CELESTRAK = process.env.NEXT_PUBLIC_USE_CELESTRAK !== 'false'

// Hard limit on satellites loaded from CelesTrak to prevent browser freeze
// CelesTrak returns 10k+ satellites — we cap at 200 for performance
// User can increase this via NEXT_PUBLIC_CELESTRAK_LIMIT env var
const CELESTRAK_LIMIT = parseInt(
  process.env.NEXT_PUBLIC_CELESTRAK_LIMIT ?? '200',
  10
)

// ===== Data Normalization =====
// Backend uses different format for orbit_type and country - normalize to frontend format

// Backend format: 'LEO_LOW_EARTH_ORBIT', 'MEO_MEDIUM_EARTH_ORBIT', etc.
// Frontend expects: 'LEO', 'MEO', 'GEO', 'HEO'
const ORBIT_TYPE_MAP: Record<string, OrbitType> = {
  'LEO_LOW_EARTH_ORBIT': 'LEO',
  'MEO_MEDIUM_EARTH_ORBIT': 'MEO',
  'GEO_GEOSTATIONARY_EARTH_ORBIT': 'GEO',
  'HEO_HIGHLY_ELLIPTICAL_ORBIT': 'HEO',
  // Fallback for already normalized values
  'LEO': 'LEO',
  'MEO': 'MEO',
  'GEO': 'GEO',
  'HEO': 'HEO',
}

// Backend format: 'USA_UNITED_STATES', 'RU_RUSSIA', 'CN_CHINA', etc.
// Frontend expects: 'USA', 'Russia', 'China'
const COUNTRY_MAP: Record<string, string> = {
  'USA_UNITED_STATES': 'USA',
  'RU_RUSSIA': 'Russia',
  'CN_CHINA': 'China',
  'IN_INDIA': 'India',
  'JP_JAPAN': 'Japan',
  'FR_FRANCE': 'France',
  'UK_UNITED_KINGDOM': 'UK',
  'DE_GERMANY': 'Germany',
  'IT_ITALY': 'Italy',
  'CA_CANADA': 'Canada',
  'BR_BRAZIL': 'Brazil',
  'AU_AUSTRALIA': 'Australia',
  'ES_SPAIN': 'Spain',
  'NL_NETHERLANDS': 'Netherlands',
  'SE_SWEDEN': 'Sweden',
  'NO_NORWAY': 'Norway',
  'KR_SOUTH_KOREA': 'South Korea',
  'AR_ARGENTINA': 'Argentina',
  'IL_ISRAEL': 'Israel',
  'IR_IRAN': 'Iran',
  'KP_NORTH_KOREA': 'North Korea',
  'PK_PAKISTAN': 'Pakistan',
  'TR_TURKEY': 'Turkey',
  'AE_UNITED_ARAB_EMIRATES': 'UAE',
  'SA_SAUDI_ARABIA': 'Saudi Arabia',
  'ZA_SOUTH_AFRICA': 'South Africa',
  'NG_NIGERIA': 'Nigeria',
  'EG_EGYPT': 'Egypt',
  'NZ_NEW_ZEALAND': 'New Zealand',
  'BE_BELGIUM': 'Belgium',
  'CH_SWITZERLAND': 'Switzerland',
  'AT_AUSTRIA': 'Austria',
  'PL_POLAND': 'Poland',
  'CZ_CZECH_REPUBLIC': 'Czech Republic',
  'HU_HUNGARY': 'Hungary',
  'RO_ROMANIA': 'Romania',
  'UA_UKRAINE': 'Ukraine',
  'BY_BELARUS': 'Belarus',
  'KZ_KAZAKHSTAN': 'Kazakhstan',
  'VN_VIETNAM': 'Vietnam',
  'TH_THAILAND': 'Thailand',
  'MY_MALAYSIA': 'Malaysia',
  'SG_SINGAPORE': 'Singapore',
  'ID_INDONESIA': 'Indonesia',
  'PH_PHILIPPINES': 'Philippines',
  'MX_MEXICO': 'Mexico',
  'CL_CHILE': 'Chile',
  'CO_COLOMBIA': 'Colombia',
  'PE_PERU': 'Peru',
  'VE_VENEZUELA': 'Venezuela',
  'DZ_ALGERIA': 'Algeria',
  'MA_MOROCCO': 'Morocco',
  'TN_TUNISIA': 'Tunisia',
  'ET_ETHIOPIA': 'Ethiopia',
  'KE_KENYA': 'Kenya',
}

interface RawSatellite {
  noradId?: number
  id?: number
  name?: string
  country?: string
  operator?: string
  orbitType?: string
  orbit_type?: string
  purpose?: string
  purpose_type?: string
  altitudeKm?: number
  apogeeKm?: number
  perigeeKm?: number
  periodMin?: number
  periodMinutes?: number
  inclination?: number
  inclinationDeg?: number
  raan?: number
  tle?: { line1: string; line2: string }
  tleLine1?: string
  tleLine2?: string
  // Additional fields from backend
  objectType?: string
  eccentricity?: number
  epochTime?: string
}

function normalizeSatellite(raw: RawSatellite): Satellite {
  // Resolve noradId - backend may use 'id' or 'noradId'
  const noradId = raw.noradId ?? raw.id ?? 0

  // Resolve orbit type - backend may use 'orbitType' or 'orbit_type'
  // Backend values: 'LEO_LOW_EARTH_ORBIT', 'MEO_MEDIUM_EARTH_ORBIT', etc.
  const rawOrbitType = raw.orbitType ?? raw.orbit_type ?? 'LEO_LOW_EARTH_ORBIT'
  const orbitType = ORBIT_TYPE_MAP[rawOrbitType] ?? 'LEO'

  // Resolve country
  // Backend values: 'USA_UNITED_STATES', 'RU_RUSSIA', 'CN_CHINA'
  const country = COUNTRY_MAP[raw.country ?? ''] ?? raw.country ?? 'Unknown'

  // Resolve purpose - default to 'unknown' if not provided
  const rawPurpose = raw.purpose ?? raw.purpose_type ?? 'unknown'
  const purpose: SatellitePurpose = rawPurpose === 'communications' ? 'communications' 
    : rawPurpose === 'navigation' ? 'navigation' 
    : rawPurpose === 'earth-observation' ? 'earth-observation' 
    : rawPurpose === 'scientific' ? 'scientific' 
    : 'unknown'

  // Resolve altitude - backend sends apogeeKm and perigeeKm, frontend expects altitudeKm
  // Use average of apogee and perigee as altitude
  const apogeeKm = (raw.apogeeKm != null && !isNaN(raw.apogeeKm) && isFinite(raw.apogeeKm)) ? raw.apogeeKm : 0
  const perigeeKm = (raw.perigeeKm != null && !isNaN(raw.perigeeKm) && isFinite(raw.perigeeKm)) ? raw.perigeeKm : 0
  const altitudeKm = (apogeeKm + perigeeKm) > 0
    ? (apogeeKm + perigeeKm) / 2
    : (raw.altitudeKm != null && !isNaN(raw.altitudeKm) && isFinite(raw.altitudeKm)) ? raw.altitudeKm : 0

  // Resolve period - backend sends 'periodMinutes', frontend expects 'periodMin'
  const periodMin = (raw.periodMin != null && !isNaN(raw.periodMin) && isFinite(raw.periodMin)) ? raw.periodMin
    : (raw.periodMinutes != null && !isNaN(raw.periodMinutes) && isFinite(raw.periodMinutes)) ? raw.periodMinutes
    : 0
  
  // Resolve inclination - backend sends 'inclination', frontend expects 'inclinationDeg'
  const inclinationDeg = (raw.inclinationDeg != null && !isNaN(raw.inclinationDeg) && isFinite(raw.inclinationDeg)) ? raw.inclinationDeg
    : (raw.inclination != null && !isNaN(raw.inclination) && isFinite(raw.inclination)) ? raw.inclination
    : undefined

  // Resolve TLE - backend doesn't send TLE in list response, need separate endpoint
  // For now, create empty TLE - will be loaded separately if needed
  const tle = raw.tle ?? {
    line1: raw.tleLine1 ?? '',
    line2: raw.tleLine2 ?? '',
  }

  // Operator - not in backend response, derive from country or use 'Unknown'
  const operator = raw.operator ?? country

  return {
    noradId,
    name: raw.name ?? 'Unknown',
    country,
    operator,
    orbitType,
    purpose,
    altitudeKm,
    periodMin,
    inclinationDeg,
    raan: raw.raan,
    tle,
  }
}

// ===== API Functions =====

// Helper function to normalize potentially problematic values from backend
function normalizeBackendResponse<T>(data: T): T {
  if (typeof data !== 'object' || data === null) {
    return data
  }
  
  // Create a deep clone to avoid mutating the original data
  // Use structuredClone if available, otherwise fallback to JSON methods
  let cloned: any
  try {
    cloned = structuredClone(data)
  } catch {
    // Fallback for environments that don't support structuredClone
    cloned = JSON.parse(JSON.stringify(data))
  }
  
  // Recursively normalize all numeric values to handle NaN/Infinity
  function normalize(obj: any) {
    if (obj === null || typeof obj !== 'object') return obj
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        
        if (typeof value === 'number') {
          if (isNaN(value) || !isFinite(value)) {
            obj[key] = undefined
          }
        } else if (typeof value === 'object' && value !== null) {
          normalize(value)
        }
      }
    }
    
    return obj
  }
  
  return normalize(cloned)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Direct request to backend - CORS is configured on backend v1.3
  const fullPath = path.startsWith('/') ? path : `/${path}`
  const res = await fetch(`${BASE_URL}/api${fullPath}`, init)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  const data = await res.json()
  return normalizeBackendResponse(data) as T
}

export async function getSatellites(filters?: {
  orbit?: OrbitType
  country?: string
  purpose?: SatellitePurpose
  q?: string
  limit?: number
}): Promise<Satellite[]> {
  if (USE_MOCK) {
    let sats: Satellite[]
    if (USE_CELESTRAK) {
      try {
        const allSats = await fetchCelesTrakTLE()
        // Apply hard limit to prevent browser freeze with 10k+ satellites
        sats = allSats.slice(0, CELESTRAK_LIMIT)
      } catch {
        // Fallback to mock data if CelesTrak fails
        sats = getMockSatellites()
      }
    } else {
      sats = getMockSatellites()
    }
    if (filters?.orbit) sats = sats.filter((s) => s.orbitType === filters.orbit)
    if (filters?.purpose) sats = sats.filter((s) => s.purpose === filters.purpose)
    if (filters?.q) sats = sats.filter((s) => s.name.toLowerCase().includes(filters.q!.toLowerCase()))
    return sats
  }
  const params = new URLSearchParams()
  if (filters?.orbit) params.set('orbit', filters.orbit)
  if (filters?.country) params.set('country', filters.country)
  if (filters?.purpose) params.set('purpose', filters.purpose)
  if (filters?.q) params.set('q', filters.q)
  // Add size parameter to get more satellites (default is 50 in backend)
  if (!params.has('size')) {
    params.set('size', filters?.limit?.toString() ?? '500')
  }
  const qs = params.toString()
  
  console.log('[API] Loading satellites from:', `${BASE_URL}/api/satellites${qs ? `?${qs}` : ''}`)
  // Backend returns paginated response: { content: Satellite[], totalElements, etc }
  const response = await request<{ content?: RawSatellite[]; data?: RawSatellite[] }>(`/satellites${qs ? `?${qs}` : ''}`)
  const arr = response.content ?? response.data ?? []
  return arr.map(normalizeSatellite)
}

export async function getSatelliteById(id: number): Promise<Satellite> {
  if (USE_MOCK) {
    const sat = getMockSatellites().find((s) => s.noradId === id)
    if (!sat) throw new Error(`Satellite ${id} not found`)
    return sat
  }
  // Backend uses /card endpoint
  const response = await request<RawSatellite>(`/satellites/${id}/card`)
  return normalizeSatellite(response)
}

export async function getSatelliteTLE(noradId: number): Promise<{ line1: string; line2: string }> {
  if (USE_MOCK) {
    const sat = getMockSatellites().find((s) => s.noradId === noradId)
    if (!sat) throw new Error(`Satellite ${noradId} not found`)
    return sat.tle
  }
  // Get TLE from card endpoint (backend doesn't have separate /tle endpoint)
  const sat = await request<RawSatellite>(`/satellites/${noradId}/card`)
  return sat.tle ?? { line1: sat.tleLine1 ?? '', line2: sat.tleLine2 ?? '' }
}

export async function getSatellitePosition(
  id: number,
  timestamp: number
): Promise<SatellitePosition> {
  if (USE_MOCK) {
    // Positions are computed on frontend via Web Worker
    throw new Error('Use Web Worker for mock position calculation')
  }
  // Backend: GET /api/satellites/{noradId}/position?time=ISO_STRING
  const isoTime = new Date(timestamp).toISOString()
  const response = await request<any>(`/satellites/${id}/position?time=${isoTime}`)
  
  // Normalize position data to handle potential NaN values
  return {
    noradId: response.noradId,
    lat: (response.lat != null && !isNaN(response.lat) && isFinite(response.lat)) ? response.lat : 0,
    lon: (response.lon != null && !isNaN(response.lon) && isFinite(response.lon)) ? response.lon : 0,
    alt: (response.alt != null && !isNaN(response.alt) && isFinite(response.alt)) ? response.alt : 0,
    velocityKmS: (response.velocityKmS != null && !isNaN(response.velocityKmS) && isFinite(response.velocityKmS)) ? response.velocityKmS : 0,
    ts: (response.ts != null && !isNaN(response.ts) && isFinite(response.ts)) ? response.ts : Date.now()
  }
}

export async function getGroundTrack(
  id: number,
  orbits: number
): Promise<FeatureCollection> {
  if (USE_MOCK) {
    return getMockGroundTrack(id)
  }
  // Backend: GET /api/satellites/{noradId}/track
  return request<FeatureCollection>(`/satellites/${id}/track`)
}

export async function getPassesForPoint(
  lat: number,
  lon: number,
  hours: number
): Promise<SatellitePass[]> {
  if (USE_MOCK) {
    return getMockPassesForPoint(lat, lon)
  }
  // Backend: GET /api/satellites/passes/batch?lat=&lon=&hoursAhead=
  return request<SatellitePass[]>(`/satellites/passes/batch?lat=${lat}&lon=${lon}&hoursAhead=${hours}`)
}

export async function getStats(): Promise<StatsResponse> {
  if (USE_MOCK) {
    return getMockStats()
  }
  // Backend doesn't have /stats endpoint - return empty stats
  return {
    totalSatellites: 0,
    byOrbitType: { LEO: 0, MEO: 0, GEO: 0, HEO: 0 },
    byCountry: [],
    lastTleSync: new Date().toISOString(),
  } as StatsResponse
}

export async function subscribe(
  payload: Omit<Subscription, 'id'>
): Promise<Subscription> {
  if (USE_MOCK) {
    return mockSubscribe(payload)
  }
  return request<Subscription>('/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function unsubscribe(id: string): Promise<void> {
  if (USE_MOCK) {
    return mockUnsubscribe()
  }
  await request<void>(`/subscriptions/${id}`, { method: 'DELETE' })
}
