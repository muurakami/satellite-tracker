import { create } from 'zustand'
import type {
  OrbitType,
  Satellite,
  SatelliteLink,
  SatellitePosition,
  SatellitePurpose,
  SatelliteGroup,
} from '@/types/satellite'
import { GROUP_CONFIG } from '@/types/satellite'
import { getSatellites } from '@/lib/api'

interface SatelliteFilters {
  orbit?: OrbitType
  country?: string
  purpose?: SatellitePurpose
  q?: string
}

export interface PassAlert {
  id: string // uuid
  satelliteId: number
  satelliteName: string
  aos: Date
  maxElevationDeg: number
  minutesUntil: number
  dismissed: boolean
}

interface SatelliteStore {
  satellites: Satellite[]
  positions: Map<number, SatellitePosition>
  selectedSatellite: Satellite | null
  filters: SatelliteFilters
  activeGroups: SatelliteGroup[]
  // Performance mode
  performanceMode: boolean
  performanceLimit: number
  // Refresh state
  isRefreshing: boolean
  // Satellite links (KSP-style)
  linkedSatellites: number[]
  // Pass alerts
  passAlerts: PassAlert[]
  // Actions
  setSatellites: (s: Satellite[]) => void
  updatePositions: (positions: SatellitePosition[]) => void
  selectSatellite: (s: Satellite | null) => void
  setFilters: (f: Partial<SatelliteFilters>) => void
  addGroup: (group: SatelliteGroup) => void
  removeGroup: (group: SatelliteGroup) => void
  resetToDefaults: () => void
  setPerformanceMode: (value: boolean) => void
  togglePerformanceMode: () => void
  refreshSatellites: () => Promise<void>
  toggleSatelliteLink: (noradId: number) => void
  clearLinks: () => void
  getSatelliteLinks: () => SatelliteLink[]
  addPassAlert: (alert: PassAlert) => void
  dismissPassAlert: (id: string) => void
  // Computed getters
  filteredSatellites: () => Satellite[]
  filteredByGroups: () => Satellite[]
}

// Default groups to show on app start
const DEFAULT_ACTIVE_GROUPS: SatelliteGroup[] = ['geo', 'gps', 'glonass', 'galileo', 'beidou']

export const useSatelliteStore = create<SatelliteStore>((set, get) => ({
  satellites: [],
  positions: new Map(),
  selectedSatellite: null,
  filters: {},
  activeGroups: DEFAULT_ACTIVE_GROUPS,
  performanceMode: true,
  performanceLimit: 10,
  isRefreshing: false,
  linkedSatellites: [],
  passAlerts: [],

  setSatellites: (satellites) => set({ satellites }),

  updatePositions: (newPositions) => {
    // Mutate the existing Map reference to avoid creating a new Map every second
    // This prevents unnecessary re-renders of components that don't use positions directly
    const map = get().positions
    let changed = false
    for (const pos of newPositions) {
      const existing = map.get(pos.noradId)
      // Only update if position actually changed (avoid unnecessary re-renders)
      if (!existing || existing.lat !== pos.lat || existing.lon !== pos.lon || existing.alt !== pos.alt) {
        map.set(pos.noradId, pos)
        changed = true
      }
    }
    // Only trigger re-render if something actually changed
    if (changed) {
      set({ positions: new Map(map) })
    }
  },

  selectSatellite: (satellite) => set({ selectedSatellite: satellite }),

  setFilters: (f) =>
    set((state) => ({ filters: { ...state.filters, ...f } })),

  addGroup: (group) =>
    set((state) => ({
      activeGroups: state.activeGroups.includes(group)
        ? state.activeGroups
        : [...state.activeGroups, group],
    })),

  removeGroup: (group) =>
    set((state) => ({
      activeGroups: state.activeGroups.filter((g) => g !== group),
    })),

  resetToDefaults: () => set({ activeGroups: DEFAULT_ACTIVE_GROUPS }),

  setPerformanceMode: (value) => set({ performanceMode: value }),

  togglePerformanceMode: () =>
    set((state) => ({ performanceMode: !state.performanceMode })),

  refreshSatellites: async () => {
    set({ isRefreshing: true })
    try {
      const sats = await getSatellites()
      set({ satellites: sats })
    } catch (err) {
      console.error('[useSatelliteStore] refreshSatellites failed:', err)
    } finally {
      set({ isRefreshing: false })
    }
  },

  toggleSatelliteLink: (noradId) =>
    set((state) => {
      const linked = state.linkedSatellites
      if (linked.includes(noradId)) {
        return { linkedSatellites: linked.filter((id) => id !== noradId) }
      }
      return { linkedSatellites: [...linked, noradId] }
    }),

  clearLinks: () => set({ linkedSatellites: [] }),

  addPassAlert: (alert) =>
    set((state) => {
      // Max 10 alerts - trim oldest
      let alerts = [...state.passAlerts, alert]
      if (alerts.length > 10) {
        alerts = alerts.slice(-10)
      }
      return { passAlerts: alerts }
    }),

  dismissPassAlert: (id) =>
    set((state) => ({
      passAlerts: state.passAlerts.map((a) =>
        a.id === id ? { ...a, dismissed: true } : a
      ),
    })),

  getSatelliteLinks: (): SatelliteLink[] => {
    const { linkedSatellites } = get()
    if (linkedSatellites.length < 2) return []
    const links: SatelliteLink[] = []
    for (let i = 0; i < linkedSatellites.length; i++) {
      const next = (i + 1) % linkedSatellites.length
      links.push({
        fromNoradId: linkedSatellites[i],
        toNoradId: linkedSatellites[next],
      })
    }
    return links
  },

  filteredSatellites: () => {
    const { satellites, filters } = get()
    return satellites.filter((sat) => {
      if (filters.orbit && sat.orbitType !== filters.orbit) return false
      if (filters.country && sat.country !== filters.country) return false
      if (filters.purpose && sat.purpose !== filters.purpose) return false
      if (
        filters.q &&
        !sat.name.toLowerCase().includes(filters.q.toLowerCase())
      )
        return false
      return true
    })
  },

  filteredByGroups: () => {
    const { satellites, activeGroups, filters } = get()
    let result = satellites

    // If user is searching by name, search ALL satellites (ignore groups)
    // This allows finding any satellite regardless of active groups
    if (filters.q) {
      result = result.filter((sat) =>
        sat.name.toLowerCase().includes(filters.q!.toLowerCase())
      )
    } else {
      // Apply group filter only when not searching
      if (activeGroups.length > 0) {
        result = result.filter((sat) => {
          return activeGroups.some((group) => {
            const config = GROUP_CONFIG[group]
            if (config.filter.orbit && sat.orbitType !== config.filter.orbit) {
              return false
            }
            if (config.filter.q && !sat.name.toUpperCase().includes(config.filter.q)) {
              return false
            }
            return true
          })
        })
      }
    }

    // Apply orbit type filter
    if (filters.orbit) {
      result = result.filter((sat) => sat.orbitType === filters.orbit)
    }

    // Apply purpose filter
    if (filters.purpose) {
      result = result.filter((sat) => sat.purpose === filters.purpose)
    }

    return result
  },
}))
