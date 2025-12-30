'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount, useConnect } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { isValidAddress } from '@/types/recipient'
import { parseWalletError } from '@/lib/errors'

export default function PayPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isConnected, isConnecting } = useAccount()
  const { connect, connectors, isPending, error: connectError } = useConnect()

  const to = searchParams.get('to') ?? ''
  const validTo = useMemo(() => (to && isValidAddress(to) ? (to as `0x${string}`) : null), [to])

  const platformConnector = connectors.find((c) => c.id === 'webauthn-platform') ?? connectors[0]
  const defaultConnector = connectors.find((c) => c.id === 'webauthn-default') ?? connectors[0]

  useEffect(() => {
    if (connectError) {
      const parsed = parseWalletError(connectError)
      toast.error(parsed.title, { description: parsed.description, duration: 6000 })
    }
  }, [connectError])

  useEffect(() => {
    if (!validTo) return
    if (isConnected) {
      router.replace(`/dashboard/send?to=${encodeURIComponent(validTo)}`)
    }
  }, [isConnected, router, validTo])

  const handleSignUp = async () => {
    if (!validTo) return
    try {
      await connect({
        connector: platformConnector,
        chainId: 42429,
        capabilities: { type: 'sign-up', label: 'Tempo Wallet' } as any,
      } as any)
      router.replace(`/dashboard/send?to=${encodeURIComponent(validTo)}`)
    } catch (err) {
      const parsed = parseWalletError(err)
      toast.error(parsed.title, { description: parsed.description, duration: 6000 })
    }
  }

  const handleSignIn = async () => {
    if (!validTo) return
    try {
      await connect({
        connector: platformConnector,
        chainId: 42429,
        capabilities: { type: 'sign-in', selectAccount: true } as any,
      } as any)
      router.replace(`/dashboard/send?to=${encodeURIComponent(validTo)}`)
    } catch (err) {
      const parsed = parseWalletError(err)
      toast.error(parsed.title, { description: parsed.description, duration: 6000 })
    }
  }

  const handleFallback = async () => {
    if (!validTo) return
    try {
      await connect({
        connector: defaultConnector,
        chainId: 42429,
        capabilities: { type: 'sign-in', selectAccount: true } as any,
      } as any)
      router.replace(`/dashboard/send?to=${encodeURIComponent(validTo)}`)
    } catch (err) {
      const parsed = parseWalletError(err)
      toast.error(parsed.title, { description: parsed.description, duration: 6000 })
    }
  }

  if (!validTo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Invalid payment link</CardTitle>
            <CardDescription>
              This payment link is missing a valid recipient address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
              to={to || '(missing)'}
            </div>
            <Button onClick={() => router.replace('/')} className="w-full">
              Go to home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Continue to send</CardTitle>
          <CardDescription>
            Sign in (or create a passkey) to send to:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
            {validTo}
          </div>

          <Button
            className="w-full"
            onClick={handleSignUp}
            disabled={isPending || isConnecting}
          >
            Create passkey (Touch ID)
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignIn}
            disabled={isPending || isConnecting}
          >
            Sign in with passkey
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleFallback}
            disabled={isPending || isConnecting}
          >
            Use phone QR / security key
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

