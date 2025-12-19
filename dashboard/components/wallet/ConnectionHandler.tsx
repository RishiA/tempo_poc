'use client'

import { useEffect } from 'react'
import { useAccount, useReconnect, useAccountEffect } from 'wagmi'
import { toast } from 'sonner'

/**
 * ConnectionHandler component manages wallet connection states and errors
 * - Handles reconnection on page refresh
 * - Monitors connection status changes
 * - Provides user feedback for connection issues
 */
export function ConnectionHandler() {
  const { isConnected, isConnecting, isReconnecting, address } = useAccount()
  const { reconnect } = useReconnect()

  // Attempt to reconnect on mount (restore session)
  useEffect(() => {
    reconnect()
  }, [reconnect])

  // Monitor account changes and connection events
  useAccountEffect({
    onConnect(data) {
      toast.success('Connected!', {
        description: `Address: ${data.address.slice(0, 6)}...${data.address.slice(-4)}`,
      })
    },
    onDisconnect() {
      toast.info('Disconnected', {
        description: 'You have been signed out',
      })
    },
  })

  // This component doesn't render anything
  return null
}

