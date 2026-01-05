/**
 * Smart batch executor for payroll
 * Executes payments in groups of 10 for optimal performance
 */

import { parseUnits, stringToHex, pad } from 'viem'
import type { Payment, PaymentResult } from './iso20022'
import { EXPLORER_URL } from './constants'

export interface BatchProgress {
  currentBatch: number
  totalBatches: number
  currentTransaction: number
  totalTransactions: number
  completedTransactions: number
  failedTransactions: number
}

export interface BatchExecutionResult {
  results: PaymentResult[]
  totalTimeMs: number
  totalFees: string
  successCount: number
  failureCount: number
}

/**
 * Execute payments in smart batches
 * - Groups of 10 transactions per batch (for progress tracking)
 * - Executes sequentially (each requires passkey approval)
 * - Continues on individual failures
 * - Returns detailed results for each payment
 * 
 * Note: Transactions require individual user approval, so they must be sequential
 * rather than parallel. Batching is used for progress tracking only.
 */
export async function executePayrollBatch(
  payments: Payment[],
  feeToken: `0x${string}`,
  sendPaymentFn: (args: {
    to: `0x${string}`
    amount: bigint
    token: `0x${string}`
    feeToken: `0x${string}`
    memo?: `0x${string}`
  }) => Promise<{ hash: `0x${string}`; receipt: { blockNumber: bigint; gasUsed: bigint } }>,
  onProgress?: (progress: BatchProgress) => void
): Promise<BatchExecutionResult> {
  const BATCH_SIZE = 10
  const startTime = Date.now()
  const results: PaymentResult[] = []
  let totalFeesWei = 0n

  // Split into batches
  const batches: Payment[][] = []
  for (let i = 0; i < payments.length; i += BATCH_SIZE) {
    batches.push(payments.slice(i, i + BATCH_SIZE))
  }

  // Execute each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]

    // Report progress at start of batch
    if (onProgress) {
      onProgress({
        currentBatch: batchIndex + 1,
        totalBatches: batches.length,
        currentTransaction: batchIndex * BATCH_SIZE + 1,
        totalTransactions: payments.length,
        completedTransactions: results.filter(r => r.status === 'COMPLETED').length,
        failedTransactions: results.filter(r => r.status === 'FAILED').length,
      })
    }

    // Execute batch sequentially (each requires passkey approval)
    // Note: Can't parallelize transactions that require individual user approvals
    const batchResults: PaymentResult[] = []
    
    for (let i = 0; i < batch.length; i++) {
      const payment = batch[i]
      
      // Update progress for current transaction
      if (onProgress) {
        onProgress({
          currentBatch: batchIndex + 1,
          totalBatches: batches.length,
          currentTransaction: batchIndex * BATCH_SIZE + i + 1,
          totalTransactions: payments.length,
          completedTransactions: results.length + batchResults.filter(r => r.status === 'COMPLETED').length,
          failedTransactions: results.length + batchResults.filter(r => r.status === 'FAILED').length,
        })
      }
      
      try {
        // Parse amount (assuming 6 decimals for stablecoins)
        const amount = parseUnits(payment.amount, 6)

        // Prepare memo
        const memo = payment.memo
          ? pad(stringToHex(payment.memo), { size: 32 })
          : undefined

        // Send transaction (waits for user approval)
        const { hash, receipt } = await sendPaymentFn({
          to: payment.employee.address,
          amount,
          token: payment.token,
          feeToken,
          memo,
        })

        // Track fees (if available in receipt)
        if (receipt.gasUsed) {
          totalFeesWei += receipt.gasUsed
        }

        // Build result
        const result: PaymentResult = {
          id: payment.id,
          status: 'COMPLETED',
          employee: {
            name: payment.employee.name ?? payment.id,
            address: payment.employee.address,
          },
          amount: payment.amount,
          transactionHash: hash,
          blockNumber: Number(receipt.blockNumber),
          timestamp: new Date().toISOString(),
          explorerUrl: `${EXPLORER_URL}/tx/${hash}`,
          gasUsed: '0.001', // Approximate for Tempo
        }

        batchResults.push(result)
      } catch (error) {
        // Handle failure
        const result: PaymentResult = {
          id: payment.id,
          status: 'FAILED',
          employee: {
            name: payment.employee.name ?? payment.id,
            address: payment.employee.address,
          },
          amount: payment.amount,
          errorCode: 'TRANSACTION_FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        }

        batchResults.push(result)
      }
    }
    
    results.push(...batchResults)

    // Report progress after batch completion
    if (onProgress) {
      onProgress({
        currentBatch: batchIndex + 1,
        totalBatches: batches.length,
        currentTransaction: Math.min((batchIndex + 1) * BATCH_SIZE, payments.length),
        totalTransactions: payments.length,
        completedTransactions: results.filter(r => r.status === 'COMPLETED').length,
        failedTransactions: results.filter(r => r.status === 'FAILED').length,
      })
    }

    // Small delay between batches to avoid overwhelming the network
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const endTime = Date.now()
  const totalTimeMs = endTime - startTime

  // Calculate total fees (approximate)
  const successCount = results.filter(r => r.status === 'COMPLETED').length
  const totalFees = (successCount * 0.001).toFixed(3)

  return {
    results,
    totalTimeMs,
    totalFees,
    successCount,
    failureCount: results.length - successCount,
  }
}

/**
 * Chunk array into smaller arrays of specified size
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

