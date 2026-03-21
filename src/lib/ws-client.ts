import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { SatellitePosition, PassNotification } from '@/types/satellite'
import { useSatelliteStore } from '@/store/useSatelliteStore'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:8888/ws/satellites'
const WS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WS === 'true'

type NotificationCallback = (n: PassNotification) => void

/**
 * WebSocket client for real-time satellite position updates.
 * 
 * Controlled by NEXT_PUBLIC_ENABLE_WS environment variable:
 * - 'true': Connect to WebSocket server (when Java backend is ready)
 * - 'false' or undefined: Disabled, uses CelesTrak API and mock data instead
 * 
 * This prevents the "Cannot read properties of undefined (reading 'signal')" error
 * that occurs when SockJS tries to connect to a non-existent WebSocket server.
 */
class WsClient {
  private client: Client | null = null
  private notificationCallbacks: NotificationCallback[] = []
  private connected = false

  constructor() {
    // Don't create client in constructor - create on demand
  }

  private createClient(): void {
    if (this.client) return
    
    if (!WS_ENABLED) {
      console.log('[WS] WebSocket disabled by NEXT_PUBLIC_ENABLE_WS flag')
      return
    }
    
    console.log('[WS] Creating WebSocket client for:', WS_URL)
    
    try {
      this.client = new Client({
        webSocketFactory: () => {
          try {
            return new SockJS(WS_URL) as WebSocket
          } catch (error) {
            console.error('[WS] SockJS creation error:', error)
            throw error
          }
        },
        reconnectDelay: 5000,
        onConnect: () => {
          console.log('[WS] Connected to WebSocket server')
          this.connected = true
          
          if (!this.client) return
          
          this.client.subscribe('/topic/positions', (message) => {
            try {
              const positions = JSON.parse(message.body) as SatellitePosition[]
              useSatelliteStore.getState().updatePositions(positions)
            } catch (error) {
              console.error('[WS] Error parsing positions:', error)
            }
          })

          this.client.subscribe('/topic/notifications', (message) => {
            try {
              const notification = JSON.parse(message.body) as PassNotification
              for (const cb of this.notificationCallbacks) {
                cb(notification)
              }
            } catch (error) {
              console.error('[WS] Error parsing notification:', error)
            }
          })
        },
        onDisconnect: () => {
          console.log('[WS] Disconnected from WebSocket server')
          this.connected = false
        },
        onWebSocketError: (event) => {
          console.error('[WS] WebSocket error:', event)
        },
        onStompError: (frame) => {
          console.error('[WS] STOMP error:', frame)
        },
      })
    } catch (error) {
      console.error('[WS] Client creation error:', error)
      this.client = null
    }
  }

  connect(): void {
    // Skip on server side (SSR)
    if (typeof window === 'undefined') {
      console.log('[WS] Skipping WebSocket connection on server side')
      return
    }
    
    // Check feature flag
    if (!WS_ENABLED) {
      console.log('[WS] WebSocket disabled - using CelesTrak API and mock data')
      return
    }
    
    try {
      this.createClient()
      if (this.client) {
        console.log('[WS] Activating WebSocket client...')
        this.client.activate()
      }
    } catch (error) {
      console.error('[WS] Connect error:', error)
    }
  }

  disconnect(): void {
    if (this.client) {
      try {
        this.client.deactivate()
      } catch (error) {
        console.error('[WS] Disconnect error:', error)
      }
    }
  }

  subscribeToNotifications(cb: NotificationCallback): void {
    this.notificationCallbacks.push(cb)
  }

  isConnected(): boolean {
    return this.connected
  }
  
  /**
   * Check if WebSocket is enabled via environment variable
   */
  isEnabled(): boolean {
    return WS_ENABLED
  }
}

const wsClient = new WsClient()
export default wsClient
