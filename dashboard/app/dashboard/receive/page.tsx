import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReceivePage() {
  return (
    <div className="container py-8 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receive Payment</h1>
          <p className="text-muted-foreground mt-2">
            Share your wallet address to receive stablecoins
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Wallet Address</CardTitle>
            <CardDescription>
              Coming in next step...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12 text-muted-foreground">
            <svg className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p>QR code and address display will be built in the next step</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

