import { useRef } from 'react'

const STOP = (e: React.SyntheticEvent) => e.stopPropagation()

export function useStopMapPropagation() {
  const ref = useRef<HTMLDivElement>(null)

  const stopProps = {
    onClick: STOP,
    onMouseDown: STOP,
    onPointerDown: STOP,
    onDoubleClick: STOP,
    onWheel: STOP,
  }

  return { ref, stopProps }
}
