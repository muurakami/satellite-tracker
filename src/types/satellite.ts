export type OrbitType = 'LEO' | 'MEO' | 'GEO' | 'HEO'
export type SatellitePurpose = 'communications' | 'navigation' | 'earth-observation' | 'scientific' | 'unknown'

// Satellite groups for filtering
export type SatelliteGroup = 
  | 'geo' 
  | 'gps' 
  | 'glonass' 
  | 'galileo' 
  | 'beidou'
  | 'starlink'
  | 'oneweb'
  | 'iridium'

// Default groups shown on app start (GEO + navigation)
export const DEFAULT_GROUPS: SatelliteGroup[] = ['geo', 'gps', 'glonass', 'galileo', 'beidou']

// Configuration for each satellite group
export const GROUP_CONFIG: Record<SatelliteGroup, {
  name: string
  description: string
  filter: { orbit?: OrbitType; q?: string }
  icon: string
}> = {
  geo: { 
    name: 'GEO', 
    description: 'Geostationary satellites',
    filter: { orbit: 'GEO' }, 
    icon: '📡' 
  },
  gps: { 
    name: 'GPS', 
    description: 'Global Positioning System',
    filter: { q: 'GPS' }, 
    icon: '🛰️' 
  },
  glonass: { 
    name: 'GLONASS', 
    description: 'Russian navigation system',
    filter: { q: 'GLONASS' }, 
    icon: '🛰️' 
  },
  galileo: { 
    name: 'Galileo', 
    description: 'European navigation system',
    filter: { q: 'GALILEO' }, 
    icon: '🛰️' 
  },
  beidou: { 
    name: 'BeiDou', 
    description: 'Chinese navigation system',
    filter: { q: 'BEIDOU' }, 
    icon: '🛰️' 
  },
  starlink: { 
    name: 'Starlink', 
    description: 'SpaceX satellite constellation',
    filter: { q: 'STARLINK' }, 
    icon: '✨' 
  },
  oneweb: { 
    name: 'OneWeb', 
    description: 'OneWeb constellation',
    filter: { q: 'ONEWEB' }, 
    icon: '🌐' 
  },
  iridium: { 
    name: 'Iridium', 
    description: 'Iridium communications',
    filter: { q: 'IRIDIUM' }, 
    icon: '📱' 
  },
}

// All available groups for UI iteration
export const ALL_GROUPS: SatelliteGroup[] = [
  'geo', 'gps', 'glonass', 'galileo', 'beidou', 'starlink', 'oneweb', 'iridium'
]

export interface TLE {
  line1: string
  line2: string
}

export interface Satellite {
  noradId: number
  name: string
  country: string
  operator: string
  orbitType: OrbitType
  purpose: SatellitePurpose
  altitudeKm: number
  periodMin: number
  inclinationDeg?: number // Orbital inclination from TLE line2
  raan?: number // Right Ascension of Ascending Node from TLE line2
  tle: TLE
  groups?: SatelliteGroup[] // Optional: groups this satellite belongs to
}

export interface SatelliteLink {
  fromNoradId: number
  toNoradId: number
}

export interface SatellitePosition {
  noradId: number
  lat: number
  lon: number
  alt: number
  velocityKmS: number
  ts: number
}

export interface SatellitePass {
  noradId: number
  name: string
  orbitType: OrbitType
  aos: string // ISO-8601
  los: string // ISO-8601
  maxElevationDeg: number
}

export interface GeoSatelliteVisible {
  noradId: number
  name: string
  orbitType: 'GEO'
  elevationDeg: number
  azimuthDeg: number
}

export interface Subscription {
  id: string
  satelliteId: number
  lat: number
  lon: number
  minElevationDeg: number
}

export interface PassNotification {
  satelliteId: number
  satelliteName: string
  aos: string
  maxElevation: number
  minutesUntilAos: number
}

export interface StatsResponse {
  totalSatellites: number
  byOrbitType: Record<OrbitType, number>
  byCountry: { country: string; count: number }[]
  lastTleSync: string
}

export type WorkerMessageIn = {
  type: 'CALCULATE'
  payload: { satellites: Satellite[]; timestamp: number }
}

export type WorkerMessageOut = {
  type: 'POSITIONS'
  payload: SatellitePosition[]
}
