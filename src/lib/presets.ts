export interface LocationPreset {
  id: string
  labelRu: string
  labelEn: string
  lat: number
  lon: number
  emoji: string
}

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'rniirs',
    labelRu: 'РНИИРС (Ростов-на-Дону)',
    labelEn: 'RNIIRS (Rostov-on-Don)',
    lat: 47.2357,
    lon: 39.7015,
    emoji: '📡',
  },
  {
    id: 'moscow',
    labelRu: 'Москва',
    labelEn: 'Moscow',
    lat: 55.7558,
    lon: 37.6173,
    emoji: '🏙',
  },
  {
    id: 'baikonur',
    labelRu: 'Байконур',
    labelEn: 'Baikonur',
    lat: 45.92,
    lon: 63.342,
    emoji: '🚀',
  },
]
