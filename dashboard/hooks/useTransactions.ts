'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

export type TransferRow = {
  kind: 'transfer'
  hash: `0x${string}`
  logIndex: number
  tokenAddress: `0x${string}`
  tokenSymbol: string
  amount: string
  from: `0x${string}`
  to: `0x${string}`
  direction: 'sent' | 'received'
  blockNumber: number
  timestamp: number
}

type TransactionsResponse = {
  address: `0x${string}`
  fromDays: number
  fromBlock: number
  toBlock: number
  transfers: TransferRow[]
}

export function useTransactions(fromDays: number = 7) {
  const { address } = useAccount()

  return useQuery({
    queryKey: ['transactions', address, fromDays],
    enabled: !!address,
    queryFn: async (): Promise<TransactionsResponse> => {
      if (!address) throw new Error('No address')
      const res = await fetch(`/api/transactions?address=${address}&fromDays=${fromDays}`)
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || `Failed to load transactions (${res.status})`)
      }
      return (await res.json()) as TransactionsResponse
    },
  })
}


