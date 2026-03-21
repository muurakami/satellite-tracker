'use client'

import dynamic from 'next/dynamic'
import FilterPanel from '@/components/ui/FilterPanel'
import SatelliteCard from '@/components/satellite/SatelliteCard'
import PassList from '@/components/satellite/PassList'
import Timeline from '@/components/ui/Timeline'
import NotificationToast from '@/components/ui/NotificationToast'
import ZoomIndicator from '@/components/ui/ZoomIndicator'
import PointsPanel from '@/components/ui/PointsPanel'
import GroupComparisonTable from '@/components/ui/GroupComparisonTable'
import { useMapStore } from '@/store/useMapStore'
import { useState, useEffect } from 'react'

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
  const isFilterPanelCollapsed = useMapStore((s) => s.isFilterPanelCollapsed)

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Sidebar - outside pointer-events-none */}
      <div className={`absolute left-0 top-0 bottom-0 z-40 transition-all duration-300 ${isFilterPanelCollapsed ? 'w-12' : 'w-72'}`}>
        <FilterPanel />
      </div>
      
      {/* Map */}
      <div className={`absolute inset-0 transition-all duration-300 ${isFilterPanelCollapsed ? 'pl-12' : 'pl-72'}`}>
        {viewMode === '3d-globe' ? (
          <Globe3D orbitScale={orbitScale} />
        ) : (
          <SatelliteMap />
        )}
      </div>
      
      {/* Floating panels - inside pointer-events-none */}
      <div className="pointer-events-none absolute inset-0">
        <SatelliteCard />
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
