import { useMemo } from 'react'
import Supercluster from 'supercluster'
import type { Feature, GeoJsonProperties, Point } from 'geojson'
import type { OrbitType } from '@/types/satellite'

// Zoom levels for progressive display
export const ZOOM_LEVELS = {
  GEO_ONLY: 3,        // < 3: only GEO
  GEO_PLUS_GROUPS: 5, // 3-5: GEO + active groups
  ALL: 5,             // > 5: everything
} as const

export interface SatelliteFeatureProperties {
  noradId: number
  name: string
  orbitType: OrbitType
  color: string
  selected: boolean
  cluster?: boolean
  point_count?: number
  cluster_id?: number
}

export type SatelliteFeature = Feature<Point, SatelliteFeatureProperties>

interface UseSuperclusterOptions {
  radius?: number
  maxZoom?: number
  minZoom?: number
  extent?: number
  nodeSize?: number
}

/**
 * Hook for clustering satellite markers using supercluster
 */
export function useSupercluster(
  features: SatelliteFeature[],
  bounds: [number, number, number, number] | null,
  zoom: number,
  options: UseSuperclusterOptions = {}
): SatelliteFeature[] {
  const { radius = 50, maxZoom = 20, minZoom = 0, extent = 512, nodeSize = 64 } = options

  const clusters = useMemo(() => {
    if (features.length === 0) return []
    if (bounds === null) return features

    const supercluster = new Supercluster<SatelliteFeatureProperties, GeoJsonProperties>({
      radius,
      maxZoom,
      minZoom,
      extent,
      nodeSize,
    })

    supercluster.load(features)

    const [west, south, east, north] = bounds
    // Round zoom to integer to reduce re-clustering on fractional zoom changes
    const clustered = supercluster.getClusters([west, south, east, north], Math.floor(zoom))

    return clustered as SatelliteFeature[]
    // Note: features changes every 2s (worker interval), bounds changes on map move
    // This is acceptable — supercluster.load() is O(n log n) but n is small (≤50 in perf mode)
  }, [features, bounds, zoom, radius, maxZoom, minZoom, extent, nodeSize])

  return clusters
}

/**
 * Hook for progressive display based on zoom level
 */
export function useZoomFilteredSatellites(
  satellites: { noradId: number; orbitType: OrbitType; name: string }[],
  activeGroups: string[],
  zoom: number
): { noradId: number; orbitType: OrbitType; name: string }[] {
  return useMemo(() => {
    // At high zoom, show all
    if (zoom > ZOOM_LEVELS.ALL) {
      return satellites
    }

    // At medium zoom, show GEO + active groups
    if (zoom >= ZOOM_LEVELS.GEO_ONLY && zoom <= ZOOM_LEVELS.GEO_PLUS_GROUPS) {
      return satellites.filter((sat) => {
        if (sat.orbitType === 'GEO') return true
        // Check if satellite belongs to any active group
        const name = sat.name.toUpperCase()
        return activeGroups.some((group) => {
          const groupKeywords: Record<string, string[]> = {
            gps: ['GPS'],
            glonass: ['GLONASS'],
            galileo: ['GALILEO'],
            beidou: ['BEIDOU'],
            starlink: ['STARLINK'],
            oneweb: ['ONEWEB'],
            iridium: ['IRIDIUM'],
          }
          return groupKeywords[group]?.some((kw) => name.includes(kw)) ?? false
        })
      })
    }

    // At low zoom, show only GEO
    return satellites.filter((sat) => sat.orbitType === 'GEO')
  }, [satellites, activeGroups, zoom])
}
