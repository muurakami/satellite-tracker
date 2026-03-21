'use client'

import dynamic from 'next/dynamic'
import FilterPanel from '@/components/ui/FilterPanel'
import SatelliteCard from '@/components/satellite/SatelliteCard'
import PassList from '@/components/satellite/PassList'
import Timeline from '@/components/ui/Timeline'
import NotificationToast from '@/components/ui/NotificationToast'
import MapSettings from '@/components/ui/MapSettings'
import ZoomIndicator from '@/components/ui/ZoomIndicator'
import PointsPanel from '@/components/ui/PointsPanel'
import GroupComparisonTable from '@/components/ui/GroupComparisonTable'
import { useMapStore } from '@/store/useMapStore'

const SatelliteMap = dynamic(
  () => import('@/components/map/SatelliteMap'),
  { ssr: false }
)

const Globe3D = dynamic(
  () => import('@/components/map/Globe3D'),
  { ssr: false }
)

export default function Home() {
  const viewMode = useMapStore((s) => s.viewMode)
  const orbitScale = useMapStore((s) => s.orbitScale)

  return (
    <main className="relative w-full h-screen">
      {viewMode === '3d-globe' ? (
        <Globe3D orbitScale={orbitScale} />
      ) : (
        <SatelliteMap />
      )}
      <div className="pointer-events-none absolute inset-0">
        <FilterPanel />
        <SatelliteCard />
        <MapSettings />
        <PassList />
        <PointsPanel />
        <Timeline />
        <NotificationToast />
        <ZoomIndicator />
        <GroupComparisonTable />
      </div>
    </main>
  )
}
