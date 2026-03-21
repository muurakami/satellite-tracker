'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import { useMapStore } from '@/store/useMapStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import { getNightPolygon } from '@/lib/terminator'
import type { Feature, Polygon } from 'geojson'

export default function Terminator() {
  const showTerminator = useMapStore((s) => s.showTerminator)
  const simulationTime = useSimulationStore((s) => s.simulationTime)

  const nightPolygon = useMemo(() => {
    const date = simulationTime ?? new Date()
    return getNightPolygon(date)
  }, [simulationTime])

  if (!showTerminator) return null

  return (
    <Source id="terminator-source" type="geojson" data={nightPolygon as Feature<Polygon>}>
      {/* Night side fill */}
      <Layer
        id="terminator-layer"
        type="fill"
        source="terminator-source"
        paint={{
          'fill-color': '#000033',
          'fill-opacity': 0.45,
        }}
      />
      {/* Terminator border line */}
      <Layer
        id="terminator-border-layer"
        type="line"
        source="terminator-source"
        paint={{
          'line-color': '#4488ff',
          'line-width': 1.5,
          'line-opacity': 0.7,
        }}
      />
    </Source>
  )
}
