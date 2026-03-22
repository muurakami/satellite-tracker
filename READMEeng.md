# 🛰️ Satellite Tracker

Real-time satellite tracking web application with 2D/3D visualization, orbital mechanics, pass prediction, and constellation comparison.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MapLibre](https://img.shields.io/badge/MapLibre-GL-green)
![React Three Fiber](https://img.shields.io/badge/3D-R3F-black)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Docker](#docker)
- [Project Structure](#project-structure)
- [Key Modules](#key-modules)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Known Limitations](#known-limitations)

---

## Overview

**Satellite Tracker** is an interactive web application for visualizing and tracking satellites on a world map. It supports displaying thousands of satellites in real-time using TLE (Two-Line Element) data from [CelesTrak](https://celestrak.org).

Orbital mechanics are calculated using the SGP4 algorithm via `satellite.js` library in a dedicated Web Worker — this ensures UI responsiveness even when working with a large number of objects.

### Key Features

- 🌐 **2D Map** (MapLibre GL) and **3D Globe** (React Three Fiber)
- 🛰️ **8 Satellite Constellations**: GPS, GLONASS, Galileo, BeiDou, Starlink, OneWeb, Iridium, GEO
- 📡 **Coverage Zones** with gradient visualization
- 🔮 **3D Mode** with tilt and atmospheric glow
- 🔔 **Pass Prediction** for ground observation points
- 📊 **Constellation Comparison** with statistics
- 🌅 **Terminator** — real-time day/night boundary
- 🔗 **KSP-style Links** — connecting satellites together
- 🌡️ **Heatmap** of satellite distribution

---

## Features

### 🗺️ Map & Visualization

| Feature | Description |
|---------|-------------|
| **2D Map** | MapLibre GL with 4 themes: Dark (CartoDB Dark), Light (CartoDB Light), Satellite (ArcGIS World Imagery), Terrain (OpenTopoMap) |
| **3D Globe** | React Three Fiber with atmospheric glow, loading animation, and interactive controls |
| **3D Tilt** | 2.5D mode with map tilt and perspective |
| **Satellite Markers** | Color-coded by orbit type: LEO `#00ff88`, MEO `#ffaa00`, GEO `#ff4466`, HEO `#aa88ff` |
| **Clustering** | supercluster groups satellites at low zoom levels |
| **Heatmap** | Density visualization of satellite distribution |
| **Terminator** | Day/night boundary via SunCalc |
| **Coordinate Grid** | Toggleable graticule overlay |
| **Orbit Track** | Polyline of upcoming path (3 or 10 orbits) |
| **Anti-meridian** | Correct rendering across 180° longitude |

### 🛰️ Orbital Mechanics

- **SGP4 Propagation** — via `satellite.js` in Web Worker
- **TLE Accuracy** — current data from CelesTrak
- **Period, Inclination, RAAN** — extracted from TLE
- **Footprint** — coverage zone calculation on Earth's surface

### 📡 Data Sources

| Source | Description |
|--------|-------------|
| **CelesTrak API** | Current TLE for all constellations |
| **Mock Data** | Offline fallback for development |
| **Backend API** | Optional: connection to backend server |
| **WebSocket (STOMP)** | Real-time updates (optional) |

### 🔍 Filtering & Search

- **Group Filter** — toggle constellations on/off
- **Orbit Type Filter** — LEO / MEO / GEO / HEO
- **Purpose Filter** — navigation, communications, earth-observation, scientific
- **Text Search** — search by name (ignores group filter)
- **Viewport Filter** — show only visible satellites
- **Display Limit** — configurable cap (default 500)

### 🌐 Constellation Comparison

- **Multi-select** — up to 4 constellations simultaneously
- **Statistics**: count, average altitude, average velocity, min/max altitude
- **Bottom Drawer** — collapsible panel below the map

### 📋 Satellite Detail Card

- Current position (lat / lon / alt / velocity)
- Orbital parameters (period, inclination, RAAN, eccentricity)
- Pass prediction (AOS / LOS / max elevation)
- Actions: center, orbit track, full track, coverage zone

### 🔔 Pass Prediction

- **Pass Predictor** — AOS/LOS/elevation calculation
- **Notification Toast** — alerts before upcoming passes
- **Observation Points** — up to 5 draggable ground points
- **Location Presets** — city presets (Moscow, Washington, Tokyo, etc.)

### ⚙️ Settings

- 🌐 Language toggle (RU / EN)
- 🎨 Map theme selector (4 themes)
- 📐 Display mode (2D / 3D-tilt / 3D-globe)
- 🔭 Coverage zone settings (boundary angles)
- 🌡️ Heatmap toggle
- 📏 Coordinate grid toggle
- ⏱️ Simulation timeline

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.2.0 |
| **Language** | TypeScript | 5.x |
| **UI** | React | 19.2.4 |
| **Styling** | Tailwind CSS | 4.x |
| **2D Map** | MapLibre GL + react-map-gl | 5.21 / 8.1 |
| **3D Globe** | React Three Fiber + Three.js | 9.5 / 0.183 |
| **State** | Zustand | 5.0.12 |
| **SGP4** | satellite.js | 6.0.2 |
| **Clustering** | supercluster | 8.0.1 |
| **Sun** | SunCalc | 1.9.0 |
| **WebSocket** | STOMP + SockJS | 7.3 / 1.6 |
| **i18n** | Built-in | — |

---

## Architecture

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
│               State Layer (Zustand)                           │
│                                                              │
│  useSatelliteStore   useMapStore   useCoverageStore         │
│  useSimulationStore                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Web Worker (SGP4 via satellite.js)               │
│                                                              │
│  satellite-worker.ts                                         │
│  Input:  Satellite[] + timestamp                              │
│  Output: SatellitePosition[] (lat/lon/alt/velocity)          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
CelesTrak API / Backend
        │
        ▼
getSatellites() → TLE parse → Satellite[]
        │
        ▼
useSatelliteStore.setSatellites()
        │
        ▼
satellite-worker.ts (SGP4 every second)
        │
        ▼
useSatelliteStore.updatePositions()
        │
        ▼
SatelliteMap → GeoJSON → MapLibre GL layers
```

---

## Installation

### Prerequisites

- **Node.js** 18+
- **npm** 9+ (or pnpm / yarn)
- Git

### Clone

```bash
git clone <repository-url>
cd satellite-tracker
```

### Install Dependencies

```bash
npm install
```

---

## Running the Project

### Development

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

> Hot reload is enabled. Web Worker changes require a full page reload.

### Production Build

```bash
# Build optimized bundle
npm run build

# Start production server
npm run start
```

### Docker

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Checks

```bash
# TypeScript type checking
npx tsc --noEmit

# ESLint linting
npm run lint
```

---

## Docker

The project includes a multi-stage Docker build for optimal image size.

### docker-compose Configuration

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

### Docker Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_USE_MOCK` | `true` | Use mock data / CelesTrak |
| `NEXT_PUBLIC_ENABLE_WS` | `false` | Enable WebSocket |

### Dockerfile Stages

1. **deps** — install dependencies
2. **builder** — build Next.js application
3. **runner** — production runtime

---

## Project Structure

```
satellite-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Main page
│   │
│   ├── components/
│   │   ├── map/
│   │   │   ├── SatelliteMap.tsx        # MapLibre GL map
│   │   │   ├── Globe3D.tsx             # 3D globe (R3F)
│   │   │   ├── GroundTrack.tsx         # Orbit track
│   │   │   ├── EnhancedCoverageZone.tsx# Coverage zone
│   │   │   ├── CoverageCone.tsx        # Visibility cone
│   │   │   ├── ClusterMarker.tsx       # Clusters
│   │   │   ├── SatelliteLinks.tsx       # Satellite chains
│   │   │   ├── CoordinateGrid.tsx      # Coordinate grid
│   │   │   ├── Terminator.tsx          # Terminator
│   │   │   └── ObservationPins.tsx     # Observation points
│   │   │
│   │   ├── ui/
│   │   │   ├── FilterPanel.tsx         # Left sidebar
│   │   │   ├── GroupSelector.tsx       # Group selection
│   │   │   ├── MapSettings.tsx         # Map settings
│   │   │   ├── CoverageSettings.tsx    # Coverage settings
│   │   │   ├── GroupComparisonTable.tsx# Comparison table
│   │   │   ├── ComparisonDrawer.tsx    # Comparison drawer
│   │   │   ├── NotificationToast.tsx    # Toast notifications
│   │   │   ├── AddPointButton.tsx      # Add point
│   │   │   ├── LocationPresets.tsx      # City presets
│   │   │   ├── PointsPanel.tsx          # Points panel
│   │   │   ├── SatelliteLimitSlider.tsx# Satellite limit
│   │   │   ├── Timeline.tsx             # Timeline
│   │   │   └── ZoomIndicator.tsx        # Zoom indicator
│   │   │
│   │   └── satellite/
│   │       ├── SatelliteCard.tsx        # Satellite card
│   │       └── PassList.tsx             # Pass list
│   │
│   ├── store/
│   │   ├── useSatelliteStore.ts        # Satellites, positions, filters
│   │   ├── useMapStore.ts               # Map state, themes
│   │   ├── useCoverageStore.ts          # Coverage settings
│   │   └── useSimulationStore.ts        # Timeline simulation
│   │
│   ├── lib/
│   │   ├── satellite-worker.ts          # Web Worker — SGP4
│   │   ├── celestrak.ts                 # CelesTrak API
│   │   ├── coverage-geometry.ts        # Footprint polygons
│   │   ├── unwrapCoordinates.ts         # Anti-meridian fix
│   │   ├── pass-predictor.ts            # AOS/LOS calculation
│   │   ├── pass-notifier.ts             # Pass notifications
│   │   ├── terminator.ts                # SunCalc terminator
│   │   ├── ws-client.ts                 # STOMP WebSocket
│   │   ├── api.ts                       # HTTP API wrapper
│   │   ├── mock-data.ts                 # Mock data
│   │   ├── viewport-filter.ts           # Viewport filter
│   │   ├── viewport-filter-3d.ts        # 3D viewport filter
│   │   ├── presets.ts                   # Point presets
│   │   └── i18n.ts                      # RU/EN translations
│   │
│   ├── hooks/
│   │   ├── useSupercluster.ts           # Clustering
│   │   ├── useGroupStats.ts             # Constellation stats
│   │   └── useStopMapPropagation.ts     # Click blocking
│   │
│   ├── types/
│   │   └── satellite.ts                 # TypeScript types
│   │
│   └── app/api/
│       ├── celestrak-proxy/             # CelesTrak proxy
│       └── proxy/                       # Universal proxy
│
├── public/                              # Static files
├── Dockerfile                           # Multi-stage build
├── docker-compose.yml                  # Docker Compose
├── next.config.ts                      # Next.js config
├── tailwind.config.ts                  # Tailwind CSS
├── tsconfig.json                      # TypeScript
└── package.json                       # Dependencies
```

---

## Key Modules

### `satellite-worker.ts`

Web Worker runs SGP4 propagation off the main thread.

```typescript
// Input message
{ type: 'CALCULATE', payload: { satellites: Satellite[], timestamp: number } }

// Output message
{ type: 'POSITIONS', payload: SatellitePosition[] }
```

### `unwrapCoordinates.ts`

Fixes anti-meridian crossing artifact.

```typescript
// Without fix: 170° → -170° (line across entire map)
// With fix:    170° → 190° (continuous longitude)
unwrapLongitudes(coords: [number, number][]): [number, number][]
splitIntoOrbits(coords, pointsPerOrbit): [number, number][][]
```

### `coverage-geometry.ts`

Calculates satellite ground footprint.

- Central angle formula: `ρ = arccos(R / (R + alt))`
- Gradient rings: inner / middle / outer zones
- GeoJSON FeatureCollection for MapLibre

### `pass-predictor.ts`

Predicts satellite pass over ground point.

- **AOS** (Acquisition of Signal) — appearance above horizon
- **LOS** (Loss of Signal) — disappearance below horizon
- **Max Elevation** — maximum elevation angle
- Calculation step: 60 seconds, window: 24 hours

### `celestrak.ts`

CelesTrak API integration for current TLE data.

---

## Configuration

### Adding a Constellation

In [`src/types/satellite.ts`](src/types/satellite.ts):

```typescript
export const GROUP_CONFIG: Record<SatelliteGroup, {...}> = {
  // Add new entry:
  oneweb: {
    name: "OneWeb",
    description: "OneWeb constellation",
    filter: { q: "ONEWEB" },
    icon: '🌐'
  },
}
```

### Adding a Map Theme

In [`src/store/useMapStore.ts`](src/store/useMapStore.ts):

```typescript
export const MAP_THEMES: Record<MapTheme, { label: string; tiles: string[] }> = {
  topo: {
    label: "Topographic",
    tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
  },
}
```

### Adding Translation

In [`src/lib/i18n.ts`](src/lib/i18n.ts):

```typescript
export const translations = {
  'my.new.key': {
    en: 'English text',
    ru: 'Русский текст',
  },
}
```

---

## Environment Variables

### `.env.local` file

Create a `.env.local` file in the project root:

```env
# ============================================
# Operation Mode
# ============================================

# Use mock data / CelesTrak (default: true)
NEXT_PUBLIC_USE_MOCK=true

# Enable WebSocket (default: false)
NEXT_PUBLIC_ENABLE_WS=false

# ============================================
# API URLs
# ============================================

# Backend API URL (default: http://localhost:8888)
NEXT_PUBLIC_API_URL=http://localhost:8888

# CelesTrak URL (default: https://celestrak.org)
NEXT_PUBLIC_CELESTRAK_URL=https://celestrak.org

# WebSocket URL (default: ws://localhost:8080/ws)
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# ============================================
# Limits
# ============================================

# Maximum satellites to load from CelesTrak (default: 200)
# Not recommended to set above 500 — browser may freeze
NEXT_PUBLIC_CELESTRAK_LIMIT=200
```

### Frontend-only Variables

All variables with `NEXT_PUBLIC_` prefix are available in the browser.

---

## Known Limitations

| Issue | Status |
|-------|--------|
| CelesTrak rate limiting on first load | Caching applied; reload if empty |
| TLE data becomes stale after ~2 weeks | Use 🔄 Refresh button |
| 3D globe doesn't show satellite markers | Planned |
| Coverage zone shows current position only | By design — updates every second |
| WebSocket requires backend | Optional; works without it |
| Pass prediction accuracy: ±1 min | 60-second calculation step |
| Limit of 5 observation points | UI technical limit |

---

## License

MIT © 2024

---

_Built with [satellite.js](https://github.com/shashwatak/satellite-js), [MapLibre GL](https://maplibre.org), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [CelesTrak](https://celestrak.org)_
