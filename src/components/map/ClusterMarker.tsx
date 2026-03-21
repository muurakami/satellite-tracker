'use client'

import { useMemo } from 'react'
import { Marker } from 'react-map-gl/maplibre'
import type { SatelliteFeature } from '@/hooks/useSupercluster'
import type { Point } from 'geojson'

interface ClusterMarkerProps {
  cluster: SatelliteFeature
  onClick: (cluster: SatelliteFeature) => void
}

export default function ClusterMarker({ cluster, onClick }: ClusterMarkerProps) {
  const geometry = cluster.geometry as Point
  const [longitude, latitude] = geometry.coordinates as [number, number]
  const count = cluster.properties.point_count ?? 0

  // Calculate marker size based on cluster size
  const size = useMemo(() => {
    if (count < 10) return 30
    if (count < 50) return 40
    if (count < 100) return 50
    if (count < 500) return 60
    return 70
  }, [count])

  // Calculate color based on cluster size
  const color = useMemo(() => {
    if (count < 10) return '#00ff88'
    if (count < 50) return '#ffaa00'
    if (count < 100) return '#ff8844'
    if (count < 500) return '#ff4466'
    return '#ff00ff'
  }, [count])

  return (
    <Marker longitude={longitude} latitude={latitude}>
      <button
        onClick={() => onClick(cluster)}
        className="relative flex items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-110"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          opacity: 0.85,
          boxShadow: `0 0 20px ${color}40`,
        }}
      >
        {/* Inner circle */}
        <div
          className="absolute rounded-full"
          style={{
            width: size - 8,
            height: size - 8,
            border: `2px solid rgba(255,255,255,0.8)`,
          }}
        />
        
        {/* Count text */}
        <span
          className="font-bold text-white text-shadow"
          style={{
            fontSize: count < 100 ? 12 : 14,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {count < 1000 ? count : `${Math.floor(count / 1000)}k`}
        </span>
      </button>
    </Marker>
  )
}
