export type ActivityKind =
  | 'send_payment'
  | 'faucet_fund'
  | 'set_fee_token'

export type ActivityLogEntry = {
  kind: ActivityKind
  hash: `0x${string}`
  createdAt: number // unix ms
  chainId: number
  // Optional metadata for display
  title?: string
  details?: string
}

const STORAGE_KEY = 'tempo.dashboard.activityLog.v1'

function safeParse(raw: string | null): ActivityLogEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as ActivityLogEntry[]
  } catch {
    return []
  }
}

export function readActivityLog(): ActivityLogEntry[] {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

export function writeActivityLog(entries: ActivityLogEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  // Notify listeners in this tab as well
  window.dispatchEvent(new Event('tempo:activityLog'))
}

export function recordActivity(entry: ActivityLogEntry) {
  if (typeof window === 'undefined') return
  const existing = readActivityLog()

  // De-dupe by hash+kind (keep latest)
  const filtered = existing.filter((e) => !(e.hash === entry.hash && e.kind === entry.kind))
  const next = [entry, ...filtered].slice(0, 200) // cap for POC
  writeActivityLog(next)
}

export function clearActivityLog() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('tempo:activityLog'))
}


