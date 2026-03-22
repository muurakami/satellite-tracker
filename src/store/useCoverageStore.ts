import { create } from 'zustand'

/**
 * Antenna radiation pattern types for coverage zone visualization
 */
export type CoverageAntennaType = 'global' | 'regional' | 'spot'

/**
 * Coverage zone visualization settings
 */
export interface CoverageSettings {
  showCoverage: boolean
  showGradient: boolean
  minElevationDeg: number
  gradientRings: number
  antennaType: CoverageAntennaType
}

/**
 * Preset configurations for different antenna types
 * Each preset defines minimum elevation angle (mask angle)
 */
export const ANTENNA_PRESETS: Record<CoverageAntennaType, { minElevation: number; description: string }> = {
  global: {
    minElevation: 0,
    description: 'Global beam antenna - covers wide area, lower signal strength at edges',
  },
  regional: {
    minElevation: 10,
    description: 'Regional beam antenna - medium coverage area with better edge performance',
  },
  spot: {
    minElevation: 20,
    description: 'Spot beam antenna - focused high-gain coverage area',
  },
}

interface CoverageState {
  // Visibility settings
  showCoverage: boolean
  showGradient: boolean
  showFootprint: boolean
  
  // Coverage parameters
  minElevationDeg: number
  gradientRings: number
  antennaType: CoverageAntennaType
  
  // Actions
  setShowCoverage: (show: boolean) => void
  setShowGradient: (show: boolean) => void
  setShowFootprint: (show: boolean) => void
  setMinElevationDeg: (deg: number) => void
  setGradientRings: (rings: number) => void
  setAntennaType: (type: CoverageAntennaType) => void
  resetToPreset: (type: CoverageAntennaType) => void
}

export const useCoverageStore = create<CoverageState>((set) => ({
  // Default visibility settings
  showCoverage: true,
  showGradient: true,
  showFootprint: false,
  
  // Default coverage parameters (global antenna preset)
  minElevationDeg: ANTENNA_PRESETS.global.minElevation,
  gradientRings: 3,
  antennaType: 'global',
  
  // Actions
  setShowCoverage: (show) => set({ showCoverage: show }),
  
  setShowGradient: (show) => set({ showGradient: show }),
  
  setShowFootprint: (show) => set({ showFootprint: show }),
  
  setMinElevationDeg: (deg) => set({ minElevationDeg: deg }),
  
  setGradientRings: (rings) => set({ gradientRings: Math.max(1, Math.min(5, rings)) }),
  
  setAntennaType: (type) => set({ antennaType: type }),
  
  resetToPreset: (type) => set({
    antennaType: type,
    minElevationDeg: ANTENNA_PRESETS[type].minElevation,
  }),
}))
