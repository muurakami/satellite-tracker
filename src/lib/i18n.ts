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
  'groups.search': { ru: 'Поиск групп...', en: 'Search groups...' },
  'groups.compare': { ru: 'Сравнить', en: 'Compare' },
  'groups.addToCompare': { ru: 'Добавить к сравнению', en: 'Add to compare' },
  'groups.removeFromCompare': { ru: 'Убрать из сравнения', en: 'Remove from compare' },
  'groups.moreToCompare': { ru: 'нужно ещё для сравнения', en: 'more to compare' },

  // SatelliteCard
  'card.country': { ru: 'Страна', en: 'Country' },
  'card.operator': { ru: 'Оператор', en: 'Operator' },
  'card.lat': { ru: 'Широта', en: 'Lat' },
  'card.lon': { ru: 'Долгота', en: 'Lon' },
  'card.alt': { ru: 'Высота', en: 'Alt' },
  'card.velocity': { ru: 'Скорость', en: 'Velocity' },
  'card.centerOnMap': { ru: '📍 Центрировать на карте', en: '📍 Center on map' },
  'card.orbitTrack': { ru: 'Трек орбиты', en: 'Orbit track' },
  'card.fullOrbit': { ru: 'Полная траектория', en: 'Full track' },
  'card.coverageZone': { ru: 'Зона покрытия', en: 'Coverage zone' },
  'card.link': { ru: '🔗 Связать', en: '🔗 Link' },
  'card.unlink': { ru: '🔗 Отвязать', en: '🔗 Unlink' },
  'card.linked': { ru: 'связано', en: 'linked' },
  'card.clearLinks': { ru: 'Очистить все связи', en: 'Clear all links' },
  'card.passesOverPoint': { ru: 'Пролёты над точкой', en: 'Passes over point' },
  'card.orbitalParams': { ru: 'Орбитальные параметры', en: 'Orbital Parameters' },
  'card.period': { ru: 'Период', en: 'Period' },
  'card.altitude': { ru: 'Высота', en: 'Altitude' },
  'card.inclination': { ru: 'Наклонение', en: 'Inclination' },
  'card.raan': { ru: 'Восх. узел', en: 'RAAN' },

  // PassList
  'passes.title': { ru: 'Пролёты над', en: 'Passes over' },
  'passes.loading': { ru: 'Загрузка...', en: 'Loading...' },
  'passes.noFound': { ru: 'Пролёты не найдены', en: 'No passes found' },
  'passes.empty': { ru: 'Нет пролётов', en: 'No passes' },
  'passes.error': { ru: 'Ошибка расчёта', en: 'Calculation error' },
  'passes.hours24': { ru: 'пролётов / 24ч', en: 'passes / 24h' },
  'passes.selected': { ru: 'Выбран', en: 'Selected' },
  'passes.geo_visible': { ru: 'Геостационарные (всегда видимы)', en: 'Geostationary (always visible)' },

  // Location Presets
  'presets.title': { ru: 'Быстрые точки', en: 'Quick points' },
  'presets.add': { ru: 'Добавить', en: 'Add' },
  'presets.exists': { ru: 'Уже добавлена', en: 'Already added' },

  // Pin copy
  'pin.copy': { ru: 'Копировать координаты', en: 'Copy coordinates' },
  'pin.copied': { ru: '✓ Скопировано', en: '✓ Copied' },
  'points.copy_coords': { ru: 'Копировать координаты', en: 'Copy coordinates' },

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
  'settings.groundTrack': { ru: 'Трек орбиты', en: 'Orbit track' },
  'settings.fullTrack': { ru: 'Полная траектория', en: 'Full track' },
  'settings.language': { ru: 'Язык', en: 'Language' },

  // ZoomIndicator
  'zoom.satellites': { ru: 'спутников', en: 'satellites' },
  'zoom.groups': { ru: 'групп', en: 'groups' },

  // Timeline
  'timeline.realtime': { ru: 'Реальное время', en: 'Real-time' },
  'timeline.speed': { ru: 'Скорость', en: 'Speed' },

  // Points / Observation Points
  'points.add': { ru: 'Создать точку наблюдения', en: 'Add observation point' },
  'points.add_short': { ru: '+ Точка', en: '+ Point' },
  'points.limit': { ru: 'Максимум 5 точек', en: 'Maximum 5 points' },
  'points.empty': { ru: 'Нет точек наблюдения', en: 'No observation points' },
  'points.hint': { ru: 'Нажмите на карту для добавления', en: 'Click on the map to add' },
  'points.active': { ru: 'Отслеживается', en: 'Tracking' },
  'points.remove': { ru: 'Удалить', en: 'Remove' },
  'points.label': { ru: 'Точка {n}', en: 'Point {n}' },
  'points.coordinates': { ru: '{lat}° {latDir} {lon}° {lonDir}', en: '{lat}° {latDir} {lon}° {lonDir}' },
  'points.passes_for': { ru: 'Пролёты над {label}', en: 'Passes over {label}' },
  'points.drag_hint': { ru: 'Перетащите для перемещения', en: 'Drag to move' },
  'points.click_hint': { ru: 'Клик — активировать', en: 'Click to activate' },
  'points.cancel': { ru: 'Отмена', en: 'Cancel' },

  // Purpose names
  'purpose.communications': { ru: 'Связь', en: 'Communications' },
  'purpose.navigation': { ru: 'Навигация', en: 'Navigation' },
  'purpose.earth-observation': { ru: 'Наблюдение Земли', en: 'Earth observation' },
  'purpose.scientific': { ru: 'Научный', en: 'Scientific' },
  'purpose.unknown': { ru: 'Неизвестно', en: 'Unknown' },

  // Comparison table
  'comparison.title': { ru: 'Сравнение группировок', en: 'Group Comparison' },
  'comparison.clear': { ru: 'Очистить', en: 'Clear' },
  'comparison.parameter': { ru: 'Параметр', en: 'Parameter' },
  'comparison.totalCount': { ru: 'Всего спутников', en: 'Total satellites' },
  'comparison.activeCount': { ru: 'Активных', en: 'Active now' },
  'comparison.avgAltitudeKm': { ru: 'Средняя высота', en: 'Avg altitude' },
  'comparison.avgVelocityKmS': { ru: 'Средняя скорость', en: 'Avg velocity' },
  'comparison.minAltitudeKm': { ru: 'Мин. высота', en: 'Min altitude' },
  'comparison.maxAltitudeKm': { ru: 'Макс. высота', en: 'Max altitude' },
} as const

type TranslationKey = keyof typeof translations | string

export function t(key: TranslationKey, locale: Locale): string {
  const entry = (translations as Record<string, { ru: string; en: string }>)[key]
  if (!entry) return key
  return entry[locale] ?? entry.en
}

export function getLocaleLabel(locale: Locale): string {
  return locale === 'ru' ? 'Русский' : 'English'
}
