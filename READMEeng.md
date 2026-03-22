# 🛰️ Satellite Tracker

Real-time satellite tracking web application with 2D/3D visualization, orbital mechanics, pass prediction, and constellation comparison.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MapLibre](https://img.shields.io/badge/MapLibre-GL-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Key Modules](#key-modules)
- [Configuration](#configuration)
- [Known Limitations](#known-limitations)

---

## Overview

Satellite Tracker visualizes real-time positions of thousands of satellites using TLE (Two-Line Element) data from [CelesTrak](https://celestrak.org). Orbital mechanics are computed via the SGP4 algorithm in a Web Worker to keep the UI responsive. The app supports both 2D map and 3D globe views, ground track rendering, coverage zone visualization, pass prediction, and multi-constellation comparison.

---

## Features

### 🗺️ Map & Visualization

- **2D Map** — MapLibre GL with selectable themes (Dark, Light, Satellite, Terrain)
- **3D Globe** — React Three Fiber globe with atmospheric glow
- **Satellite markers** — color-coded by orbit type (LEO / MEO / GEO / HEO)
- **Clustering** — supercluster-based grouping at low zoom levels
- **Heatmap layer** — density visualization of satellite distribution
- **Terminator** — real-time day/night boundary via SunCalc
- **Coordinate grid** — toggleable graticule overlay

### 🛰️ Orbital Mechanics

- **SGP4 propagation** — via `satellite.js` in a dedicated Web Worker
- **Ground track** — polyline of upcoming orbit path (3 or 10 orbits)
- **Anti-meridian fix** — continuous longitude unwrapping (170° → 190° instead of 170° → -170°)
- **Coverage zone** — gradient footprint rings (inner / middle / outer) based on elevation angle

### 📡 Data

- **CelesTrak API** — live TLE data for GPS, GLONASS, Galileo, BeiDou, Starlink, ISS, Weather, and more
- **TLE file upload** — load custom `.tle` / `.txt` / `.3le` files
- **WebSocket** — real-time position updates via STOMP protocol
- **Mock data** — offline fallback for development

### 🔍 Filtering & Search

- **Group filter** — toggle constellations (GPS, GLONASS, Galileo, BeiDou, Starlink, etc.)
- **Orbit type filter** — LEO / MEO / GEO / HEO
- **Purpose filter** — navigation, communications, earth-observation, scientific
- **Text search** — search across all satellites by name (ignores group filter)
- **Viewport filter** — show only satellites in current map view
- **Performance mode** — limit rendered satellites (configurable cap, default 500)

### 🌐 Constellation Comparison

- **Multi-select** — choose up to 4 constellations
- **Stats table** — total count, active count, average altitude, average velocity, min/max altitude, Earth coverage %
- **Best-value highlighting** — green highlight for best metric per row
- **Bottom drawer** — collapsible panel below the map

### 📋 Satellite Detail Card

- Live position (lat / lon / alt / velocity)
- Orbital parameters (period, inclination, RAAN, eccentricity)
- Next pass prediction (AOS / LOS / max elevation) for selected observation point
- Actions: center on map, orbit track, full track (10 orbits), coverage zone toggle, satellite link (KSP-style chain)

### 🔔 Pass Prediction & Alerts

- **Pass predictor** — computes AOS / LOS / max elevation for a ground point
- **Notifications** — toast alerts before upcoming passes
- **Observation points** — draggable pins, location presets

### ⚙️ Settings

- Language toggle (RU / EN)
- Map theme selector
- Display mode (2D / 3D tilt / 3D globe)
- Coverage zone settings (gradient rings, min elevation angle)
- Heatmap toggle
- Coordinate grid toggle
- Simulation timeline (play/pause, speed control)

---

## Tech Stack

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| Framework    | Next.js 16 (App Router)           |
| Language     | TypeScript 5 (strict)             |
| Styling      | Tailwind CSS 3                    |
| 2D Map       | MapLibre GL + react-map-gl        |
| 3D Globe     | React Three Fiber + Three.js      |
| State        | Zustand                           |
| Orbital calc | satellite.js (SGP4) in Web Worker |
| Clustering   | supercluster                      |
| Sun position | SunCalc                           |
| Real-time    | STOMP over WebSocket              |
| Data source  | CelesTrak API                     |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│                                                      │
│  ┌──────────────┐         ┌───────────────────────┐ │
│  │  Left Sidebar │         │     Map Area          │ │
│  │  (FilterPanel)│         │                       │ │
│  │               │         │  ┌─────────────────┐  │ │
│  │  GroupSelector│         │  │  SatelliteMap   │  │ │
│  │  OrbitFilter  │         │  │  (MapLibre GL)  │  │ │
│  │  PurposeFilter│         │  │                 │  │ │
│  │  SearchInput  │         │  │  + GroundTrack  │  │ │
│  │  Settings     │         │  │  + Coverage     │  │ │
│  └──────────────┘         │  │  + Terminator   │  │ │
│                            │  │  + Grid         │  │ │
│                            │  └─────────────────┘  │ │
│                            │                       │ │
│                            │  ┌─────────────────┐  │ │
│                            │  │ ComparisonDrawer│  │ │
│                            │  └─────────────────┘  │ │
│                            └───────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  State Layer (Zustand)                │
│                                                      │
│  useSatelliteStore   useMapStore   useCoverageStore  │
│  useSimulationStore                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               Web Worker (SGP4)                      │
│                                                      │
│  satellite-worker.ts                                 │
│  Input:  Satellite[] + timestamp                     │
│  Output: SatellitePosition[] (lat/lon/alt/velocity)  │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
CelesTrak API
     │
     ▼
getSatellites() → TLE parse → Satellite[]
     │
     ▼
useSatelliteStore.setSatellites()
     │
     ▼
satellite-worker.ts (SGP4 every tick)
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

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/satellite-tracker.git
cd satellite-tracker

# Install dependencies
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
# Optional: WebSocket server URL for real-time updates
# Leave empty to use mock data / CelesTrak only
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# Optional: override CelesTrak base URL
NEXT_PUBLIC_CELESTRAK_URL=https://celestrak.org
```

> Without a WebSocket server the app works fully offline using CelesTrak HTTP API and SGP4 local computation.

---

## Running the Project

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Hot reload is enabled. Web Worker changes require a full page refresh.

### Production Build

```bash
# Build
npm run build

# Start production server
npm run start
```

### Type Check

```bash
# Check TypeScript without emitting files
npx tsc --noEmit
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
satellite-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main page — grid layout (sidebar + map)
│   │
│   ├── components/
│   │   ├── map/
│   │   │   ├── SatelliteMap.tsx        # Main MapLibre GL map
│   │   │   ├── Globe3D.tsx             # React Three Fiber 3D globe
│   │   │   ├── GroundTrack.tsx         # Orbit polyline with anti-meridian fix
│   │   │   ├── EnhancedCoverageZone.tsx# Gradient coverage footprint
│   │   │   ├── CoverageCone.tsx        # Simple coverage cone
│   │   │   ├── ClusterMarker.tsx       # Supercluster bubble markers
│   │   │   ├── SatelliteLinks.tsx      # KSP-style chain links
│   │   │   ├── CoordinateGrid.tsx      # Graticule overlay
│   │   │   ├── Terminator.tsx          # Day/night boundary
│   │   │   └── ObservationPins.tsx     # Draggable ground points
│   │   │
│   │   ├── ui/
│   │   │   ├── FilterPanel.tsx         # Left sidebar
│   │   │   ├── GroupSelector.tsx       # Constellation multi-select
│   │   │   ├── MapSettings.tsx         # Settings dropdown (⚙️)
│   │   │   ├── CoverageSettings.tsx    # Coverage zone settings
│   │   │   ├── GroupComparisonTable.tsx# Side-by-side stats table
│   │   │   ├── ComparisonDrawer.tsx    # Bottom drawer container
│   │   │   ├── NotificationToast.tsx   # Pass alert toasts
│   │   │   ├── AddPointButton.tsx      # Add observation point
│   │   │   └── LocationPresets.tsx     # Preset city locations
│   │   │
│   │   └── satellite/
│   │       └── SatelliteCard.tsx       # Selected satellite detail panel
│   │
│   ├── store/
│   │   ├── useSatelliteStore.ts        # Satellites, positions, filters, groups
│   │   ├── useMapStore.ts              # Map state, themes, viewport, locale
│   │   ├── useCoverageStore.ts         # Coverage zone settings
│   │   └── useSimulationStore.ts       # Timeline simulation
│   │
│   ├── lib/
│   │   ├── satellite-worker.ts         # Web Worker — SGP4 position calculation
│   │   ├── celestrak.ts                # CelesTrak API + TLE parser
│   │   ├── coverage-geometry.ts        # Footprint polygon generation
│   │   ├── unwrapCoordinates.ts        # Anti-meridian longitude fix
│   │   ├── pass-predictor.ts           # AOS/LOS/elevation calculator
│   │   ├── pass-notifier.ts            # Upcoming pass alert scheduler
│   │   ├── terminator.ts               # SunCalc day/night boundary
│   │   ├── ws-client.ts                # STOMP WebSocket client
│   │   ├── api.ts                      # HTTP API wrapper
│   │   ├── mock-data.ts                # Offline fallback data
│   │   ├── viewport-filter.ts          # Bounds-based satellite filter
│   │   └── i18n.ts                     # RU/EN translations
│   │
│   ├── hooks/
│   │   ├── useSupercluster.ts          # Clustering hook
│   │   ├── useGroupStats.ts            # Constellation aggregated stats
│   │   └── useStopMapPropagation.ts    # Prevent map click-through
│   │
│   └── types/
│       └── satellite.ts                # Core TypeScript types
│
├── public/
├── .env.local                          # Environment variables (create manually)
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Key Modules

### `satellite-worker.ts`

Web Worker that runs SGP4 propagation off the main thread.

- Input: `{ type: 'CALCULATE', payload: { satellites, timestamp } }`
- Output: `{ type: 'POSITIONS', payload: SatellitePosition[] }`
- Batches all satellites in a single `postMessage` to minimize IPC overhead

### `unwrapCoordinates.ts`

Fixes the anti-meridian crossing artifact in ground tracks.

```typescript
// Without fix: 170° → -170° → MapLibre draws line across entire map
// With fix:    170° → 190°  → continuous longitude, correct rendering
unwrapLongitudes(coords: [number, number][]): [number, number][]
splitIntoOrbits(coords, pointsPerOrbit): [number, number][][]
```

### `coverage-geometry.ts`

Computes satellite ground footprint as GeoJSON polygons.

- Uses Earth central angle formula: `ρ = arccos(R / (R + alt))`
- Generates 1–5 concentric rings (inner / middle / outer zones)
- Each ring is a separate GeoJSON Feature with `zone` property for MapLibre `case` expressions

### `pass-predictor.ts`

Predicts when a satellite will be visible from a ground point.

- Returns: `{ aos: Date, los: Date, maxElevationDeg: number }`
- Uses 60-second step propagation over a 24-hour window

### `celestrak.ts`

Fetches and parses TLE data from CelesTrak.

- Supports all major groups: GPS, GLONASS, Galileo, BeiDou, Starlink, ISS, Weather, Debris
- Parses period, inclination, RAAN, eccentricity directly from TLE lines

---

## Configuration

### Adding a new satellite group

In `src/types/satellite.ts`:

```typescript
export const GROUP_CONFIG = {
  // Add new entry:
  oneweb: {
    label: "OneWeb",
    filter: { q: "ONEWEB" },
    color: "#ff6600",
  },
};
```

### Adding a new map theme

In `src/store/useMapStore.ts`:

```typescript
export const MAP_THEMES = {
  // Add new entry:
  topo: {
    label: "Topographic",
    tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
  },
};
```

### Adding translations

In `src/lib/i18n.ts`:

```typescript
'my.new.key': {
  en: 'English text',
  ru: 'Русский текст',
},
```

---

## Known Limitations

| Issue                                                    | Status                               |
| -------------------------------------------------------- | ------------------------------------ |
| CelesTrak rate limiting on first load                    | Handled via caching; reload if empty |
| TLE data becomes stale after ~2 weeks                    | Use 🔄 Refresh button                |
| 3D globe lacks satellite markers (R3F layer)             | Planned                              |
| Coverage zone shows at satellite's current position only | By design — updates each tick        |
| WebSocket requires separate backend server               | Optional; app works without it       |
| Pass prediction accuracy: ±1 min                         | 60-second step resolution            |

---

## License

MIT © 2024

---

_Built with [satellite.js](https://github.com/shashwatak/satellite-js), [MapLibre GL](https://maplibre.org), [CelesTrak](https://celestrak.org)_
