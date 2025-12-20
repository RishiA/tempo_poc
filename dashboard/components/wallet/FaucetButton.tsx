'use client'

import { Hooks } from 'tempo.ts/wagmi'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { recordActivity } from '@/lib/activityLog'
import { TEMPO_TESTNET } from '@/lib/constants'

export function FaucetButton() {
  const { address } = useAccount()
  const { mutate: addFunds, isPending, isSuccess, error, data } = Hooks.faucet.useFundSync()

  const handleAddFunds = () => {
    if (!address) return
    
    toast.info('Requesting testnet funds...', {
      description: 'This may take a few seconds',
    })
    
    addFunds({ account: address })
  }

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      toast.success('Funds added!', {
        description: 'AlphaUSD has been added to your wallet',
        duration: 5000,
      })

      // Try to extract transaction hash if available
      const txHash = (data as any)?.receipt?.transactionHash || (data as any)?.hash
      if (txHash && typeof txHash === 'string') {
        recordActivity({
          kind: 'faucet_fund',
          hash: txHash as `0x${string}`,
          createdAt: Date.now(),
          chainId: TEMPO_TESTNET.id,
          title: 'Faucet funding',
          details: 'Funded account from Tempo testnet faucet',
        })
      }
    }
  }, [isSuccess, data])

  // Handle error
  useEffect(() => {
    if (error) {
      toast.error('Failed to add funds', {
        description: error.message || 'Please try again later',
        duration: 5000,
      })
    }
  }, [error])

  return (
    <Button onClick={handleAddFunds} disabled={isPending || !address} variant="outline" size="sm">
      {isPending ? (
        <>
          <svg className="mr-2 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Requesting...
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Testnet Funds
        </>
      )}
    </Button>
  )
}

