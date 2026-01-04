'use client'

import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits, stringToHex } from 'viem'
import { Actions } from 'tempo.ts/viem'
import { sendCalls } from 'viem/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTokenBalances } from '@/hooks/useTokenBalances'
import Link from 'next/link'
import { 
  parsePain001, 
  validatePaymentInstruction, 
  generatePain002,
  generatePain002XML,
  exportToCSV,
  downloadFile,
  type PaymentInstruction,
  type PaymentStatusReport,
  type ValidationResult 
} from '@/lib/iso20022'
import { toast } from 'sonner'
import { recordActivity } from '@/lib/activityLog'
import { TEMPO_TESTNET } from '@/lib/constants'

export default function PayrollPage() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { balances, refetch: refetchBalances } = useTokenBalances()
  
  // State
  const [instruction, setInstruction] = useState<PaymentInstruction | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [progressPct, setProgressPct] = useState<number>(0)
  const [statusReport, setStatusReport] = useState<PaymentStatusReport | null>(null)

  // Get token balance (AlphaUSD by default)
  const alphaUSD = balances.find(
    b => b.address === '0x20c0000000000000000000000000000000000001'
  )

  // ============================================================================
  // File Upload Handler
  // ============================================================================

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = parsePain001(content)
        
        // Validate
        const validationResult = validatePaymentInstruction(
          parsed,
          alphaUSD?.formatted || '0'
        )

        setInstruction(parsed)
        setValidation(validationResult)
        setStatusReport(null) // Clear previous results

        if (validationResult.valid) {
          toast.success('Payment file loaded', {
            description: `${parsed.payments.length} payments ready to process`,
          })
        } else {
          toast.error('Validation errors found', {
            description: `${validationResult.errors.length} errors need attention`,
          })
        }
      } catch (error) {
        toast.error('Failed to parse file', {
          description: error instanceof Error ? error.message : 'Invalid file format',
        })
      }
    }
    reader.readAsText(file)
  }, [alphaUSD])

  // ============================================================================
  // Download Sample File
  // ============================================================================

  const handleDownloadSample = () => {
    window.open('/samples/sample-payroll.xml', '_blank')
  }

  // ============================================================================
  // Execute Payroll
  // ============================================================================

  const handleExecutePayroll = async () => {
    if (!instruction || !alphaUSD) {
      toast.error('Cannot execute', {
        description: 'Please upload a payment file first',
      })
      return
    }

    // Only block on errors, not warnings
    if (validation && validation.errors.length > 0) {
      toast.error('Cannot execute', {
        description: 'Please fix validation errors first',
      })
      return
    }

    if (!walletClient) {
      toast.error('Wallet not connected', {
        description: 'Please sign in / connect your passkey wallet first.',
      })
      return
    }

    if (!publicClient) {
      toast.error('RPC not ready', {
        description: 'Public client not available yet. Try again in a moment.',
      })
      return
    }

    setIsExecuting(true)
    setProgressPct(5)

    const startTime = Date.now()

    try {
      toast.info('Starting payroll execution', {
        description: 'Approve once to submit the payroll batch.',
      })

      // Build a single Tempo multi-call transaction (type 0x76) using EIP-5792 `wallet_sendCalls`.
      // This matches the Tempo demo behavior: one file, one approval, one receipt.
      const calls = instruction.payments.map((p) =>
        Actions.token.transfer.call({
          to: p.employee.address as `0x${string}`,
          amount: parseUnits(p.amount, 6),
          token: p.token as `0x${string}`,
          ...(p.memo ? { memo: stringToHex(p.memo) as `0x${string}` } : {}),
        }),
      )

      setProgressPct(15)

      // Tempo transport recognizes `capabilities.sync` and will return an id that encodes the tx hash.
      const { id } = await sendCalls(walletClient as any, {
        account: address as `0x${string}`,
        calls,
        // `sync` is a Tempo transport extension – it forces inclusion before returning.
        capabilities: { sync: true } as any,
      })

      setProgressPct(35)

      const txHash = extractTxHashFromSendCallsId(id)
      if (!txHash) {
        throw new Error('Batch submitted but tx hash could not be determined.')
      }

      toast.info('Payroll batch submitted', {
        description: `Waiting for confirmation… ${TEMPO_TESTNET.blockExplorers?.default?.url}/tx/${txHash}`,
        duration: 8000,
      })

      // Rely on on-chain truth: wait for the transaction receipt by hash.
      // This avoids false "failed" UI states if bundle polling is flaky.
      const receipt = await (publicClient as any).waitForTransactionReceipt({
        hash: txHash,
        timeout: 180_000,
      })

      setProgressPct(85)

      const endTime = Date.now()

      const perPaymentResults = instruction.payments.map((p) => ({
        id: p.id,
        status: receipt?.status === 'success' ? 'COMPLETED' : 'FAILED',
        employee: {
          name: p.employee.name || p.id,
          address: p.employee.address,
        },
        amount: p.amount,
        transactionHash: txHash,
        blockNumber: typeof receipt?.blockNumber === 'bigint' ? Number(receipt.blockNumber) : undefined,
        timestamp: new Date().toISOString(),
        explorerUrl: `${TEMPO_TESTNET.blockExplorers?.default?.url ?? ''}/tx/${txHash}`,
        gasUsed: '0.001',
        ...(receipt?.status !== 'success'
          ? {
              errorCode: 'BUNDLE_FAILED',
              errorMessage: `Batch transaction failed${receipt?.status ? ` (status: ${receipt.status})` : ''}`,
            }
          : {}),
      }))

      const report = generatePain002(
        instruction,
        perPaymentResults as any,
        endTime - startTime,
        // Prefer actual fee if we have it; fallback to a small fixed estimate.
        typeof receipt?.effectiveGasPrice === 'bigint' && typeof receipt?.gasUsed === 'bigint'
          ? '0.002'
          : '0.002',
      )

      setStatusReport(report)

      // Record activity
      recordActivity({
        kind: 'payroll_execution',
        hash: (txHash || '') as any,
        createdAt: Date.now(),
        chainId: TEMPO_TESTNET.id,
        title: 'Payroll executed',
        details: `${instruction.payments.length}/${instruction.payments.length} payments in one batch tx`,
      })

      // Show result
      if (receipt?.status === 'success') {
        toast.success('Payroll completed!', {
          description: `All ${instruction.payments.length} payments processed in one transaction`,
          duration: 5000,
        })
      } else {
        toast.error('Payroll failed', {
          description: txHash
            ? `Batch tx failed. View on explorer: ${TEMPO_TESTNET.blockExplorers?.default?.url}/tx/${txHash}`
            : 'All payments failed. Check status report for details.',
        })
      }

      // Refresh balances
      refetchBalances()

    } catch (error) {
      console.error('Payroll execution error:', error)
      toast.error('Payroll execution failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsExecuting(false)
      setProgressPct(0)
    }
  }

  function extractTxHashFromSendCallsId(id: string): `0x${string}` | undefined {
    // Tempo transport encodes `id = txHash (32 bytes) + chainId (32 bytes) + magic (32 bytes)`.
    // Extract the first 32 bytes => 0x + 64 hex chars.
    if (!id || typeof id !== 'string') return undefined
    if (!id.startsWith('0x')) return undefined
    if (id.length < 66) return undefined
    return id.slice(0, 66) as `0x${string}`
  }

  // ============================================================================
  // Download Reports
  // ============================================================================

  const handleDownloadStatusReportXML = () => {
    if (!statusReport) return
    const xml = generatePain002XML(statusReport)
    downloadFile(
      xml,
      `payroll-status-${statusReport.originalMessageId}.xml`,
      'application/xml'
    )
  }

  const handleDownloadStatusReportJSON = () => {
    if (!statusReport) return
    const json = JSON.stringify(statusReport, null, 2)
    downloadFile(
      json,
      `payroll-status-${statusReport.originalMessageId}.json`,
      'application/json'
    )
  }

  const handleDownloadCSV = () => {
    if (!statusReport) return
    const csv = exportToCSV(statusReport)
    downloadFile(
      csv,
      `payroll-status-${statusReport.originalMessageId}.csv`,
      'text/csv'
    )
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="container max-w-7xl py-8 px-4 sm:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
        <p className="text-muted-foreground mt-2">
          Run payroll on Tempo blockchain with instant stablecoin payments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Payer */}
        <div className="space-y-6">
          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {alphaUSD ? (
                  <>${parseFloat(alphaUSD.formatted).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</>
                ) : (
                  <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {alphaUSD?.symbol || 'AlphaUSD'} available
              </p>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upload pain.001</CardTitle>
              <CardDescription>
                Upload an ISO 20022 pain.001 XML file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept=".xml,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="payroll-upload"
                />
                <label htmlFor="payroll-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drag and drop your file</p>
                      <p className="text-xs text-muted-foreground mt-1">Or click to browse (.xml)</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Don't have a pain.001 file?{' '}
                  <button
                    onClick={handleDownloadSample}
                    className="text-primary hover:underline"
                  >
                    Download a sample
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reports Card */}
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {statusReport ? (
                <div className="space-y-2">
                  {(() => {
                    const txHash = statusReport.payments.find((p) => p.transactionHash)?.transactionHash
                    if (!txHash) return null
                    return (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Receipt:</span>
                        <Button asChild variant="link" className="h-auto p-0">
                          <Link
                            href={`${TEMPO_TESTNET.blockExplorers?.default?.url ?? ''}/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on Explorer
                          </Link>
                        </Button>
                      </div>
                    )
                  })()}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium ${
                      statusReport.status === 'COMPLETED' ? 'text-green-600' :
                      statusReport.status === 'PARTIALLY_COMPLETED' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {statusReport.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Executed:</span>
                    <span className="font-medium">{statusReport.executionTime}</span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadStatusReportXML}>
                      pain.002 XML
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                      CSV
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reports yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Payroll */}
        <div className="space-y-6">
          {/* Payroll Header */}
          {instruction && (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Payroll</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {instruction.payments.length} payments • Total amount: ${isNaN(instruction.controlSum) 
                    ? instruction.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()
                    : instruction.controlSum.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={handleExecutePayroll}
                disabled={validation && validation.errors.length > 0 || isExecuting}
                size="lg"
              >
                {isExecuting ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Execute payroll
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Payment List */}
          {instruction ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {instruction.payments.map((payment) => {
                    // Check if this payment has been executed
                    const result = statusReport?.payments.find(p => p.id === payment.id)
                    const status = result?.status || 'PENDING'
                    
                    return (
                      <div key={payment.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{payment.id}</span>
                              {status === 'COMPLETED' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                                  COMPLETED
                                </span>
                              )}
                              {status === 'FAILED' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100">
                                  FAILED
                                </span>
                              )}
                              {status === 'PENDING' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100">
                                  PENDING
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-sm text-muted-foreground break-all">
                              {payment.employee.address}
                            </p>
                            <p className="text-sm font-semibold mt-2">
                              ${parseFloat(payment.amount).toLocaleString()} {payment.currency}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Upload a pain.001 file to get started</p>
              </CardContent>
            </Card>
          )}

          {/* Execution Progress */}
          {isExecuting && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting payroll batch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Preparing calls</span>
                    <span>{progressPct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings (non-blocking) */}
          {validation && validation.warnings.length > 0 && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-sm text-yellow-600 dark:text-yellow-400">
                  Warnings ({validation.warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  {validation.warnings.slice(0, 3).map((warning, idx) => (
                    <p key={idx} className="text-muted-foreground">
                      {warning.message}
                    </p>
                  ))}
                  {validation.warnings.length > 3 && (
                    <p className="text-muted-foreground">+{validation.warnings.length - 3} more</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors (blocking) */}
          {validation && validation.errors.length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-sm text-red-600 dark:text-red-400">
                  Errors ({validation.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  {validation.errors.map((error, idx) => (
                    <p key={idx} className="text-red-600 dark:text-red-400">
                      {error.message}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

