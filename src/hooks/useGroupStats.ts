'use client'

import { useMemo } from 'react'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { GROUP_CONFIG, type SatelliteGroup, type OrbitType, type GroupStats } from '@/types/satellite'

// Count satellites in a group
function countByGroup(satellites: ReturnType<typeof useSatelliteStore.getState>['satellites'], group: SatelliteGroup): number {
  const config = GROUP_CONFIG[group]
  return satellites.filter((sat) => {
    if (config.filter.orbit && sat.orbitType !== config.filter.orbit) return false
    if (config.filter.q && !sat.name.toUpperCase().includes(config.filter.q)) return false
    return true
  }).length
}

// Calculate group statistics
function calculateGroupStats(
  groupId: SatelliteGroup,
  satellites: ReturnType<typeof useSatelliteStore.getState>['satellites'],
  positions: ReturnType<typeof useSatelliteStore.getState>['positions']
): GroupStats {
  const config = GROUP_CONFIG[groupId]
  
  const groupSatellites = satellites.filter((sat) => {
    if (config.filter.orbit && sat.orbitType !== config.filter.orbit) return false
    if (config.filter.q && !sat.name.toUpperCase().includes(config.filter.q)) return false
    return true
  })

  // Get satellites with positions (active)
  const withPositions = groupSatellites.filter((sat) => positions.has(sat.noradId))

  const alts = withPositions
    .map((sat) => positions.get(sat.noradId))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .map((p) => p.alt)

  const vels = withPositions
    .map((sat) => positions.get(sat.noradId))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
    .map((p) => p.velocityKmS)

  // Orbit distribution
  const orbitDistribution: Record<OrbitType, number> = {
    LEO: 0,
    MEO: 0,
    GEO: 0,
    HEO: 0,
  }
  for (const sat of groupSatellites) {
    orbitDistribution[sat.orbitType]++
  }

  const avg = (arr: number[]): number => 
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  return {
    groupId,
    totalCount: groupSatellites.length,
    activeCount: withPositions.length,
    avgAltitudeKm: avg(alts),
    avgVelocityKmS: avg(vels),
    minAltitudeKm: alts.length > 0 ? Math.min(...alts) : 0,
    maxAltitudeKm: alts.length > 0 ? Math.max(...alts) : 0,
    orbitDistribution,
  }
}

// Hook to get stats for a single group
export function useGroupStats(groupId: SatelliteGroup): GroupStats {
  const satellites = useSatelliteStore((s) => s.satellites)
  const positions = useSatelliteStore((s) => s.positions)

  return useMemo(() => {
    return calculateGroupStats(groupId, satellites, positions)
  }, [groupId, satellites, positions])
}

// Hook to get stats for all groups
export function useAllGroupStats(): GroupStats[] {
  const satellites = useSatelliteStore((s) => s.satellites)
  const positions = useSatelliteStore((s) => s.positions)

  return useMemo(() => {
    const groups: SatelliteGroup[] = ['geo', 'gps', 'glonass', 'galileo', 'beidou', 'starlink', 'oneweb', 'iridium']
    return groups.map((group) => calculateGroupStats(group, satellites, positions))
  }, [satellites, positions])
}

// Hook to get stats for specific groups (for comparison table)
export function useComparisonGroupStats(groupIds: SatelliteGroup[]): GroupStats[] {
  const satellites = useSatelliteStore((s) => s.satellites)
  const positions = useSatelliteStore((s) => s.positions)

  return useMemo(() => {
    return groupIds.map((groupId) => calculateGroupStats(groupId, satellites, positions))
  }, [groupIds, satellites, positions])
}

// Hook to get satellite count for a group (simple, for badges)
export function useGroupCount(groupId: SatelliteGroup): number {
  const satellites = useSatelliteStore((s) => s.satellites)
  
  return useMemo(() => {
    return countByGroup(satellites, groupId)
  }, [groupId, satellites])
}
