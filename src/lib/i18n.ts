export type Locale = 'ru' | 'en'

const translations = {
  // FilterPanel
  'filters.title': { ru: 'Фильтры', en: 'Filters' },
  'filters.refresh': { ru: 'Обновить', en: 'Refresh' },
  'filters.loading': { ru: 'Загрузка...', en: 'Loading...' },
  'filters.performanceMode': { ru: '⚡ Режим производительности', en: '⚡ Performance Mode' },
  'filters.searchPlaceholder': { ru: 'Поиск по имени...', en: 'Search by name...' },
  'filters.orbitType': { ru: 'Тип орбиты', en: 'Orbit type' },
  'filters.purpose': { ru: 'Назначение', en: 'Purpose' },
  'filters.all': { ru: 'Все', en: 'All' },
  'filters.viewportOnly': { ru: 'Только в зоне видимости', en: 'Viewport only' },
  'filters.showAll': { ru: 'Показать все', en: 'Show all' },
  'filters.satellites': { ru: 'спутников', en: 'satellites' },
  'filters.showing': { ru: 'показано', en: 'showing' },
  'filters.loadFromFile': { ru: '📁 Загрузить TLE файл', en: '📁 Load TLE file' },

  // GroupSelector
  'groups.title': { ru: 'Группы спутников', en: 'Satellite Groups' },
  'groups.reset': { ru: 'Сброс', en: 'Reset' },

  // SatelliteCard
  'card.country': { ru: 'Страна', en: 'Country' },
  'card.operator': { ru: 'Оператор', en: 'Operator' },
  'card.lat': { ru: 'Широта', en: 'Lat' },
  'card.lon': { ru: 'Долгота', en: 'Lon' },
  'card.alt': { ru: 'Высота', en: 'Alt' },
  'card.velocity': { ru: 'Скорость', en: 'Velocity' },
  'card.centerOnMap': { ru: '📍 Центрировать на карте', en: '📍 Center on map' },
  'card.orbitTrack': { ru: 'Трек орбиты', en: 'Orbit track' },
  'card.coverageZone': { ru: 'Зона покрытия', en: 'Coverage zone' },
  'card.link': { ru: '🔗 Связать', en: '🔗 Link' },
  'card.unlink': { ru: '🔗 Отвязать', en: '🔗 Unlink' },
  'card.linked': { ru: 'связано', en: 'linked' },
  'card.clearLinks': { ru: 'Очистить все связи', en: 'Clear all links' },
  'card.passesOverPoint': { ru: 'Пролёты над точкой', en: 'Passes over point' },

  // PassList
  'passes.title': { ru: 'Пролёты над', en: 'Passes over' },
  'passes.loading': { ru: 'Загрузка...', en: 'Loading...' },
  'passes.noFound': { ru: 'Пролёты не найдены', en: 'No passes found' },
  'passes.empty': { ru: 'Нет пролётов', en: 'No passes' },
  'passes.error': { ru: 'Ошибка расчёта', en: 'Calculation error' },
  'passes.hours24': { ru: 'пролётов / 24ч', en: 'passes / 24h' },
  'passes.selected': { ru: 'Выбран', en: 'Selected' },

  // MapSettings
  'settings.title': { ru: 'Настройки карты', en: 'Map Settings' },
  'settings.theme': { ru: 'Тема', en: 'Theme' },
  'settings.viewMode': { ru: 'Режим просмотра', en: 'View mode' },
  'settings.orbitScale': { ru: 'Масштаб орбит', en: 'Orbit scale' },
  'settings.selectedColor': { ru: 'Цвет выделения', en: 'Selection color' },
  'settings.heatmap': { ru: 'Тепловая карта', en: 'Heatmap' },
  'settings.clusters': { ru: 'Кластеры', en: 'Clusters' },
  'settings.grid': { ru: 'Сетка координат', en: 'Coordinate Grid' },
  'settings.terminator': { ru: 'Тень Земли', en: 'Day/Night' },
  'settings.language': { ru: 'Язык', en: 'Language' },

  // ZoomIndicator
  'zoom.satellites': { ru: 'спутников', en: 'satellites' },
  'zoom.groups': { ru: 'групп', en: 'groups' },

  // Timeline
  'timeline.realtime': { ru: 'Реальное время', en: 'Real-time' },
  'timeline.speed': { ru: 'Скорость', en: 'Speed' },

  // Purpose names
  'purpose.communications': { ru: 'Связь', en: 'Communications' },
  'purpose.navigation': { ru: 'Навигация', en: 'Navigation' },
  'purpose.earth-observation': { ru: 'Наблюдение Земли', en: 'Earth observation' },
  'purpose.scientific': { ru: 'Научный', en: 'Scientific' },
  'purpose.unknown': { ru: 'Неизвестно', en: 'Unknown' },
} as const

type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, locale: Locale): string {
  const entry = translations[key]
  if (!entry) return key
  return entry[locale] ?? entry.en
}

export function getLocaleLabel(locale: Locale): string {
  return locale === 'ru' ? 'Русский' : 'English'
}
