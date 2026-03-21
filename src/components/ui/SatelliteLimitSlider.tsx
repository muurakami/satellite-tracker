'use client'

import { useState, useEffect } from 'react'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'

const MIN_LIMIT = 10
const MAX_LIMIT = 5000
const STEP = 10

export default function SatelliteLimitSlider() {
  const performanceLimit = useSatelliteStore((s) => s.performanceLimit)
  const setPerformanceLimit = useSatelliteStore((s) => s.setPerformanceLimit)
  const locale = useMapStore((s) => s.locale)

  const [inputValue, setInputValue] = useState(String(performanceLimit))
  const [sliderValue, setSliderValue] = useState(performanceLimit)

  // Sync when store changes externally
  useEffect(() => {
    setInputValue(String(performanceLimit))
    setSliderValue(performanceLimit)
  }, [performanceLimit])

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value)
    setSliderValue(value)
    setInputValue(String(value))
    setPerformanceLimit(value)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInputValue(value)
    // Sync slider for visual feedback only (doesn't commit value)
    const numValue = Number(value)
    if (!isNaN(numValue)) {
      setSliderValue(Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, numValue)))
    }
  }

  function handleInputBlur() {
    let value = Number(inputValue)
    if (isNaN(value)) {
      value = performanceLimit
    }
    value = Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, value))
    // Round to nearest step
    value = Math.round(value / STEP) * STEP
    setInputValue(String(value))
    setSliderValue(value)
    setPerformanceLimit(value)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleInputBlur()
    }
  }

  const label = locale === 'ru' ? 'Лимит спутников' : 'Satellite Limit'

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-zinc-800 rounded-lg">
      <span className="text-xs text-zinc-400 whitespace-nowrap">{label}:</span>
      
      <input
        type="range"
        min={MIN_LIMIT}
        max={MAX_LIMIT}
        step={STEP}
        value={sliderValue}
        onChange={handleSliderChange}
        className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
      />
      
      <input
        type="number"
        min={MIN_LIMIT}
        max={MAX_LIMIT}
        step={STEP}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        className="w-16 px-2 py-1 bg-zinc-700 rounded text-xs text-white text-center outline-none focus:ring-1 focus:ring-amber-500"
      />
    </div>
  )
}
