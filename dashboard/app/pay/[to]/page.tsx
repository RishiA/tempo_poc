import PayClient from '../PayClient'

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

export default async function PayToPage(props: { params: Promise<{ to: string }> }) {
  // Next.js 15+ has async params - always await
  const resolvedParams = await props.params
  const toValue = resolvedParams?.to ?? ''

  // #region agent log
  await logDebug('pay/[to]/page.tsx:resolved', 'Params resolved', { toValue, resolvedParams: JSON.stringify(resolvedParams) }, 'B')
  // #endregion

  return <PayClient to={toValue} />
}

