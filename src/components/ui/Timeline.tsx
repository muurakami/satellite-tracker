'use client'

import { useEffect, useRef, useState } from 'react'
import { useSimulationStore } from '@/store/useSimulationStore'

const SPEEDS = [1, 10, 100, 1000] as const

export default function Timeline() {
  const simulationTime = useSimulationStore((s) => s.simulationTime)
  const isPlaying = useSimulationStore((s) => s.isPlaying)
  const speedMultiplier = useSimulationStore((s) => s.speedMultiplier)
  const setTime = useSimulationStore((s) => s.setTime)
  const play = useSimulationStore((s) => s.play)
  const pause = useSimulationStore((s) => s.pause)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const tick = useSimulationStore((s) => s.tick)
  const initTime = useSimulationStore((s) => s.initTime)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [sliderValue, setSliderValue] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Initialize time on client-side only to avoid hydration mismatch
  useEffect(() => {
    initTime()
    setMounted(true)
  }, [initTime])

  useEffect(() => {
    if (isPlaying && mounted) {
      intervalRef.current = setInterval(() => {
        tick()
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, tick, mounted])

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const offset = Number(e.target.value)
    setSliderValue(offset)
    const realNow = Date.now()
    setTime(new Date(realNow + offset * 1000))
  }

  function formatUTC(date: Date): string {
    return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  }

  // Show placeholder during SSR and initial client render
  const displayTime = mounted && simulationTime ? formatUTC(simulationTime) : '----/--/-- --:--:-- UTC'

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 rounded-xl px-6 py-3 text-white shadow-lg pointer-events-auto flex items-center gap-4">
      <span className="text-sm font-mono whitespace-nowrap">
        {displayTime}
      </span>

      <button
        onClick={() => (isPlaying ? pause() : play())}
        className="w-8 h-8 flex items-center justify-center rounded bg-zinc-700 hover:bg-zinc-600 text-sm"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="flex gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-1 rounded text-xs ${
              speedMultiplier === s
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <input
        type="range"
        min={-86400}
        max={86400}
        step={60}
        value={sliderValue}
        onChange={handleSliderChange}
        className="w-40 accent-emerald-500"
      />
    </div>
  )
}
