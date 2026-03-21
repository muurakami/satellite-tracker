'use client'

import { useEffect, useState, useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import type { FeatureCollection, LineString } from 'geojson'
import { getGroundTrack } from '@/lib/api'

interface GroundTrackProps {
  satelliteId: number
}

export default function GroundTrack({ satelliteId }: GroundTrackProps) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    let cancelled = false

    getGroundTrack(satelliteId, 1)
      .then((fc: FeatureCollection) => {
        if (cancelled) return
        // Convert coordinates from [lon, lat] to [lat, lon] was wrong
        // MapLibre uses [lon, lat] format, so we keep original
        setGeojson(fc)
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
  }, [satelliteId])

  const lineData = useMemo(() => {
    if (!geojson) return null
    
    // Create a single FeatureCollection with all LineString features
    const lineFeatures = geojson.features.filter(
      (f) => f.geometry.type === 'LineString'
    )
    
    if (lineFeatures.length === 0) return null
    
    return {
      type: 'FeatureCollection' as const,
      features: lineFeatures,
    }
  }, [geojson])

  if (!lineData) return null

  // Use static source/layer IDs since only one ground track is visible at a time
  // This prevents MapLibre "source id changed" error when switching satellites
  return (
    <Source
      id="groundtrack-source"
      type="geojson"
      data={lineData}
    >
      <Layer
        id="groundtrack-layer"
        type="line"
        source="groundtrack-source"
        paint={{
          'line-color': '#00ff88',
          'line-width': 1.5,
          'line-opacity': 0.7,
        }}
      />
    </Source>
  )
}
