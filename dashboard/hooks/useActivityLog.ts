'use client'

import { useEffect, useMemo, useState } from 'react'
import { readActivityLog, type ActivityLogEntry } from '@/lib/activityLog'

export function useActivityLog() {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])

  useEffect(() => {
    const sync = () => setEntries(readActivityLog())
    sync()

    // Cross-tab updates
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tempo.dashboard.activityLog.v1') sync()
    }

    // Same-tab updates via custom event
    const onCustom = () => sync()

    window.addEventListener('storage', onStorage)
    window.addEventListener('tempo:activityLog', onCustom as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('tempo:activityLog', onCustom as EventListener)
    }
  }, [])

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => b.createdAt - a.createdAt)
  }, [entries])

  return { entries: sorted }
}


