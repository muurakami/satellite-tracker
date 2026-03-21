'use client'

import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { useSatelliteStore } from '@/store/useSatelliteStore'

const EARTH_RADIUS = 1.0

function latLonAltToXYZ(
  lat: number,
  lon: number,
  altKm: number,
  orbitScale: number
): [number, number, number] {
  const scaledAlt = (altKm / 6371) * orbitScale
  const r = EARTH_RADIUS + scaledAlt

  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -r * Math.sin(phi) * Math.cos(theta)
  const y = r * Math.cos(phi)
  const z = r * Math.sin(phi) * Math.sin(theta)

  return [x, y, z]
}

interface SatelliteLinks3DProps {
  orbitScale: number
}

export default function SatelliteLinks3D({ orbitScale }: SatelliteLinks3DProps) {
  const positions = useSatelliteStore((s) => s.positions)
  const getSatelliteLinks = useSatelliteStore((s) => s.getSatelliteLinks)

  const links = useMemo(() => {
    return getSatelliteLinks()
      .map((link) => {
        const from = positions.get(link.fromNoradId)
        const to = positions.get(link.toNoradId)
        if (!from || !to) return null

        const fromXYZ = latLonAltToXYZ(from.lat, from.lon, from.alt, orbitScale)
        const toXYZ = latLonAltToXYZ(to.lat, to.lon, to.alt, orbitScale)

        // Validate all coordinates are finite
        if (
          !fromXYZ.every(isFinite) ||
          !toXYZ.every(isFinite)
        ) return null

        return {
          key: `${link.fromNoradId}-${link.toNoradId}`,
          points: [fromXYZ, toXYZ] as [number, number, number][],
        }
      })
      .filter(Boolean) as { key: string; points: [number, number, number][] }[]
  }, [positions, getSatelliteLinks, orbitScale])

  if (links.length === 0) return null

  return (
    <>
      {links.map((link) => (
        <Line
          key={link.key}
          points={link.points}
          color="#00ffff"
          lineWidth={2}
          transparent
          opacity={0.8}
          dashed
          dashSize={0.05}
          gapSize={0.03}
        />
      ))}
    </>
  )
}
