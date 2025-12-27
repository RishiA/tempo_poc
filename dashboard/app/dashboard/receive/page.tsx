'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useBalancePolling } from '@/hooks/useBalancePolling'
import { useTransactions } from '@/hooks/useTransactions'
import { toast } from 'sonner'
import { EXPLORER_URL } from '@/lib/constants'

export default function ReceivePage() {
  const { address } = useAccount()
  const { balances, isPolling } = useBalancePolling(10000, true)
  const { data: txData } = useTransactions(1) // Last 1 day for recent transactions
  const [showFullAddress, setShowFullAddress] = useState(false)

  const handleCopy = async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      toast.success('Address copied!', {
        description: 'Wallet address copied to clipboard',
      })
    } catch (err) {
      toast.error('Failed to copy', {
        description: 'Please copy manually',
      })
    }
  }

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  
  // Get recent received transactions
  const recentReceived = txData?.transfers
    ?.filter(tx => tx.direction === 'received')
    ?.slice(0, 5) ?? []

  if (!address) {
    return (
      <div className="container py-8 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Connect your wallet to receive payments</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receive Payment</h1>
          <p className="text-muted-foreground mt-2">
            Share your wallet address to receive stablecoins
          </p>
        </div>

        {/* QR Code and Address */}
        <Card>
          <CardHeader>
            <CardTitle>Your Wallet Address</CardTitle>
            <CardDescription>
              Scan the QR code or copy the address below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center p-6 bg-white rounded-lg">
              <QRCodeSVG
                value={address}
                size={256}
                level="M"
                includeMargin={true}
              />
            </div>

            {/* Address Display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="font-mono text-sm break-all">
                    {showFullAddress ? address : shortAddress}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullAddress(!showFullAddress)}
                  >
                    {showFullAddress ? 'Collapse' : 'Expand'}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCopy}
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </Button>
                </div>
              </div>

              {/* Polling Indicator */}
              {isPolling && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Watching for incoming payments...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Current Balances</CardTitle>
            <CardDescription>
              Your available tokens for transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {balances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No token balances found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {balances.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        {token.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{token.symbol}</p>
                        <p className="text-xs text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
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

        {/* Recent Received Transactions */}
        {recentReceived.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Received</CardTitle>
              <CardDescription>
                Last 5 incoming payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReceived.map((tx) => (
                  <div
                    key={`${tx.hash}-${tx.logIndex}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="font-medium text-sm">
                          {parseFloat(tx.amount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })} {tx.tokenSymbol}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}</span>
                        <span>•</span>
                        <span>{new Date(tx.timestamp * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`${EXPLORER_URL}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">How to receive payments</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Share your QR code or wallet address with the sender. This page will automatically detect when you receive tokens and show a notification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
