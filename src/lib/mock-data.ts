import type { FeatureCollection } from 'geojson'
import * as satellite from 'satellite.js'
import type {
  Satellite,
  SatellitePass,
  SatellitePosition,
  StatsResponse,
  Subscription,
} from '@/types/satellite'

const MOCK_SATELLITES: Satellite[] = [
  {
    noradId: 25544,
    name: 'ISS (ZARYA)',
    country: 'US/Russia',
    operator: 'NASA/Roscosmos',
    orbitType: 'LEO',
    purpose: 'scientific',
    altitudeKm: 420,
    periodMin: 92.6,
    tle: {
      line1: '1 25544U 98067A   24085.50000000  .00016717  00000-0  30800-4 0  9994',
      line2: '2 25544  51.6400 240.0000 0006700  50.0000 310.0000 15.50000000434557',
    },
  },
  {
    noradId: 20580,
    name: 'HUBBLE SPACE TELESCOPE',
    country: 'US',
    operator: 'NASA/ESA',
    orbitType: 'LEO',
    purpose: 'scientific',
    altitudeKm: 535,
    periodMin: 95.4,
    tle: {
      line1: '1 20580U 90037B   24085.50000000  .00000365  00000-0  10000-4 0  9998',
      line2: '2 20580  28.4700 180.0000 0003000  90.0000 270.0000 14.50000000385000',
    },
  },
  {
    noradId: 28474,
    name: 'GPS BIIF-2 (USA 242)',
    country: 'US',
    operator: 'US Space Force',
    orbitType: 'MEO',
    purpose: 'navigation',
    altitudeKm: 20180,
    periodMin: 718.0,
    tle: {
      line1: '1 28474U 04045A   24085.50000000  .00000000  00000-0  00000-0 0  9998',
      line2: '2 28474  55.0000 270.0000 0001000   0.0000  90.0000  2.00560000123456',
    },
  },
  {
    noradId: 44713,
    name: 'STARLINK-1007',
    country: 'US',
    operator: 'SpaceX',
    orbitType: 'LEO',
    purpose: 'communications',
    altitudeKm: 550,
    periodMin: 95.5,
    tle: {
      line1: '1 44713U 19074AH  24085.50000000  .00000900  00000-0  75000-4 0  9991',
      line2: '2 44713  53.0000 100.0000 0001000   0.0000 260.0000 15.06400000234567',
    },
  },
  {
    noradId: 37820,
    name: 'TIANGONG 1',
    country: 'China',
    operator: 'CNSA',
    orbitType: 'LEO',
    purpose: 'scientific',
    altitudeKm: 370,
    periodMin: 92.0,
    tle: {
      line1: '1 37820U 11053A   24085.50000000  .00030000  00000-0  50000-4 0  9992',
      line2: '2 37820  42.7800 200.0000 0009000  30.0000 330.0000 15.60000000356789',
    },
  },
  {
    noradId: 43013,
    name: 'COSMOS 2517',
    country: 'Russia',
    operator: 'Russian Defense Ministry',
    orbitType: 'GEO',
    purpose: 'navigation',
    altitudeKm: 35786,
    periodMin: 1436.0,
    tle: {
      line1: '1 43013U 17073A   24085.50000000  .00000000  00000-0  00000-0 0  9996',
      line2: '2 43013   0.1000  50.0000 0001000   0.0000 180.0000  1.00270000123456',
    },
  },
  {
    noradId: 43628,
    name: 'COSMOS 2528',
    country: 'Russia',
    operator: 'Russian Defense Ministry',
    orbitType: 'LEO',
    purpose: 'navigation',
    altitudeKm: 1200,
    periodMin: 109.0,
    tle: {
      line1: '1 43628U 18073A   24085.50000000  .00002000  00000-0  15000-4 0  9997',
      line2: '2 43628  67.0000 300.0000 0010000  10.0000 350.0000 13.80000000456789',
    },
  },
  {
    noradId: 44832,
    name: 'COSMOS 2537',
    country: 'Russia',
    operator: 'Russian Defense Ministry',
    orbitType: 'GEO',
    purpose: 'communications',
    altitudeKm: 35786,
    periodMin: 1436.0,
    tle: {
      line1: '1 44832U 19090A   24085.50000000  .00000000  00000-0  00000-0 0  9991',
      line2: '2 44832   0.0500 140.0000 0002000   0.0000 220.0000  1.00270000987654',
    },
  },
  {
    noradId: 41105,
    name: 'KANNIMOTO-2',
    country: 'Japan',
    operator: 'JAXA',
    orbitType: 'LEO',
    purpose: 'earth-observation',
    altitudeKm: 500,
    periodMin: 94.5,
    tle: {
      line1: '1 41105U 15067D   24085.50000000  .00001000  00000-0  80000-4 0  9993',
      line2: '2 41105  97.4000  60.0000 0015000 100.0000 260.0000 15.20000000345678',
    },
  },
  {
    noradId: 43014,
    name: 'GALAXY 30',
    country: 'US',
    operator: 'Intelsat',
    orbitType: 'GEO',
    purpose: 'communications',
    altitudeKm: 35786,
    periodMin: 1436.0,
    tle: {
      line1: '1 43014U 17068A   24085.50000000  .00000000  00000-0  00000-0 0  9999',
      line2: '2 43014   0.0500 280.0000 0002000   0.0000  80.0000  1.00270000123456',
    },
  },
  {
    noradId: 41866,
    name: 'SENTINEL-1B',
    country: 'EU',
    operator: 'ESA',
    orbitType: 'LEO',
    purpose: 'earth-observation',
    altitudeKm: 693,
    periodMin: 98.6,
    tle: {
      line1: '1 41866U 16043A   24085.50000000  .00001000  00000-0  60000-4 0  9996',
      line2: '2 41866  98.1800 200.0000 0001000   0.0000 160.0000 14.50000000234567',
    },
  },
  {
    noradId: 27424,
    name: 'AQUA',
    country: 'US',
    operator: 'NASA',
    orbitType: 'LEO',
    purpose: 'earth-observation',
    altitudeKm: 705,
    periodMin: 98.8,
    tle: {
      line1: '1 27424U 02022A   24085.50000000  .00000000  00000-0  50000-4 0  9994',
      line2: '2 27424  98.2000 180.0000 0001000   0.0000 180.0000 14.30000000123456',
    },
  },
  // GLONASS satellites (Russian navigation system)
  {
    noradId: 36111,
    name: 'GLONASS-M (COSMOS 2424)',
    country: 'Russia',
    operator: 'Roscosmos',
    orbitType: 'MEO',
    purpose: 'navigation',
    altitudeKm: 19100,
    periodMin: 675.0,
    tle: {
      line1: '1 36111U 09070A   24085.50000000  .00000000  00000-0  00000-0 0  9998',
      line2: '2 36111  64.8000 120.0000 0001000   0.0000  45.0000  2.13100000123456',
    },
  },
  {
    noradId: 36112,
    name: 'GLONASS-M (COSMOS 2425)',
    country: 'Russia',
    operator: 'Roscosmos',
    orbitType: 'MEO',
    purpose: 'navigation',
    altitudeKm: 19100,
    periodMin: 675.0,
    tle: {
      line1: '1 36112U 09070B   24085.50000000  .00000000  00000-0  00000-0 0  9997',
      line2: '2 36112  64.8000 180.0000 0001000   0.0000 105.0000  2.13100000123457',
    },
  },
  {
    noradId: 36113,
    name: 'GLONASS-M (COSMOS 2426)',
    country: 'Russia',
    operator: 'Roscosmos',
    orbitType: 'MEO',
    purpose: 'navigation',
    altitudeKm: 19100,
    periodMin: 675.0,
    tle: {
      line1: '1 36113U 09070C   24085.50000000  .00000000  00000-0  00000-0 0  9996',
      line2: '2 36113  64.8000 240.0000 0001000   0.0000 165.0000  2.13100000123458',
    },
  },
  // Galileo satellites (European navigation system)
  {
    noradId: 37846,
    name: 'GALILEO-FOC FM1',
    country: 'EU',
    operator: 'ESA',
    orbitType: 'MEO',
    purpose: 'navigation',
    altitudeKm: 23222,
    periodMin: 845.0,
    tle: {
      line1: '1 37846U 11060A   24085.50000000  .00000000  00000-0  00000-0 0  9995',
      line2: '2 37846  56.0000  90.0000 0001000   0.0000  30.0000  1.70400000123456',
    },
  },
  {
    noradId: 37847,
    name: 'GALILEO-FOC FM2',
    country: 'EU',
    operator: 'ESA',
    orbitType: 'MEO',
    purpose: 'navigation',
    altitudeKm: 23222,
    periodMin: 845.0,
    tle: {
      line1: '1 37847U 11060B   24085.50000000  .00000000  00000-0  00000-0 0  9994',
      line2: '2 37847  56.0000 150.0000 0001000   0.0000  90.0000  1.70400000123457',
    },
  },
  {
    noradId: 37848,
    name: 'GALILEO-FOC FM3',
    country: 'EU',
    operator: 'ESA',
    orbitType: 'MEO',
    purpose: 'navigation',
    altitudeKm: 23222,
    periodMin: 845.0,
    tle: {
      line1: '1 37848U 11060C   24085.50000000  .00000000  00000-0  00000-0 0  9993',
      line2: '2 37848  56.0000 210.0000 0001000   0.0000 150.0000  1.70400000123458',
    },
  },
  // BeiDou satellites (Chinese navigation system)
  {
    noradId: 38091,
    name: 'BEIDOU-3 M1',
    country: 'China',
    operator: 'CNSA',
    orbitType: 'MEO',
    purpose: 'navigation',
    altitudeKm: 21500,
    periodMin: 770.0,
    tle: {
      line1: '1 38091U 12018A   24085.50000000  .00000000  00000-0  00000-0 0  9992',
      line2: '2 38091  55.0000  60.0000 0001000   0.0000  45.0000  1.87000000123456',
    },
  },
  {
    noradId: 38092,
    name: 'BEIDOU-3 M2',
    country: 'China',
    operator: 'CNSA',
    orbitType: 'MEO',
    purpose: 'navigation',
    altitudeKm: 21500,
    periodMin: 770.0,
    tle: {
      line1: '1 38092U 12018B   24085.50000000  .00000000  00000-0  00000-0 0  9991',
      line2: '2 38092  55.0000 120.0000 0001000   0.0000 105.0000  1.87000000123457',
    },
  },
  {
    noradId: 40938,
    name: 'BEIDOU-3 G1 (GEO)',
    country: 'China',
    operator: 'CNSA',
    orbitType: 'GEO',
    purpose: 'navigation',
    altitudeKm: 35786,
    periodMin: 1436.0,
    tle: {
      line1: '1 40938U 15045A   24085.50000000  .00000000  00000-0  00000-0 0  9990',
      line2: '2 40938   0.1000  80.0000 0001000   0.0000 180.0000  1.00270000123456',
    },
  },
  // Additional Starlink satellites for heatmap demo
  {
    noradId: 44714,
    name: 'STARLINK-1008',
    country: 'US',
    operator: 'SpaceX',
    orbitType: 'LEO',
    purpose: 'communications',
    altitudeKm: 550,
    periodMin: 95.5,
    tle: {
      line1: '1 44714U 19074AI  24085.50000000  .00000900  00000-0  75000-4 0  9990',
      line2: '2 44714  53.0000 110.0000 0001000   0.0000 270.0000 15.06400000234568',
    },
  },
  {
    noradId: 44715,
    name: 'STARLINK-1009',
    country: 'US',
    operator: 'SpaceX',
    orbitType: 'LEO',
    purpose: 'communications',
    altitudeKm: 550,
    periodMin: 95.5,
    tle: {
      line1: '1 44715U 19074AJ  24085.50000000  .00000900  00000-0  75000-4 0  9999',
      line2: '2 44715  53.0000 120.0000 0001000   0.0000 280.0000 15.06400000234569',
    },
  },
  {
    noradId: 44716,
    name: 'STARLINK-1010',
    country: 'US',
    operator: 'SpaceX',
    orbitType: 'LEO',
    purpose: 'communications',
    altitudeKm: 550,
    periodMin: 95.5,
    tle: {
      line1: '1 44716U 19074AK  24085.50000000  .00000900  00000-0  75000-4 0  9998',
      line2: '2 44716  53.0000 130.0000 0001000   0.0000 290.0000 15.06400000234570',
    },
  },
]

export function computeMockPositions(): SatellitePosition[] {
  const now = Date.now()
  const positions: SatellitePosition[] = []

  for (const sat of MOCK_SATELLITES) {
    try {
      const satrec = satellite.twoline2satrec(sat.tle.line1, sat.tle.line2)
      const date = new Date(now)
      const result = satellite.propagate(satrec, date)

      if (!result) continue

      if (
        typeof result.position === 'boolean' ||
        !result.position ||
        typeof result.velocity === 'boolean' ||
        !result.velocity
      ) {
        continue
      }

      const gmst = satellite.gstime(date)
      const geodetic = satellite.eciToGeodetic(result.position, gmst)
      const velocity = result.velocity

      positions.push({
        noradId: sat.noradId,
        lat: satellite.degreesLat(geodetic.latitude),
        lon: satellite.degreesLong(geodetic.longitude),
        alt: geodetic.height,
        velocityKmS: Math.sqrt(
          velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
        ),
        ts: now,
      })
    } catch {
      // Skip on error
    }
  }

  return positions
}

export function getMockSatellites(): Satellite[] {
  return MOCK_SATELLITES
}

export function getMockStats(): StatsResponse {
  const byOrbitType = { LEO: 0, MEO: 0, GEO: 0, HEO: 0 }
  const byCountry: { country: string; count: number }[] = []

  for (const sat of MOCK_SATELLITES) {
    byOrbitType[sat.orbitType]++
  }

  return {
    totalSatellites: MOCK_SATELLITES.length,
    byOrbitType,
    byCountry,
    lastTleSync: new Date().toISOString(),
  }
}

export function getMockPassesForPoint(lat?: number, lon?: number): SatellitePass[] {
  // Use coordinates as seed for pseudo-random variation
  const seed = Math.abs((lat ?? 0) * 100 + (lon ?? 0) * 10) % 100
  const now = Date.now()

  // Generate passes based on location — different coordinates give different results
  const passes: SatellitePass[] = []
  const candidates = MOCK_SATELLITES.filter(s => s.orbitType === 'LEO')

  for (let i = 0; i < Math.min(candidates.length, 4); i++) {
    const sat = candidates[(i + Math.floor(seed)) % candidates.length]
    const offsetMin = 10 + (seed + i * 37) % 120 // 10-130 minutes from now
    const durationMin = 5 + (seed + i * 13) % 20  // 5-25 minutes duration
    const elevation = 15 + (seed + i * 23) % 70    // 15-85 degrees

    passes.push({
      noradId: sat.noradId,
      name: sat.name,
      orbitType: sat.orbitType,
      aos: new Date(now + offsetMin * 60 * 1000).toISOString(),
      los: new Date(now + (offsetMin + durationMin) * 60 * 1000).toISOString(),
      maxElevationDeg: elevation,
    })
  }

  // Sort by AOS time
  passes.sort((a, b) => new Date(a.aos).getTime() - new Date(b.aos).getTime())
  return passes
}

export function getMockGroundTrack(noradId: number): FeatureCollection {
  // Generate a mock ground track based on noradId for variety
  const baseLng = (noradId % 360) - 180
  const baseLat = (noradId % 80) - 40
  
  // Generate orbit path points (simulating ~90 minute orbit)
  const coordinates: [number, number][] = []
  const numPoints = 60
  
  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints
    // Simulate orbital path - sinusoidal pattern moving westward
    const lng = baseLng + Math.sin(t * Math.PI * 4) * 30 - t * 180
    const lat = baseLat + Math.cos(t * Math.PI * 2) * 40
    coordinates.push([lng, lat])
  }
  
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {},
      },
    ],
  }
}

export async function mockSubscribe(
  payload: Omit<Subscription, 'id'>
): Promise<Subscription> {
  return {
    id: Math.random().toString(36).slice(2),
    ...payload,
  }
}

export async function mockUnsubscribe(): Promise<void> {}
