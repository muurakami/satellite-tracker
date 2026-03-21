'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Line } from '@react-three/drei'
import * as THREE from 'three'
import { useSatelliteStore } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'
import type { OrbitType, SatellitePosition, Satellite } from '@/types/satellite'
import SatelliteLinks3D from './SatelliteLinks3D'

const EARTH_RADIUS = 1.0
const ORBIT_COLORS: Record<OrbitType, string> = {
  LEO: '#00ff88',
  MEO: '#ffaa00',
  GEO: '#ff4466',
  HEO: '#aa88ff',
}

interface SatelliteMarkerProps {
  position: SatellitePosition
  orbitType: OrbitType
  isSelected: boolean
  selectedColor: string
  orbitScale: number
  onClick: () => void
}

function latLonAltToXYZ(
  lat: number,
  lon: number,
  altKm: number,
  orbitScale: number
): [number, number, number] {
  const scaledAlt = (altKm / 6371) * orbitScale
  const r = EARTH_RADIUS + scaledAlt

  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)

  const x = -r * Math.sin(phi) * Math.cos(theta)
  const y = r * Math.cos(phi)
  const z = r * Math.sin(phi) * Math.sin(theta)

  return [x, y, z]
}

function SatelliteMarker({
  position,
  orbitType,
  isSelected,
  selectedColor,
  orbitScale,
  onClick,
}: SatelliteMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Update position every frame using ref (no re-render)
  useFrame(() => {
    if (!meshRef.current) return
    const [x, y, z] = latLonAltToXYZ(
      position.lat,
      position.lon,
      position.alt,
      orbitScale
    )
    meshRef.current.position.set(x, y, z)
  })

  const color = isSelected ? selectedColor : ORBIT_COLORS[orbitType]
  const size = isSelected ? 0.025 : 0.015

  return (
    <mesh
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} />
      {isSelected && (
        <mesh>
          <sphereGeometry args={[size * 2.5, 8, 8]} />
          <meshBasicMaterial
            color={selectedColor}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}
    </mesh>
  )
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
      (tex) => setTexture(tex),
      undefined,
      () => {
        setTexture(null)
      }
    )
  }, [])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0001
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      {texture ? (
        <meshPhongMaterial map={texture} />
      ) : (
        <meshPhongMaterial color="#1a4a8a" />
      )}
    </mesh>
  )
}

function AtmosphereGlow() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS * 1.02, 32, 32]} />
      <meshBasicMaterial
        color="#4488ff"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

// Orbit line component — receives all data as props
interface OrbitLineProps {
  orbitScale: number
  color: string
  position: SatellitePosition
  inclinationDeg: number
  raan: number
}

function OrbitLine({ orbitScale, color, position, inclinationDeg, raan }: OrbitLineProps) {
  const points = useMemo<[number, number, number][]>(() => {
    try {
      const alt = position.alt
      if (!isFinite(alt) || alt <= 0) return []

      const numPoints = 120
      const orbitPoints: [number, number, number][] = []

      const incRad = (inclinationDeg * Math.PI) / 180
      const raanRad = (raan * Math.PI) / 180

      const scaledAlt = (alt / 6371) * orbitScale
      const r = EARTH_RADIUS + scaledAlt

      const cosI = Math.cos(incRad)
      const sinI = Math.sin(incRad)
      const cosR = Math.cos(raanRad)
      const sinR = Math.sin(raanRad)

      for (let i = 0; i <= numPoints; i++) {
        const u = (i / numPoints) * Math.PI * 2

        const xOrb = r * Math.cos(u)
        const yOrb = r * Math.sin(u)

        const x1 = xOrb
        const y1 = yOrb * cosI
        const z1 = yOrb * sinI

        const x = x1 * cosR - y1 * sinR
        const y = x1 * sinR + y1 * cosR
        const z = z1

        if (isFinite(x) && isFinite(y) && isFinite(z)) {
          orbitPoints.push([-x, z, y])
        }
      }

      return orbitPoints
    } catch {
      return []
    }
  }, [position.alt, inclinationDeg, raan, orbitScale])

  if (points.length < 2) return null

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.5}
    />
  )
}

interface SceneProps {
  orbitScale: number
}

function Scene({ orbitScale }: SceneProps) {
  const satellites = useSatelliteStore((s) => s.satellites)
  const positions = useSatelliteStore((s) => s.positions)
  const filteredByGroups = useSatelliteStore((s) => s.filteredByGroups)
  const activeGroups = useSatelliteStore((s) => s.activeGroups)
  const filters = useSatelliteStore((s) => s.filters)
  const selectedSatellite = useSatelliteStore((s) => s.selectedSatellite)
  const selectSatellite = useSatelliteStore((s) => s.selectSatellite)
  const selectedSatelliteColor = useMapStore((s) => s.selectedSatelliteColor)
  const showHeatmap = useMapStore((s) => s.showHeatmap)
  const performanceMode = useSatelliteStore((s) => s.performanceMode)
  const performanceLimit = useSatelliteStore((s) => s.performanceLimit)

  // Memoize group filtering — does NOT depend on positions
  const groupFiltered = useMemo(
    () => filteredByGroups(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [satellites, activeGroups, filters]
  )

  // Apply performance mode limit EARLY
  const filtered = useMemo(() => {
    if (!performanceMode) return groupFiltered
    const limit = performanceLimit
    const result: Satellite[] = []
    // Always include selected satellite
    if (selectedSatellite) {
      const sel = groupFiltered.find(s => s.noradId === selectedSatellite.noradId)
      if (sel) result.push(sel)
    }
    for (const sat of groupFiltered) {
      if (result.length >= limit) break
      if (sat.noradId !== selectedSatellite?.noradId) {
        result.push(sat)
      }
    }
    return result
  }, [groupFiltered, performanceMode, performanceLimit, selectedSatellite])

  // Group satellites by orbit type for heatmap visualization
  const satellitesByOrbit = useMemo(() => {
    const groups: Record<OrbitType, Satellite[]> = { LEO: [], MEO: [], GEO: [], HEO: [] }
    filtered.forEach(sat => {
      groups[sat.orbitType].push(sat)
    })
    return groups
  }, [filtered])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />

      {/* Stars background */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
      />

      {/* Earth */}
      <Earth />
      <AtmosphereGlow />

      {/* Heatmap visualization - density clouds per orbit type */}
      {showHeatmap && (
        <>
          {Object.entries(satellitesByOrbit).map(([orbitType, sats]) => (
            <group key={orbitType}>
              {sats.map((sat) => {
                const pos = positions.get(sat.noradId)
                if (!pos) return null
                const [x, y, z] = latLonAltToXYZ(pos.lat, pos.lon, pos.alt, orbitScale)
                return (
                  <mesh key={sat.noradId} position={[x, y, z]}>
                    <sphereGeometry args={[0.02, 4, 4]} />
                    <meshBasicMaterial
                      color={ORBIT_COLORS[orbitType as OrbitType]}
                      transparent
                      opacity={0.15}
                    />
                  </mesh>
                )
              })}
            </group>
          ))}
        </>
      )}

      {/* Satellite markers */}
      {filtered.map((sat) => {
        const pos = positions.get(sat.noradId)
        if (!pos) return null
        const isSelected = selectedSatellite?.noradId === sat.noradId
        return (
          <SatelliteMarker
            key={sat.noradId}
            position={pos}
            orbitType={sat.orbitType}
            isSelected={isSelected}
            selectedColor={selectedSatelliteColor}
            orbitScale={orbitScale}
            onClick={() => selectSatellite(sat)}
          />
        )
      })}

      {/* Orbit line for selected satellite */}
      {selectedSatellite && (() => {
        const pos = positions.get(selectedSatellite.noradId)
        if (!pos) return null
        const inclinationDeg = selectedSatellite.inclinationDeg ?? 51.6
        const raanVal = selectedSatellite.raan ?? 0
        return (
          <OrbitLine
            key={`orbit-${selectedSatellite.noradId}`}
            orbitScale={orbitScale}
            color={ORBIT_COLORS[selectedSatellite.orbitType]}
            position={pos}
            inclinationDeg={inclinationDeg}
            raan={raanVal}
          />
        )
      })()}

      {/* Satellite links (KSP-style) */}
      <SatelliteLinks3D orbitScale={orbitScale} />
    </>
  )
}

interface Globe3DProps {
  orbitScale?: number
}

export default function Globe3D({ orbitScale = 3 }: Globe3DProps) {
  return (
    <div className="w-full h-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Scene orbitScale={orbitScale} />
        <OrbitControls
          enablePan={false}
          minDistance={1.5}
          maxDistance={10}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}
