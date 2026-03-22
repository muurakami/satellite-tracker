# 🛰️ Satellite Tracker

Веб-приложение для отслеживания спутников в реальном времени с 2D/3D визуализацией, расчётом орбитальной механики, предсказанием пролётов и сравнением группировок.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MapLibre](https://img.shields.io/badge/MapLibre-GL-green)
![React Three Fiber](https://img.shields.io/badge/3D-R3F-black)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Содержание

- [Обзор](#обзор)
- [Возможности](#возможности)
- [Стек технологий](#стек-технологий)
- [Архитектура](#архитектура)
- [Установка](#установка)
- [Запуск проекта](#запуск-проекта)
- [Docker](#docker)
- [Структура проекта](#структура-проекта)
- [Ключевые модули](#ключевые-модули)
- [Конфигурация](#конфигурация)
- [Переменные окружения](#переменные-окружения)
- [Известные ограничения](#известные-ограничения)

---

## Обзор

**Satellite Tracker** — интерактивное веб-приложение для визуализации и отслеживания спутников на карте мира. Поддерживает отображение позиций тысяч спутников в реальном времени с использованием данных TLE (Two-Line Element) от [CelesTrak](https://celestrak.org).

Орбитальная механика рассчитывается алгоритмом SGP4 через библиотеку `satellite.js` в выделенном Web Worker — это обеспечивает отзывчивость интерфейса даже при работе с большим количеством объектов.

### Основные возможности

- 🌐 **2D-карта** (MapLibre GL) и **3D-глобус** (React Three Fiber)
- 🛰️ **8 спутниковых группировок**: GPS, ГЛОНАСС, Galileo, BeiDou, Starlink, OneWeb, Iridium, GEO
- 📡 **Зоны покрытия** с градиентной визуализацией
- 🔮 **3D-режим** с наклоном и атмосферным свечением
- 🔔 **Предсказание пролётов** для наземных точек наблюдения
- 📊 **Сравнение группировок** со статистикой
- 🌅 **Терминатор** — граница день/ночь в реальном времени
- 🔗 **KSP-style цепочки** — связывание спутников между собой
- 🌡️ **Тепловая карта** распределения спутников

---

## Возможности

### 🗺️ Карта и визуализация

| Функция | Описание |
|---------|----------|
| **2D-карта** | MapLibre GL с 4 темами: Тёмная (CartoDB Dark), Светлая (CartoDB Light), Спутниковая (ArcGIS World Imagery), Рельеф (OpenTopoMap) |
| **3D-глобус** | React Three Fiber с атмосферным свечением, загрузочной анимацией и интерактивным управлением |
| **3D-наклон** | Режим 2.5D с наклоном карты и перспективой |
| **Маркеры спутников** | Цветовая кодировка по типу орбиты: LEO `#00ff88`, MEO `#ffaa00`, GEO `#ff4466`, HEO `#aa88ff` |
| **Кластеризация** | supercluster группирует спутники при малом масштабе карты |
| **Тепловая карта** | Визуализация плотности распределения спутников |
| **Терминатор** | Граница день/ночь через SunCalc |
| **Сетка координат** | Отключаемая градусная сетка |
| **Трек орбиты** | Ломаная линия предстоящего пути (3 или 10 витков) |
| **Антимеридиан** | Корректное отображение орбит через 180° |

### 🛰️ Орбитальная механика

- **SGP4 распространение** — через `satellite.js` в Web Worker
- **Точность TLE** — актуальные данные с CelesTrak
- **Период, наклонение, RAAN** — извлекаются из TLE
- **Footprint** — расчёт зоны покрытия на поверхности Земли

### 📡 Данные и источники

| Источник | Описание |
|----------|----------|
| **CelesTrak API** | Актуальные TLE для всех группировок |
| **Mock-данные** | Офлайн-заглушка для разработки |
| **Backend API** | Опционально: связь с backend-сервером |
| **WebSocket (STOMP)** | Обновления в реальном времени (опционально) |

### 🔍 Фильтрация и поиск

- **Групповой фильтр** — включение/выключение группировок
- **Фильтр по типу орбиты** — LEO / MEO / GEO / HEO
- **Фильтр по назначению** — навигация, связь, ДЗЗ, наука
- **Текстовый поиск** — поиск по имени (игнорирует групповой фильтр)
- **Viewport фильтр** — показывать только видимые спутники
- **Лимит отображения** — настраиваемый上限 количества спутников (по умолчанию 500)

### 🌐 Сравнение группировок

- **Мультивыбор** — до 4 группировок одновременно
- **Статистика**: количество, средняя высота, средняя скорость, мин/макс высота
- **Нижний drawer** — сворачиваемая панель под картой

### 📋 Карточка спутника

- Текущая позиция (lat / lon / alt / velocity)
- Орбитальные параметры (период, наклонение, RAAN, эксцентриситет)
- Прогноз пролёта (AOS / LOS / максимальный угол места)
- Действия: центрировать, трек орбиты, полный трек, зона покрытия

### 🔔 Предсказание пролётов

- **Pass Predictor** — расчёт AOS/LOS/угла места
- **Notification Toast** — уведомления перед пролётами
- **Observation Points** — до 5 перетаскиваемых точек наблюдения
- **Location Presets** — пресеты городов (Москва, Вашингтон, Токио, итд)

### ⚙️ Настройки

- 🌐 Переключение языка (RU / EN)
- 🎨 Выбор темы карты (4 варианта)
- 📐 Режим отображения (2D / 3D-наклон / 3D-глобус)
- 🔭 Настройки зоны покрытия (граничные углы)
- 🌡️ Тепловая карта
- 📏 Сетка координат
- ⏱️ Таймлайн симуляции

---

## Стек технологий

| Слой | Технология | Версия |
|------|------------|--------|
| **Фреймворк** | Next.js | 16.2.0 |
| **Язык** | TypeScript | 5.x |
| **UI** | React | 19.2.4 |
| **Стили** | Tailwind CSS | 4.x |
| **2D-карта** | MapLibre GL + react-map-gl | 5.21 / 8.1 |
| **3D-глобус** | React Three Fiber + Three.js | 9.5 / 0.183 |
| **Состояние** | Zustand | 5.0.12 |
| **SGP4** | satellite.js | 6.0.2 |
| **Кластеризация** | supercluster | 8.0.1 |
| **Солнце** | SunCalc | 1.9.0 |
| **WebSocket** | STOMP + SockJS | 7.3 / 1.6 |
| **i18n** | Встроенный | — |

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                           │
│  ┌────────────────┐           ┌──────────────────────────┐  │
│  │  Sidebar       │           │     Map Area             │  │
│  │  ────────────  │           │                          │  │
│  │  SearchInput   │           │  ┌────────────────────┐  │  │
│  │  GroupSelector │           │  │   SatelliteMap     │  │  │
│  │  OrbitFilter   │           │  │   (MapLibre GL)    │  │  │
│  │  PurposeFilter │           │  │                    │  │  │
│  │  Settings      │           │  │  + GroundTrack     │  │  │
│  │  ────────────  │           │  │  + Coverage        │  │  │
│  │  PassList      │           │  │  + Terminator       │  │  │
│  │                │           │  │  + Grid            │  │  │
│  └────────────────┘           │  │  + Clusters        │  │  │
│                              │  └────────────────────┘  │  │
│                              │                          │  │
│                              │  ┌────────────────────┐  │  │
│                              │  │ ComparisonDrawer   │  │  │
│                              │  └────────────────────┘  │  │
│                              └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               Слой состояния (Zustand)                       │
│                                                              │
│  useSatelliteStore   useMapStore   useCoverageStore         │
│  useSimulationStore                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Web Worker (SGP4 via satellite.js)             │
│                                                              │
│  satellite-worker.ts                                         │
│  Вход:  Satellite[] + timestamp                              │
│  Выход: SatellitePosition[] (lat/lon/alt/velocity)          │
└─────────────────────────────────────────────────────────────┘
```

### Поток данных

```
CelesTrak API / Backend
        │
        ▼
getSatellites() → парсинг TLE → Satellite[]
        │
        ▼
useSatelliteStore.setSatellites()
        │
        ▼
satellite-worker.ts (SGP4 каждую секунду)
        │
        ▼
useSatelliteStore.updatePositions()
        │
        ▼
SatelliteMap → GeoJSON → MapLibre GL layers
```

---

## Установка

### Требования

- **Node.js** 18+
- **npm** 9+ (или pnpm / yarn)
- Git

### Клонирование

```bash
git clone <repository-url>
cd satellite-tracker
```

### Установка зависимостей

```bash
npm install
```

---

## Запуск проекта

### Режим разработки

```bash
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

> Hot reload включён. Изменения в Web Worker требуют полной перезагрузки страницы.

### Продакшн сборка

```bash
# Сборка оптимизированного бандла
npm run build

# Запуск продакшн-сервера
npm run start
```

### Docker

```bash
# Сборка и запуск
docker-compose up --build

# Запуск в фоновом режиме
docker-compose up -d
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

### Проверки

```bash
# Проверка TypeScript типов
npx tsc --noEmit

# Линтинг ESLint
npm run lint
```

---

## Docker

Проект включает multi-stage Docker build для оптимального размера образа.

### Конфигурация docker-compose

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_USE_MOCK=true
      - NEXT_PUBLIC_ENABLE_WS=false
    restart: unless-stopped
```

### Переменные окружения в Docker

| Переменная | Значение по умолчанию | Описание |
|------------|----------------------|----------|
| `NEXT_PUBLIC_USE_MOCK` | `true` | Использовать mock-данные / CelesTrak |
| `NEXT_PUBLIC_ENABLE_WS` | `false` | Включить WebSocket |

### Dockerfile Stages

1. **deps** — установка зависимостей
2. **builder** — сборка Next.js приложения
3. **runner** — production runtime

---

## Структура проекта

```
satellite-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Корневой layout
│   │   └── page.tsx                # Главная страница
│   │
│   ├── components/
│   │   ├── map/
│   │   │   ├── SatelliteMap.tsx        # MapLibre GL карта
│   │   │   ├── Globe3D.tsx             # 3D-глобус (R3F)
│   │   │   ├── GroundTrack.tsx         # Трек орбиты
│   │   │   ├── EnhancedCoverageZone.tsx# Зона покрытия
│   │   │   ├── CoverageCone.tsx        # Конус видимости
│   │   │   ├── ClusterMarker.tsx       # Кластеры
│   │   │   ├── SatelliteLinks.tsx       # Цепочки спутников
│   │   │   ├── CoordinateGrid.tsx      # Сетка координат
│   │   │   ├── Terminator.tsx          # Терминатор
│   │   │   └── ObservationPins.tsx    # Точки наблюдения
│   │   │
│   │   ├── ui/
│   │   │   ├── FilterPanel.tsx         # Левый sidebar
│   │   │   ├── GroupSelector.tsx       # Выбор группировок
│   │   │   ├── MapSettings.tsx         # Настройки карты
│   │   │   ├── CoverageSettings.tsx    # Настройки зоны покрытия
│   │   │   ├── GroupComparisonTable.tsx# Таблица сравнения
│   │   │   ├── ComparisonDrawer.tsx    # Drawer сравнения
│   │   │   ├── NotificationToast.tsx   # Toast уведомления
│   │   │   ├── AddPointButton.tsx      # Добавить точку
│   │   │   ├── LocationPresets.tsx     # Пресеты городов
│   │   │   ├── PointsPanel.tsx         # Панель точек
│   │   │   ├── SatelliteLimitSlider.tsx# Лимит спутников
│   │   │   ├── Timeline.tsx            # Таймлайн
│   │   │   └── ZoomIndicator.tsx       # Индикатор зума
│   │   │
│   │   └── satellite/
│   │       ├── SatelliteCard.tsx       # Карточка спутника
│   │       └── PassList.tsx            # Список пролётов
│   │
│   ├── store/
│   │   ├── useSatelliteStore.ts        # Спутники, позиции, фильтры
│   │   ├── useMapStore.ts              # Состояние карты, темы
│   │   ├── useCoverageStore.ts         # Настройки зоны покрытия
│   │   └── useSimulationStore.ts       # Симуляция таймлайна
│   │
│   ├── lib/
│   │   ├── satellite-worker.ts         # Web Worker — SGP4
│   │   ├── celestrak.ts                # CelesTrak API
│   │   ├── coverage-geometry.ts        # Footprint полигоны
│   │   ├── unwrapCoordinates.ts        # Антимеридиан fix
│   │   ├── pass-predictor.ts           # AOS/LOS расчёт
│   │   ├── pass-notifier.ts            # Уведомления о пролётах
│   │   ├── terminator.ts               # Терминатор SunCalc
│   │   ├── ws-client.ts                # STOMP WebSocket
│   │   ├── api.ts                      # HTTP API обёртка
│   │   ├── mock-data.ts                # Mock-данные
│   │   ├── viewport-filter.ts          # Viewport фильтр
│   │   ├── viewport-filter-3d.ts       # 3D viewport фильтр
│   │   ├── presets.ts                  # Пресеты точек
│   │   └── i18n.ts                     # Переводы RU/EN
│   │
│   ├── hooks/
│   │   ├── useSupercluster.ts          # Кластеризация
│   │   ├── useGroupStats.ts            # Статистика группировок
│   │   └── useStopMapPropagation.ts    # Блокировка кликов
│   │
│   ├── types/
│   │   └── satellite.ts                # TypeScript типы
│   │
│   └── app/api/
│       ├── celestrak-proxy/            # Прокси для CelesTrak
│       └── proxy/                      # Универсальный прокси
│
├── public/                             # Статические файлы
├── Dockerfile                          # Multi-stage build
├── docker-compose.yml                  # Docker Compose
├── next.config.ts                      # Next.js конфиг
├── tailwind.config.ts                 # Tailwind CSS
├── tsconfig.json                      # TypeScript
└── package.json                       # Зависимости
```

---

## Ключевые модули

### `satellite-worker.ts`

Web Worker выполняет SGP4 распространение вне основного потока.

```typescript
// Сообщение на вход
{ type: 'CALCULATE', payload: { satellites: Satellite[], timestamp: number } }

// Сообщение на выход
{ type: 'POSITIONS', payload: SatellitePosition[] }
```

### `unwrapCoordinates.ts`

Устраняет артефакт пересечения антимеридиана.

```typescript
// Без фикса: 170° → -170° (линия через всю карту)
// С фиксом:  170° → 190° (непрерывная долгота)
unwrapLongitudes(coords: [number, number][]): [number, number][]
splitIntoOrbits(coords, pointsPerOrbit): [number, number][][]
```

### `coverage-geometry.ts`

Расчёт наземного следа спутника.

- Формула центрального угла: `ρ = arccos(R / (R + alt))`
- Градиентные кольца: внутренняя / средняя / краевая зоны
- GeoJSON FeatureCollection для MapLibre

### `pass-predictor.ts`

Предсказание пролёта спутника.

- **AOS** (Acquisition of Signal) — время появления над горизонтом
- **LOS** (Loss of Signal) — время захода за горизонт
- **Max Elevation** — максимальный угол места
- Шаг расчёта: 60 секунд, окно: 24 часа

### `celestrak.ts`

Интеграция с CelesTrak API для получения актуальных TLE.

---

## Конфигурация

### Добавление группировки

В [`src/types/satellite.ts`](src/types/satellite.ts):

```typescript
export const GROUP_CONFIG: Record<SatelliteGroup, {...}> = {
  // Добавить новую запись:
  oneweb: {
    name: "OneWeb",
    description: "OneWeb constellation",
    filter: { q: "ONEWEB" },
    icon: '🌐'
  },
}
```

### Добавление темы карты

В [`src/store/useMapStore.ts`](src/store/useMapStore.ts):

```typescript
export const MAP_THEMES: Record<MapTheme, { label: string; tiles: string[] }> = {
  topo: {
    label: "Топографическая",
    tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
  },
}
```

### Добавление перевода

В [`src/lib/i18n.ts`](src/lib/i18n.ts):

```typescript
export const translations = {
  'my.new.key': {
    en: 'English text',
    ru: 'Русский текст',
  },
}
```

---

## Переменные окружения

### Файл `.env.local`

Создайте файл `.env.local` в корне проекта:

```env
# ============================================
# Режим работы
# ============================================

# Использовать mock-данные / CelesTrak (по умолчанию: true)
NEXT_PUBLIC_USE_MOCK=true

# Включить WebSocket (по умолчанию: false)
NEXT_PUBLIC_ENABLE_WS=false

# ============================================
# API URLs
# ============================================

# URL backend API (по умолчанию: http://localhost:8888)
NEXT_PUBLIC_API_URL=http://localhost:8888

# URL CelesTrak (по умолчанию: https://celestrak.org)
NEXT_PUBLIC_CELESTRAK_URL=https://celestrak.org

# WebSocket URL (по умолчанию: ws://localhost:8080/ws)
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# ============================================
# Лимиты
# ============================================

# Максимум спутников для загрузки с CelesTrak (по умолчанию: 200)
# Не рекомендуется ставить больше 500 — браузер может зависнуть
NEXT_PUBLIC_CELESTRAK_LIMIT=200
```

### Переменные только для frontend

Все переменные с префиксом `NEXT_PUBLIC_` доступны в браузере.

---

## Известные ограничения

| Проблема | Статус |
|----------|--------|
| Rate limiting CelesTrak при первой загрузке | Кэширование; перезагрузите если пусто |
| TLE устаревают через ~2 недели | Используйте кнопку 🔄 Обновить |
| 3D-глобус не показывает маркеры | В планах |
| Зона покрытия — только текущая позиция | По замыслу — обновляется каждую секунду |
| WebSocket требует backend | Опционально; работает без него |
| Точность пролётов: ±1 мин | Шаг расчёта 60 секунд |
| Лимит 5 точек наблюдения | Техническое ограничение UI |

---

## Лицензия

MIT © 2024

---

_Создано с использованием [satellite.js](https://github.com/shashwatak/satellite-js), [MapLibre GL](https://maplibre.org), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [CelesTrak](https://celestrak.org)_
