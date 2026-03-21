import { calculatePasses } from './pass-predictor'
import { useSatelliteStore, type PassAlert } from '@/store/useSatelliteStore'
import { useMapStore } from '@/store/useMapStore'

export function startPassNotifier(): () => void {
  const checkPasses = () => {
    const { selectedSatellite, passAlerts, addPassAlert } = useSatelliteStore.getState()
    const selectedPoint = useMapStore.getState().selectedPoint

    if (!selectedSatellite || !selectedPoint) {
      return
    }

    // Calculate passes for next 2 hours
    const passes = calculatePasses(
      [selectedSatellite],
      selectedPoint.lat,
      selectedPoint.lon,
      2
    )

    const now = Date.now()

    for (const pass of passes) {
      const aosTime = new Date(pass.aos).getTime()
      const minutesUntil = Math.round((aosTime - now) / 60000)

      // Only alert for passes in next 15 minutes (but not already started)
      if (minutesUntil <= 15 && minutesUntil > 0) {
        // Check if alert already exists (avoid duplicates)
        const exists = passAlerts.some(
          (a) => a.satelliteId === pass.noradId && a.minutesUntil === minutesUntil
        )

        if (!exists) {
          const alert: PassAlert = {
            id: crypto.randomUUID(),
            satelliteId: pass.noradId,
            satelliteName: pass.name,
            aos: new Date(pass.aos),
            maxElevationDeg: pass.maxElevationDeg,
            minutesUntil,
            dismissed: false,
          }
          addPassAlert(alert)
        }
      }
    }
  }

  // Run immediately on start
  checkPasses()

  // Then run every 60 seconds
  const intervalId = setInterval(checkPasses, 60000)

  // Return cleanup function
  return () => clearInterval(intervalId)
}
