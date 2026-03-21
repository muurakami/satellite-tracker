'use client'

import { useMapStore } from '@/store/useMapStore'
import { t } from '@/lib/i18n'

export default function AddPointButton() {
  const isAddingPoint = useMapStore((s) => s.isAddingPoint)
  const toggleAddingPoint = useMapStore((s) => s.toggleAddingPoint)
  const points = useMapStore((s) => s.observationPoints)
  const locale = useMapStore((s) => s.locale)

  const canAdd = points.length < 5

  return (
    <button
      onClick={toggleAddingPoint}
      disabled={!isAddingPoint && !canAdd}
      className={`
        w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
        font-medium transition-all
        ${
          isAddingPoint
            ? 'bg-blue-500 text-white animate-pulse'
            : canAdd
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-white/5 text-white/40 cursor-not-allowed'
        }
      `}
    >
      <span>{isAddingPoint ? '✕' : '📍'}</span>
      <span>
        {isAddingPoint
          ? t('points.cancel', locale)
          : canAdd
          ? t('points.add', locale)
          : t('points.limit', locale)}
      </span>
    </button>
  )
}
