import { create } from 'zustand'
import type { Locale } from '@/lib/i18n'

export type MapTheme = 'dark' | 'light' | 'satellite' | 'terrain'

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
  // i18n
  locale: Locale
  // Actions
  setSelectedPoint: (p: { lat: number; lon: number } | null) => void
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
  setLocale: (locale: Locale) => void
}

export const useMapStore = create<MapStore>((set) => ({
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
  locale: 'ru' as Locale,

  setSelectedPoint: (p) => {
    if (!p) {
      set({ selectedPoint: null })
      return
    }
    // Normalize longitude to [-180, 180] range (MapLibre can return values outside this range)
    let lon = p.lon
    while (lon > 180) lon -= 360
    while (lon < -180) lon += 360
    set({ selectedPoint: { lat: p.lat, lon } })
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
  setLocale: (locale) => set({ locale }),
}))
