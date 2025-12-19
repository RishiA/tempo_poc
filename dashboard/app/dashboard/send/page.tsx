'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { parseUnits, stringToHex, pad } from 'viem'
import { Hooks } from 'tempo.ts/wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { EXPLORER_URL } from '@/lib/constants'
import { toast } from 'sonner'
import Link from 'next/link'
import { recordActivity } from '@/lib/activityLog'
import { TEMPO_TESTNET } from '@/lib/constants'

export default function SendPaymentPage() {
  const { address } = useAccount()
  const { balances, refetch: refetchBalances } = useTokenBalances()
  
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState('')
  const [feeToken, setFeeToken] = useState('')
  const [memo, setMemo] = useState('')
  const [didRetryWithoutMemo, setDidRetryWithoutMemo] = useState(false)
  const [successData, setSuccessData] = useState<{
    txHash: string
    amount: string
    token: string
    recipient: string
    memo?: string
  } | null>(null)

  // Use Tempo.ts hook for WebAuthn-compatible transfers
  const sendPayment = Hooks.token.useTransferSync()

  const selectedTokenData = balances.find(t => t.address === selectedToken)
  const feeTokenData = balances.find(t => t.address === feeToken)

  // Default fee token to "same as send token" unless the user has explicitly chosen otherwise.
  useEffect(() => {
    if (!selectedToken) return
    if (!feeToken || feeToken === selectedToken) {
      setFeeToken(selectedToken)
    }
  }, [selectedToken]) // intentionally not depending on feeToken to avoid loops

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedToken || !feeToken || !recipient || !amount) {
      toast.error('Missing fields', {
        description: 'Please fill in all fields',
      })
      return
    }

    if (!selectedTokenData) {
      toast.error('Invalid token', {
        description: 'Please select a valid token',
      })
      return
    }

    if (!feeTokenData) {
      toast.error('Invalid fee token', {
        description: 'Please select a valid fee token',
      })
      return
    }

    // Validate recipient address
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      toast.error('Invalid address', {
        description: 'Please enter a valid Ethereum address',
      })
      return
    }

    // Parse amount to token units
    const amountInUnits = parseUnits(amount, selectedTokenData.decimals)

    // Check if user has enough balance
    const balance = BigInt(selectedTokenData.balance)
    if (amountInUnits > balance) {
      toast.error('Insufficient balance', {
        description: `You only have ${selectedTokenData.formatted} ${selectedTokenData.symbol}`,
      })
      return
    }

    // Soft check: fee token should have some balance (exact gas cost varies)
    if (BigInt(feeTokenData.balance) === 0n) {
      toast.warning('Fee token balance is zero', {
        description: `Fees will be charged in ${feeTokenData.symbol}. Fund it first or switch fee token.`,
        duration: 7000,
      })
    }

    toast.info('Confirm transaction', {
      description: 'Please approve the transaction with your passkey',
    })

    // Prepare memo if provided (32-byte hex string)
    const memoHex = memo ? pad(stringToHex(memo), { size: 32 }) : undefined

    // Clear previous success
    setSuccessData(null)

    // Use Tempo.ts hook - supports WebAuthn signatures!
    setDidRetryWithoutMemo(false)
    sendPayment.mutate({
      amount: amountInUnits,
      to: recipient as `0x${string}`,
      token: selectedToken as `0x${string}`,
      feeToken: feeToken as `0x${string}`,
      memo: memoHex,
    })
  }

  const handleCopyTxHash = () => {
    if (successData?.txHash) {
      navigator.clipboard.writeText(successData.txHash)
      toast.success('Copied!', {
        description: 'Transaction hash copied to clipboard',
      })
    }
  }

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Handle success
  useEffect(() => {
    if (sendPayment.isSuccess && sendPayment.data) {
      const txHash = sendPayment.data.receipt.transactionHash

      // Store success data for prominent display
      setSuccessData({
        txHash,
        amount,
        token: selectedTokenData?.symbol || '',
        recipient,
        memo,
      })

      // Also show toast
      toast.success('Payment sent!', {
        description: 'Transaction confirmed',
        duration: 5000,
      })

      // Record activity (for the "Other activity" tab)
      recordActivity({
        kind: 'send_payment',
        hash: txHash,
        createdAt: Date.now(),
        chainId: TEMPO_TESTNET.id,
        title: 'Send payment',
        details: `${parseFloat(amount).toLocaleString()} ${selectedTokenData?.symbol || ''} → ${recipient}`,
      })

      // Reset form
      setRecipient('')
      setAmount('')
      setSelectedToken('')
      setFeeToken('')
      setMemo('')
      setDidRetryWithoutMemo(false)
      
      // Refresh balances
      refetchBalances()
      
      // Reset mutation state
      sendPayment.reset()
    }
  }, [sendPayment.isSuccess, sendPayment.data, refetchBalances, sendPayment, amount, selectedTokenData, recipient, memo])

  // Handle errors
  useEffect(() => {
    if (sendPayment.error) {
      console.error('Send error:', sendPayment.error)

      const message = sendPayment.error.message || ''
      const isWebAuthnSignatureMismatch =
        message.includes('Unsupported signature type') &&
        message.includes('Expected `secp256k1`') &&
        message.includes('got `webAuthn`')

      // If memo transfers aren't supported in the current client stack, retry without memo.
      if (memo && !didRetryWithoutMemo && isWebAuthnSignatureMismatch) {
        setDidRetryWithoutMemo(true)
        toast.warning('Memo not supported yet', {
          description: 'Retrying the transfer without the memo so your payment can still be sent.',
          duration: 7000,
        })

        sendPayment.mutate({
          amount: parseUnits(amount, selectedTokenData?.decimals ?? 18),
          to: recipient as `0x${string}`,
          token: selectedToken as `0x${string}`,
          feeToken: feeToken as `0x${string}`,
          memo: undefined,
        })
        return
      }

      toast.error('Transaction failed', {
        description: message || 'Failed to send payment',
      })
    }
  }, [
    sendPayment,
    sendPayment.error,
    memo,
    didRetryWithoutMemo,
    amount,
    recipient,
    selectedToken,
    selectedTokenData?.decimals,
  ])

  return (
    <div className="container max-w-7xl py-8 px-4 sm:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Send Payment</h1>
        <p className="text-muted-foreground mt-2">
          Transfer stablecoins to another wallet
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Success Message Card */}
          {successData && (
            <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/30 animate-in fade-in slide-in-from-top-4 duration-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Payment Sent Successfully!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {parseFloat(successData.amount).toLocaleString()} {successData.token} sent to{' '}
                      <span className="font-mono">{shortenAddress(successData.recipient)}</span>
                    </p>
                    {successData.memo && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Memo: {successData.memo}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href={`${EXPLORER_URL}/tx/${successData.txHash}`} target="_blank">
                          <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View on Explorer
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopyTxHash}>
                        <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy TX Hash
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Enter the recipient address, amount, and token to send
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-6">
                {/* Token Selection */}
                <div className="space-y-2">
                  <Label htmlFor="token">Token</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger id="token">
                      <SelectValue placeholder="Select a token" />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center justify-between w-full">
                            <span>{token.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-4">
                              Balance: {parseFloat(token.formatted).toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTokenData && (
                    <p className="text-xs text-muted-foreground">
                      Available: {parseFloat(selectedTokenData.formatted).toLocaleString()} {selectedTokenData.symbol}
                    </p>
                  )}
                </div>

                {/* Fee Token Selection */}
                <div className="space-y-2">
                  <Label htmlFor="feeToken">Fee Token</Label>
                  <Select value={feeToken} onValueChange={setFeeToken} disabled={!selectedToken}>
                    <SelectTrigger id="feeToken">
                      <SelectValue placeholder={selectedToken ? "Select a fee token" : "Select a token first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {token.symbol}
                              {selectedToken && token.address === selectedToken ? (
                                <span className="ml-2 text-xs text-muted-foreground">(same as send token)</span>
                              ) : null}
                            </span>
                            <span className="text-xs text-muted-foreground ml-4">
                              Balance: {parseFloat(token.formatted).toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {feeTokenData ? (
                    <p className="text-xs text-muted-foreground">
                      Fees will be charged in {feeTokenData.symbol}. Balance: {parseFloat(feeTokenData.formatted).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Tempo lets you pay gas fees in any supported stablecoin.
                    </p>
                  )}
                </div>

                {/* Fee Preview */}
                {(selectedTokenData || feeTokenData || amount) && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-md bg-background border flex items-center justify-center">
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Fee preview</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          You’re sending{' '}
                          <span className="font-medium">
                            {amount ? parseFloat(amount).toLocaleString() : '—'} {selectedTokenData?.symbol || 'token'}
                          </span>
                          . Gas will be charged in{' '}
                          <span className="font-medium">{feeTokenData?.symbol || 'your selected fee token'}</span>.
                          Estimated network fee is ~<span className="font-medium">0.001</span> (exact amount shown after confirmation).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recipient Address */}
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    type="text"
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the wallet address to send tokens to
                  </p>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pr-20"
                    />
                    {selectedTokenData && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {selectedTokenData.symbol}
                      </div>
                    )}
                  </div>
                  {selectedTokenData && amount && (
                    <p className="text-xs text-muted-foreground">
                      ≈ ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                  )}
                </div>

                {/* Quick Amount Buttons */}
                {selectedTokenData && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount((parseFloat(selectedTokenData.formatted) * 0.25).toString())}
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount((parseFloat(selectedTokenData.formatted) * 0.5).toString())}
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount((parseFloat(selectedTokenData.formatted) * 0.75).toString())}
                    >
                      75%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(selectedTokenData.formatted)}
                    >
                      Max
                    </Button>
                  </div>
                )}

                {/* Memo (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="memo">Memo (Optional)</Label>
                  <Input
                    id="memo"
                    type="text"
                    placeholder="Invoice #12345, Order ID, etc."
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    maxLength={31}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add a memo for payment tracking and reconciliation (max 31 characters)
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={sendPayment.isPending || !recipient || !amount || !selectedToken || !feeToken}
                >
                  {sendPayment.isPending ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Payment
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info Cards (1/3 width) */}
        <div className="space-y-6">
          {/* Gas Fees Card */}
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Gas Fees</p>
                  <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
                    Tempo supports paying gas in stablecoins. Pick a fee token in the form; the exact fee shows after confirmation (typically ~$0.001).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Memos Card */}
          <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-green-900 dark:text-green-100">Payment Memos</p>
                  <p className="text-green-700 dark:text-green-300 text-xs leading-relaxed">
                    Add memos for invoice tracking, order IDs, or payment references - stored on-chain for reconciliation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
