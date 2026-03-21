'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { Source, Layer, MapMouseEvent, NavigationControl, ViewStateChangeEvent } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Point } from 'geojson'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore, MAP_THEMES, type MapBounds } from '@/store/useMapStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import { getSatellites } from '@/lib/api'
import wsClient from '@/lib/ws-client'
import { filterByViewport } from '@/lib/viewport-filter'
import { useSupercluster, useZoomFilteredSatellites, type SatelliteFeature } from '@/hooks/useSupercluster'
import type { OrbitType, WorkerMessageIn, WorkerMessageOut } from '@/types/satellite'
import GroundTrack from './GroundTrack'
import CoverageCone from './CoverageCone'
import ClusterMarker from './ClusterMarker'
import SatelliteLinks from './SatelliteLinks'
import CoordinateGrid from './CoordinateGrid'
import Terminator from './Terminator'
import ObservationPins from './ObservationPins'

const ORBIT_COLORS: Record<OrbitType, string> = {
  LEO: '#00ff88',
  MEO: '#ffaa00',
  GEO: '#ff4466',
  HEO: '#aa88ff',
}

interface ViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

export default function SatelliteMap() {
  const satellites = useSatelliteStore((s) => s.satellites)
  const positions = useSatelliteStore((s) => s.positions)
  const filteredByGroups = useSatelliteStore((s) => s.filteredByGroups)
  const activeGroups = useSatelliteStore((s) => s.activeGroups)
  const filters = useSatelliteStore((s) => s.filters)
  const setSatellites = useSatelliteStore((s) => s.setSatellites)
  const updatePositions = useSatelliteStore((s) => s.updatePositions)
  const selectSatellite = useSatelliteStore((s) => s.selectSatellite)
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite)
  const performanceMode = useSatelliteStore((s) => s.performanceMode)
  const performanceLimit = useSatelliteStore((s) => s.performanceLimit)

  const showGroundTrack = useMapStore((s) => s.showGroundTrack)
  const showCoverage = useMapStore((s) => s.showCoverage)
  const setSelectedPoint = useMapStore((s) => s.setSelectedPoint)
  const addObservationPoint = useMapStore((s) => s.addObservationPoint)
  const isAddingPoint = useMapStore((s) => s.isAddingPoint)
  const toggleAddingPoint = useMapStore((s) => s.toggleAddingPoint)
  const mapTheme = useMapStore((s) => s.mapTheme)
  const selectedSatelliteColor = useMapStore((s) => s.selectedSatelliteColor)
  const is3DMode = useMapStore((s) => s.is3DMode)
  const viewportOnly = useMapStore((s) => s.viewportOnly)
  const mapBounds = useMapStore((s) => s.mapBounds)
  const setMapBounds = useMapStore((s) => s.setMapBounds)
  const showHeatmap = useMapStore((s) => s.showHeatmap)
  const showClusters = useMapStore((s) => s.showClusters)

  const simulationTime = useSimulationStore((s) => s.simulationTime)

  const workerRef = useRef<Worker | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  const [viewState, setViewState] = useState<ViewState>({
    longitude: 0,
    latitude: 20,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  })

  // Switch to 3D mode: tilt the map
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.easeTo({
      pitch: is3DMode ? 45 : 0,
      bearing: is3DMode ? -20 : 0,
      duration: 800,
    })
  }, [is3DMode])

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('@/lib/satellite-worker.ts', import.meta.url)
    )
    workerRef.current.onmessage = (e: MessageEvent<WorkerMessageOut>) => {
      if (e.data.type === 'POSITIONS') {
        updatePositions(e.data.payload)
      }
    }

    getSatellites().then(setSatellites).catch(console.error)
    wsClient.connect()

    return () => {
      wsClient.disconnect()
      workerRef.current?.terminate()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [setSatellites, updatePositions])

  // ===== STEP 1: Filter satellites by groups + search + orbit + purpose =====
  // Does NOT depend on positions — only recalculates when data/filters change
  const groupFiltered = useMemo(
    () => filteredByGroups(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [satellites, activeGroups, filters.q, filters.orbit, filters.purpose]
  )

  // ===== STEP 2: Apply performance mode limit EARLY (before worker) =====
  // This determines which satellites we even bother calculating positions for
  const displaySatelliteIds = useMemo(() => {
    if (!performanceMode) {
      return new Set(groupFiltered.map(s => s.noradId))
    }
    const limit = performanceLimit
    const ids = new Set<number>()
    // Always include selected satellite
    if (selectedSatellite) ids.add(selectedSatellite.noradId)
    // Fill up to limit
    for (const sat of groupFiltered) {
      if (ids.size >= limit) break
      ids.add(sat.noradId)
    }
    return ids
  }, [groupFiltered, performanceMode, performanceLimit, selectedSatellite])

  // Satellites to send to worker — only the ones we'll display
  const satellitesForWorker = useMemo(() => {
    return groupFiltered.filter(s => displaySatelliteIds.has(s.noradId))
  }, [groupFiltered, displaySatelliteIds])

  // Recalculate positions when simulationTime or satellites change
  // Timeline.tsx already runs tick() via interval when playing
  useEffect(() => {
    if (!workerRef.current || satellitesForWorker.length === 0) return
    if (!simulationTime) return

    const msg: WorkerMessageIn = {
      type: 'CALCULATE',
      payload: { satellites: satellitesForWorker, timestamp: simulationTime.getTime() },
    }
    workerRef.current.postMessage(msg)
  }, [simulationTime, satellitesForWorker])

  // Function to fly to selected satellite
  const flyToSelectedSatellite = useCallback(() => {
    if (!selectedSatellite || !mapRef.current) return
    const pos = positions.get(selectedSatellite.noradId)
    if (!pos) return

    mapRef.current.flyTo({
      center: [pos.lon, pos.lat],
      zoom: Math.max(viewState.zoom, 4),
      duration: 1500,
    })
  }, [selectedSatellite, positions, viewState.zoom])

  // Listen for center-on-map event from SatelliteCard
  useEffect(() => {
    const handleCenterEvent = () => {
      flyToSelectedSatellite()
    }
    window.addEventListener('satellite-tracker:center-on-map', handleCenterEvent)
    return () => {
      window.removeEventListener('satellite-tracker:center-on-map', handleCenterEvent)
    }
  }, [flyToSelectedSatellite])

  // Listen for fly-to event from LocationPresets
  useEffect(() => {
    const handleFlyTo = (e: Event) => {
      const customEvent = e as CustomEvent<{ lat: number; lon: number; zoom: number; duration: number }>
      if (!mapRef.current || !customEvent.detail) return
      const { lat, lon, zoom, duration } = customEvent.detail
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: zoom ?? 10,
        duration: duration ?? 1200,
      })
    }
    window.addEventListener('satellite-tracker:fly-to', handleFlyTo)
    return () => {
      window.removeEventListener('satellite-tracker:fly-to', handleFlyTo)
    }
  }, [])

  // ===== STEP 3: Convert to GeoJSON features (depends on positions) =====
  // This is the ONLY place where positions dependency triggers re-render
  const satelliteFeatures: SatelliteFeature[] = useMemo(() => {
    return satellitesForWorker
      .filter((sat) => positions.has(sat.noradId) && displaySatelliteIds.has(sat.noradId))
      .map((sat) => {
        const pos = positions.get(sat.noradId)!
        const isSelected = selectedSatellite?.noradId === sat.noradId
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [pos.lon, pos.lat] as [number, number],
          },
          properties: {
            noradId: sat.noradId,
            name: sat.name,
            orbitType: sat.orbitType,
            color: ORBIT_COLORS[sat.orbitType],
            selected: isSelected,
          },
        }
      })
  }, [satellitesForWorker, displaySatelliteIds, positions, selectedSatellite])

  // Get clusters using supercluster
  const clusters = useSupercluster(
    satelliteFeatures,
    mapBounds,
    viewState.zoom,
    { radius: 50, maxZoom: 16 }
  )

  // GeoJSON data for non-clustered markers
  const geojsonData = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: showClusters ? clusters.filter(f => !f.properties.cluster) : satelliteFeatures,
  }), [clusters, satelliteFeatures, showClusters])

  // Heatmap data
  const heatmapData = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: satelliteFeatures,
  }), [satelliteFeatures])

  // Handle cluster click - zoom in
  const handleClusterClick = useCallback((cluster: SatelliteFeature) => {
    if (!mapRef.current) return

    const geometry = cluster.geometry as Point
    const [longitude, latitude] = geometry.coordinates as [number, number]
    const expansionZoom = Math.floor(viewState.zoom) + 2

    mapRef.current.flyTo({
      center: [longitude, latitude],
      zoom: Math.min(expansionZoom, 16),
      duration: 500,
    })
  }, [viewState.zoom])

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      // Check if we clicked on a satellite marker
      const features = e.target.queryRenderedFeatures(e.point, {
        layers: ['satellites-layer', 'selected-satellite-layer'],
      })

      if (features.length > 0) {
        const noradId = features[0].properties?.noradId
        if (noradId) {
          const sat = satellites.find((s) => s.noradId === Number(noradId))
          if (sat) {
            selectSatellite(sat)
            return
          }
        }
      }

      // If in adding mode - add observation point and exit mode
      if (isAddingPoint) {
        addObservationPoint(e.lngLat.lat, e.lngLat.lng)
        toggleAddingPoint()
        return
      }
      // Otherwise do nothing (only explicit button adds points now)
    },
    [satellites, selectSatellite, isAddingPoint, addObservationPoint, toggleAddingPoint]
  )

  // Update bounds on map move
  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState)

    if (mapRef.current) {
      const bounds = mapRef.current.getBounds()
      if (bounds) {
        setMapBounds([
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ])
      }
    }
  }, [setMapBounds])

  // Build map style from current theme
  const mapStyle = useMemo(() => {
    const theme = MAP_THEMES[mapTheme]
    return {
      version: 8 as const,
      sources: {
        'map-tiles': {
          type: 'raster' as const,
          tiles: theme.tiles,
          tileSize: 256,
          attribution: '© CartoDB / OpenStreetMap',
        },
      },
      layers: [
        {
          id: 'map-tiles-layer',
          type: 'raster' as const,
          source: 'map-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    }
  }, [mapTheme])

  return (
    <Map
      {...viewState}
      onMove={handleMove}
      onClick={handleMapClick}
      onLoad={(evt) => {
        mapRef.current = evt.target
        // Set initial bounds
        const bounds = evt.target.getBounds()
        if (bounds) {
          setMapBounds([
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth(),
          ])
        }
      }}
      style={{ width: '100%', height: '100%', cursor: isAddingPoint ? 'crosshair' : undefined }}
      mapStyle={mapStyle}
      mapLib={maplibregl}
    >
      <NavigationControl position="top-right" style={{ marginTop: '52px' }} />

      {/* Draggable observation point pins */}
      <ObservationPins />

      {/* Terminator (day/night) - rendered first so satellites appear on top */}
      <Terminator />

      {/* Coordinate grid overlay */}
      <CoordinateGrid />

      {/* Heatmap layer */}
      {showHeatmap && (
        <Source id="heatmap-source" type="geojson" data={heatmapData}>
          <Layer
            id="heatmap-layer"
            type="heatmap"
            paint={{
              'heatmap-radius': 30,
              'heatmap-intensity': 0.8,
              'heatmap-weight': ['interpolate', ['linear'], ['zoom'], 0, 0.5, 9, 2],
              'heatmap-color': [
                'interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0, 0, 0, 0)',
                0.1, '#00ff88',
                0.3, '#ffaa00',
                0.5, '#ff4466',
                0.7, '#ff00ff',
                1, '#ffffff'
              ],
              'heatmap-opacity': 0.7
            }}
          />
        </Source>
      )}

      {/* Cluster markers */}
      {showClusters && clusters
        .filter(cluster => cluster.properties.cluster)
        .map(cluster => (
          <ClusterMarker
            key={`cluster-${cluster.properties.cluster_id}`}
            cluster={cluster}
            onClick={handleClusterClick}
          />
        ))
      }

      {/* Satellite markers */}
      <Source
        id="satellites-source"
        type="geojson"
        data={geojsonData}
      >
        {/* Ring around selected satellite */}
        <Layer
          id="selected-ring-layer"
          type="circle"
          source="satellites-source"
          filter={['==', ['get', 'selected'], true]}
          paint={{
            'circle-radius': 14,
            'circle-color': selectedSatelliteColor,
            'circle-opacity': 0.25,
            'circle-stroke-width': 2,
            'circle-stroke-color': selectedSatelliteColor,
            'circle-stroke-opacity': 0.9,
          }}
        />
        {/* Non-selected satellites */}
        <Layer
          id="satellites-layer"
          type="circle"
          source="satellites-source"
          filter={['!=', ['get', 'selected'], true]}
          paint={{
            'circle-radius': 5,
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.9,
            'circle-stroke-width': 1,
            'circle-stroke-color': ['get', 'color'],
            'circle-stroke-opacity': 1,
          }}
        />
        {/* Selected satellite — larger, custom stroke color */}
        <Layer
          id="selected-satellite-layer"
          type="circle"
          source="satellites-source"
          filter={['==', ['get', 'selected'], true]}
          paint={{
            'circle-radius': 8,
            'circle-color': ['get', 'color'],
            'circle-opacity': 1,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': selectedSatelliteColor,
            'circle-stroke-opacity': 1,
          }}
        />
      </Source>

      {/* Satellite links (KSP-style) */}
      <SatelliteLinks />

      {showGroundTrack && (
        <GroundTrack />
      )}

      {showCoverage && selectedSatellite && (
        <CoverageCone
          satelliteId={selectedSatellite.noradId}
          satellites={satellites}
          positions={positions}
        />
      )}
    </Map>
  )
}
