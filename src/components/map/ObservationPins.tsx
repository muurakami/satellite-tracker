'use client'

import { Marker } from 'react-map-gl/maplibre'
import { useMapStore, type ObservationPoint } from '@/store/useMapStore'
import { t } from '@/lib/i18n'

function PinMarker({
  point,
  isActive,
  onRemove,
}: {
  point: ObservationPoint
  isActive: boolean
  onRemove: (e: React.MouseEvent) => void
}) {
  const locale = useMapStore((s) => s.locale)

  return (
    <div className="relative group cursor-grab active:cursor-grabbing select-none">
      {/* Pin SVG */}
      <svg width="28" height="36" viewBox="0 0 28 36">
        <circle
          cx="14"
          cy="14"
          r="12"
          fill={point.color}
          fillOpacity={isActive ? 1 : 0.6}
          stroke="white"
          strokeWidth={isActive ? 2.5 : 1.5}
        />
        <line
          x1="14"
          y1="26"
          x2="14"
          y2="36"
          stroke={point.color}
          strokeWidth={isActive ? 3 : 2}
          strokeOpacity={isActive ? 1 : 0.6}
        />
        {/* Active ring pulse */}
        {isActive && (
          <circle
            cx="14"
            cy="14"
            r="12"
            fill="none"
            stroke={point.color}
            strokeWidth="2"
            opacity="0.4"
            className="animate-ping"
          />
        )}
        {/* Label number */}
        <text
          x="14"
          y="18"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill="white"
        >
          {point.label.replace('Point ', '')}
        </text>
      </svg>

      {/* Delete button - visible on hover or when active */}
      <button
        onClick={onRemove}
        className="
          absolute -top-2 -right-2
          w-5 h-5 rounded-full
          bg-red-500 hover:bg-red-400
          text-white text-xs font-bold
          items-center justify-center
          hidden group-hover:flex
          z-10 shadow-md
          transition-all
        "
        title={t('points.remove', locale)}
      >
        ×
      </button>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center gap-0.5 bg-black/80 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-50">
        <span className="font-bold">{point.label}</span>
        <span>
          {point.lat.toFixed(4)}° {point.lon.toFixed(4)}°
        </span>
        {isActive && (
          <span className="text-green-400">● {t('points.active', locale)}</span>
        )}
        <span className="text-gray-400">{t('points.drag_hint', locale)}</span>
        <span className="text-gray-400">{t('points.click_hint', locale)}</span>
      </div>
    </div>
  )
}

export default function ObservationPins() {
  const points = useMapStore((s) => s.observationPoints)
  const activePointId = useMapStore((s) => s.activePointId)
  const updateObservationPoint = useMapStore((s) => s.updateObservationPoint)
  const setActivePoint = useMapStore((s) => s.setActivePoint)
  const removeObservationPoint = useMapStore((s) => s.removeObservationPoint)
  const isAddingPoint = useMapStore((s) => s.isAddingPoint)
  const locale = useMapStore((s) => s.locale)

  if (points.length === 0 && !isAddingPoint) return null

  return (
    <>
      {points.map((point) => (
        <Marker
          key={point.id}
          longitude={point.lon}
          latitude={point.lat}
          anchor="bottom"
          draggable
          onDragEnd={(e) => {
            updateObservationPoint(point.id, e.lngLat.lat, e.lngLat.lng)
          }}
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setActivePoint(point.id)
          }}
        >
          <PinMarker
            point={point}
            isActive={point.id === activePointId}
            onRemove={(e) => {
              e.stopPropagation()
              removeObservationPoint(point.id)
            }}
          />
        </Marker>
      ))}
    </>
  )
}
