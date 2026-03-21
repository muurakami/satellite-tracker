import { create } from 'zustand'
import type { Locale } from '@/lib/i18n'

export type MapTheme = 'dark' | 'light' | 'satellite' | 'terrain'

export interface ObservationPoint {
  id: string // crypto.randomUUID()
  lat: number
  lon: number
  label: string // "Point 1", "Point 2", etc.
  color: string // "#ff4466", "#ffaa00", "#00ff88", "#aa88ff", "#4488ff"
  active: boolean // which point PassList is tracking
}

const POINT_COLORS = ['#ff4466', '#ffaa00', '#00ff88', '#aa88ff', '#4488ff']

export const MAP_THEMES: Record<MapTheme, { label: string; tiles: string[] }> = {
  dark: {
    label: 'Dark',
    tiles: [
      'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    ],
  },
  light: {
    label: 'Light',
    tiles: [
      'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    ],
  },
  satellite: {
    label: 'Satellite',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
  },
  terrain: {
    label: 'Terrain',
    tiles: [
      'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
      'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
      'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
    ],
  },
}

export type ViewMode = '2d' | '3d-tilt' | '3d-globe'

// Map bounds type: [west, south, east, north]
export type MapBounds = [number, number, number, number]

interface MapStore {
  selectedPoint: { lat: number; lon: number } | null
  showGroundTrack: boolean
  showCoverage: boolean
  mapTheme: MapTheme
  selectedSatelliteColor: string
  is3DMode: boolean
  viewMode: ViewMode
  orbitScale: number
  // New features
  viewportOnly: boolean
  mapBounds: MapBounds | null
  showHeatmap: boolean
  showClusters: boolean
  showGrid: boolean
  showTerminator: boolean
  isFilterPanelCollapsed: boolean
  showFullTrack: boolean
  // Observation points
  observationPoints: ObservationPoint[]
  activePointId: string | null
  isAddingPoint: boolean
  // i18n
  locale: Locale
  // Actions
  setSelectedPoint: (p: { lat: number; lon: number } | null) => void
  addObservationPoint: (lat: number, lon: number) => void
  removeObservationPoint: (id: string) => void
  updateObservationPoint: (id: string, lat: number, lon: number) => void
  setActivePoint: (id: string) => void
  toggleAddingPoint: () => void
  toggleGroundTrack: () => void
  toggleCoverage: () => void
  setMapTheme: (theme: MapTheme) => void
  setSelectedSatelliteColor: (color: string) => void
  toggle3DMode: () => void
  setViewMode: (mode: ViewMode) => void
  setOrbitScale: (scale: number) => void
  // New actions
  setViewportOnly: (value: boolean) => void
  toggleViewportOnly: () => void
  setMapBounds: (bounds: MapBounds | null) => void
  setShowHeatmap: (value: boolean) => void
  toggleHeatmap: () => void
  setShowClusters: (value: boolean) => void
  toggleClusters: () => void
  setShowGrid: (value: boolean) => void
  toggleGrid: () => void
  toggleFilterPanel: () => void
  setShowTerminator: (value: boolean) => void
  toggleTerminator: () => void
  setShowFullTrack: (value: boolean) => void
  toggleFullTrack: () => void
  setLocale: (locale: Locale) => void
}

export const useMapStore = create<MapStore>((set, get) => ({
  selectedPoint: null,
  showGroundTrack: false,
  showCoverage: false,
  mapTheme: 'dark',
  selectedSatelliteColor: '#ffffff',
  is3DMode: false,
  viewMode: '2d',
  orbitScale: 3,
  // New features defaults
  viewportOnly: false,
  mapBounds: null,
  showHeatmap: false,
  showClusters: true,
  showGrid: false,
  showTerminator: false,
  isFilterPanelCollapsed: false,
  showFullTrack: false,
  locale: 'ru' as Locale,
  // Observation points
  observationPoints: [],
  activePointId: null,
  isAddingPoint: false,

  addObservationPoint: (lat, lon) => {
    const points = get().observationPoints
    if (points.length >= 5) return // Max 5 points

    // Normalize longitude
    let normalizedLon = lon
    while (normalizedLon > 180) normalizedLon -= 360
    while (normalizedLon < -180) normalizedLon += 360

    const nextNum = points.length + 1
    const color = POINT_COLORS[(nextNum - 1) % POINT_COLORS.length]
    const newPoint: ObservationPoint = {
      id: crypto.randomUUID(),
      lat,
      lon: normalizedLon,
      label: `Point ${nextNum}`,
      color,
      active: true,
    }

    // Deactivate other points
    const updated = points.map(p => ({ ...p, active: false }))
    set({
      observationPoints: [...updated, newPoint],
      activePointId: newPoint.id,
      selectedPoint: { lat, lon: normalizedLon },
      isAddingPoint: false,
    })
  },

  removeObservationPoint: (id) => {
    const { observationPoints, activePointId } = get()
    const filtered = observationPoints.filter(p => p.id !== id)
    
    let newActiveId = activePointId
    let newSelectedPoint: { lat: number; lon: number } | null = null
    
    if (activePointId === id) {
      // If we removed the active point, activate the first remaining
      if (filtered.length > 0) {
        filtered[0].active = true
        newActiveId = filtered[0].id
        newSelectedPoint = { lat: filtered[0].lat, lon: filtered[0].lon }
      } else {
        newActiveId = null
        newSelectedPoint = null
      }
    } else if (filtered.length > 0) {
      const active = filtered.find(p => p.id === activePointId)
      if (active) {
        newSelectedPoint = { lat: active.lat, lon: active.lon }
      }
    }
    
    set({
      observationPoints: filtered,
      activePointId: newActiveId,
      selectedPoint: newSelectedPoint,
    })
  },

  updateObservationPoint: (id, lat, lon) => {
    const { observationPoints, activePointId } = get()
    
    let normalizedLon = lon
    while (normalizedLon > 180) normalizedLon -= 360
    while (normalizedLon < -180) normalizedLon += 360
    
    const updated = observationPoints.map(p =>
      p.id === id ? { ...p, lat, lon: normalizedLon } : p
    )
    
    let newSelectedPoint: { lat: number; lon: number } | null = null
    if (activePointId === id) {
      const active = updated.find(p => p.id === id)
      if (active) {
        newSelectedPoint = { lat: active.lat, lon: active.lon }
      }
    } else {
      const active = updated.find(p => p.id === activePointId)
      if (active) {
        newSelectedPoint = { lat: active.lat, lon: active.lon }
      }
    }
    
    set({
      observationPoints: updated,
      selectedPoint: newSelectedPoint,
    })
  },

  setActivePoint: (id) => {
    const { observationPoints } = get()
    const point = observationPoints.find(p => p.id === id)
    if (!point) return
    
    const updated = observationPoints.map(p => ({
      ...p,
      active: p.id === id,
    }))
    
    set({
      observationPoints: updated,
      activePointId: id,
      selectedPoint: { lat: point.lat, lon: point.lon },
    })
  },

  toggleAddingPoint: () => {
    const { observationPoints, isAddingPoint } = get()
    // Don't enable adding mode if already at max points
    if (!isAddingPoint && observationPoints.length >= 5) {
      return
    }
    set({ isAddingPoint: !isAddingPoint })
  },

  setSelectedPoint: (p) => {
    if (!p) {
      set({ observationPoints: [], activePointId: null, selectedPoint: null })
      return
    }
    // Backward compat: add as new observation point
    get().addObservationPoint(p.lat, p.lon)
  },

  toggleGroundTrack: () =>
    set((state) => ({ showGroundTrack: !state.showGroundTrack })),

  toggleCoverage: () =>
    set((state) => ({ showCoverage: !state.showCoverage })),

  setMapTheme: (theme) => set({ mapTheme: theme }),

  setSelectedSatelliteColor: (color) => set({ selectedSatelliteColor: color }),

  toggle3DMode: () =>
    set((state) => ({ is3DMode: !state.is3DMode })),

  setViewMode: (mode) => set({ viewMode: mode, is3DMode: mode !== '2d' }),

  setOrbitScale: (scale) => set({ orbitScale: scale }),

  // New actions
  setViewportOnly: (value) => set({ viewportOnly: value }),
  toggleViewportOnly: () => set((state) => ({ viewportOnly: !state.viewportOnly })),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  setShowHeatmap: (value) => set({ showHeatmap: value }),
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  setShowClusters: (value) => set({ showClusters: value }),
  toggleClusters: () => set((state) => ({ showClusters: !state.showClusters })),
  setShowGrid: (value) => set({ showGrid: value }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleFilterPanel: () => set((state) => ({ isFilterPanelCollapsed: !state.isFilterPanelCollapsed })),
  setShowTerminator: (value) => set({ showTerminator: value }),
  toggleTerminator: () => set((state) => ({ showTerminator: !state.showTerminator })),
  setShowFullTrack: (value) => set({ showFullTrack: value }),
  toggleFullTrack: () =>
    set((state) => ({
      showFullTrack: !state.showFullTrack,
      showGroundTrack: !state.showFullTrack ? true : state.showGroundTrack,
    })),
  setLocale: (locale) => set({ locale }),
}))
