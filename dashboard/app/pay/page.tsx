import PayClient from './PayClient'

// This route must be dynamic so query params (e.g. ?to=0x...) are available at request time.
export const dynamic = 'force-dynamic'

// #region agent log
async function logDebug(location: string, message: string, data: object, hypothesisId: string) {
  try {
    await fetch('http://127.0.0.1:7242/ingest/84418c44-ee5b-4cfc-9e78-f04e29fce6f0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, message, data, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId }),
    })
  } catch {}
}
// #endregion

export default async function PayPage(props: {
  searchParams: Promise<{ to?: string }>
}) {
  // Next.js 15+ has async searchParams - always await
  const resolvedSearchParams = await props.searchParams
  const toValue = resolvedSearchParams?.to ?? ''

  // #region agent log
  await logDebug('pay/page.tsx:resolved', 'SearchParams resolved', { toValue, resolvedSearchParams: JSON.stringify(resolvedSearchParams) }, 'B')
  // #endregion

  // Back-compat for older QR links: /pay?to=0x...
  return <PayClient to={toValue} />
}

