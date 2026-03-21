import { create } from 'zustand'

type SpeedMultiplier = 1 | 10 | 100 | 1000

interface SimulationStore {
  simulationTime: Date | null
  isPlaying: boolean
  speedMultiplier: SpeedMultiplier
  setTime: (t: Date) => void
  play: () => void
  pause: () => void
  setSpeed: (s: SpeedMultiplier) => void
  tick: () => void
  initTime: () => void
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  simulationTime: null,
  isPlaying: false,
  speedMultiplier: 1,

  setTime: (t) => set({ simulationTime: t }),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  setSpeed: (s) => set({ speedMultiplier: s }),

  initTime: () => set({ simulationTime: new Date() }),

  tick: () => {
    const { simulationTime, speedMultiplier } = get()
    if (!simulationTime) return
    const next = new Date(simulationTime.getTime() + 1000 * speedMultiplier)
    set({ simulationTime: next })
  },
}))
