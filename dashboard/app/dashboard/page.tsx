'use client'

import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { FaucetButton } from '@/components/wallet/FaucetButton'

export default function DashboardPage() {
  const { address } = useAccount()
  const { balances, totalBalance, isLoading, refetch } = useTokenBalances()

  return (
    <div className="container py-8 px-4 sm:px-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Manage your stablecoin payments on Tempo.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-7 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  <>${totalBalance}</>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all tokens
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Payment</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-1">
                No payments yet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Testnet</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tempo testnet
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Token Balances */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Token Balances</CardTitle>
              <CardDescription>
                Your stablecoin holdings on Tempo testnet
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <FaucetButton />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="mr-2 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : balances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No token balances found</p>
                <p className="text-xs mt-2">Connected to: {address}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {balances.map((token) => (
                  <div 
                    key={token.address}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {token.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{token.symbol}</p>
                        <p className="text-xs text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {parseFloat(token.formatted).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">{token.symbol}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <CardTitle className="text-lg">Send Payment</CardTitle>
              <CardDescription>
                Transfer stablecoins to another wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/dashboard/send">Send</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <CardTitle className="text-lg">Receive</CardTitle>
              <CardDescription>
                Get your wallet address and QR code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/receive">Receive</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription>
                View all your past transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/transactions">View History</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

