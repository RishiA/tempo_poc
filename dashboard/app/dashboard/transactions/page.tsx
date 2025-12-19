'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTransactions } from '@/hooks/useTransactions'
import { useActivityLog } from '@/hooks/useActivityLog'
import { EXPLORER_URL } from '@/lib/constants'

export default function TransactionsPage() {
  const [tab, setTab] = useState<'payments' | 'activity'>('payments')
  const [query, setQuery] = useState('')
  const [direction, setDirection] = useState<'all' | 'sent' | 'received'>('all')
  const [token, setToken] = useState<'all' | string>('all')

  const { data, isLoading, error, refetch, isFetching } = useTransactions(7)
  const { entries: activityEntries } = useActivityLog()

  const transfers = data?.transfers ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transfers.filter((t) => {
      if (direction !== 'all' && t.direction !== direction) return false
      if (token !== 'all' && t.tokenAddress.toLowerCase() !== token.toLowerCase()) return false

      if (!q) return true
      return (
        t.hash.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q)
      )
    })
  }, [transfers, query, direction, token])

  const uniqueTokens = useMemo(() => {
    const map = new Map<string, { address: string; symbol: string }>()
    for (const t of transfers) {
      map.set(t.tokenAddress.toLowerCase(), { address: t.tokenAddress, symbol: t.tokenSymbol })
    }
    return Array.from(map.values()).sort((a, b) => a.symbol.localeCompare(b.symbol))
  }, [transfers])

  const short = (v: string) => `${v.slice(0, 6)}…${v.slice(-4)}`

  return (
    <div className="container py-8 px-4 sm:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground mt-2">
            View all your past transactions
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Last 7 days. Click “View receipt” to see the canonical on-chain details.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Tabs */}
              <div className="inline-flex rounded-lg border bg-muted/30 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setTab('payments')}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    tab === 'payments' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Payments
                </button>
                <button
                  type="button"
                  onClick={() => setTab('activity')}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    tab === 'activity' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Other activity
                </button>
              </div>

              {/* Filters */}
              {tab === 'payments' && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    placeholder="Search by hash or address…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="sm:w-[320px]"
                  />
                  <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
                    <SelectTrigger className="sm:w-[160px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={token} onValueChange={(v) => setToken(v)}>
                    <SelectTrigger className="sm:w-[180px]">
                      <SelectValue placeholder="Token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tokens</SelectItem>
                      {uniqueTokens.map((t) => (
                        <SelectItem key={t.address} value={t.address}>
                          {t.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {tab === 'activity' ? (
              activityEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <svg className="h-14 w-14 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="max-w-md mx-auto">
                    No dashboard activity yet. Try funding from the faucet or sending a payment, then come back here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left font-medium py-3 pr-4">Action</th>
                        <th className="text-left font-medium py-3 pr-4">Details</th>
                        <th className="text-left font-medium py-3 pr-4">Date</th>
                        <th className="text-right font-medium py-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityEntries.map((a) => {
                        const dt = new Date(a.createdAt)
                        return (
                          <tr key={`${a.kind}-${a.hash}`} className="border-b last:border-b-0">
                            <td className="py-3 pr-4">
                              <div className="font-medium">{a.title ?? a.kind}</div>
                              <div className="text-xs text-muted-foreground font-mono">{short(a.hash)}</div>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">{a.details ?? '—'}</td>
                            <td className="py-3 pr-4">
                              <div className="font-medium">{dt.toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">{dt.toLocaleTimeString()}</div>
                            </td>
                            <td className="py-3 text-right">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`${EXPLORER_URL}/tx/${a.hash}`} target="_blank">
                                  View receipt
                                </Link>
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <>
                {isLoading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading transactions…</div>
                ) : error ? (
                  <div className="py-10 text-center text-muted-foreground">
                    Failed to load transactions: {String((error as Error).message || error)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    No transactions found for the selected filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left font-medium py-3 pr-4">Type</th>
                          <th className="text-left font-medium py-3 pr-4">Amount</th>
                          <th className="text-left font-medium py-3 pr-4">Counterparty</th>
                          <th className="text-left font-medium py-3 pr-4">Date</th>
                          <th className="text-right font-medium py-3">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((t) => {
                          const counterparty = t.direction === 'sent' ? t.to : t.from
                          const dt = t.timestamp ? new Date(t.timestamp * 1000) : null
                          return (
                            <tr key={`${t.hash}-${t.logIndex}`} className="border-b last:border-b-0">
                              <td className="py-3 pr-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                                  t.direction === 'sent'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                }`}>
                                  {t.direction === 'sent' ? 'Sent' : 'Received'}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="font-medium">
                                  {Number(t.amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {t.tokenSymbol}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {short(t.hash)}
                                </div>
                              </td>
                              <td className="py-3 pr-4">
                                <div className="font-mono">{short(counterparty)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {t.direction === 'sent' ? 'To' : 'From'}
                                </div>
                              </td>
                              <td className="py-3 pr-4">
                                {dt ? (
                                  <>
                                    <div className="font-medium">{dt.toLocaleDateString()}</div>
                                    <div className="text-xs text-muted-foreground">{dt.toLocaleTimeString()}</div>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <Button asChild variant="outline" size="sm">
                                  <Link href={`${EXPLORER_URL}/tx/${t.hash}`} target="_blank">
                                    View receipt
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

