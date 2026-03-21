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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === 'true' ||
  BASE_URL.includes('localhost')

// Use CelesTrak for real TLE data when in mock mode
const USE_CELESTRAK = process.env.NEXT_PUBLIC_USE_CELESTRAK !== 'false'

// Hard limit on satellites loaded from CelesTrak to prevent browser freeze
// CelesTrak returns 10k+ satellites — we cap at 200 for performance
// User can increase this via NEXT_PUBLIC_CELESTRAK_LIMIT env var
const CELESTRAK_LIMIT = parseInt(
  process.env.NEXT_PUBLIC_CELESTRAK_LIMIT ?? '200',
  10
)

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init)
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function getSatellites(filters?: {
  orbit?: OrbitType
  country?: string
  purpose?: SatellitePurpose
  q?: string
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
  const qs = params.toString()
  return request<Satellite[]>(`/api/satellites${qs ? `?${qs}` : ''}`)
}

export async function getSatelliteById(id: number): Promise<Satellite> {
  if (USE_MOCK) {
    const sat = getMockSatellites().find((s) => s.noradId === id)
    if (!sat) throw new Error(`Satellite ${id} not found`)
    return sat
  }
  return request<Satellite>(`/api/satellites/${id}`)
}

export async function getSatellitePosition(
  id: number,
  timestamp: number
): Promise<SatellitePosition> {
  if (USE_MOCK) {
    // Positions are computed on frontend via Web Worker
    throw new Error('Use Web Worker for mock position calculation')
  }
  return request<SatellitePosition>(
    `/api/satellites/${id}/position?t=${timestamp}`
  )
}

export async function getGroundTrack(
  id: number,
  orbits: number
): Promise<FeatureCollection> {
  if (USE_MOCK) {
    return getMockGroundTrack(id)
  }
  return request<FeatureCollection>(
    `/api/satellites/${id}/groundtrack?orbits=${orbits}`
  )
}

export async function getPassesForPoint(
  lat: number,
  lon: number,
  hours: number
): Promise<SatellitePass[]> {
  if (USE_MOCK) {
    return getMockPassesForPoint(lat, lon)
  }
  return request<SatellitePass[]>(
    `/api/passes?lat=${lat}&lon=${lon}&hours=${hours}`
  )
}

export async function getStats(): Promise<StatsResponse> {
  if (USE_MOCK) {
    return getMockStats()
  }
  return request<StatsResponse>('/api/stats')
}

export async function subscribe(
  payload: Omit<Subscription, 'id'>
): Promise<Subscription> {
  if (USE_MOCK) {
    return mockSubscribe(payload)
  }
  return request<Subscription>('/api/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function unsubscribe(id: string): Promise<void> {
  if (USE_MOCK) {
    return mockUnsubscribe()
  }
  await request<void>(`/api/subscriptions/${id}`, { method: 'DELETE' })
}
