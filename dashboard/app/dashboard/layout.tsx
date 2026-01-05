'use client'

import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { ConnectionHandler } from '@/components/wallet/ConnectionHandler'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isConnected, isConnecting } = useAccount()
  const router = useRouter()

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.push('/')
    }
  }, [isConnected, isConnecting, router])

  // Show loading while checking connection
  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not connected
  if (!isConnected) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ConnectionHandler />
      <Navbar />
      <main className="flex-1 pb-24 sm:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}

