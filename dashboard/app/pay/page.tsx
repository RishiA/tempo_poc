import PayClient from './PayClient'

// This route must be dynamic so query params (e.g. ?to=0x...) are available at request time.
export const dynamic = 'force-dynamic'

export default async function PayPage(props: {
  searchParams: Promise<{ to?: string }>
}) {
  // Next.js 15+ has async searchParams - always await
  const resolvedSearchParams = await props.searchParams
  // Back-compat for older QR links: /pay?to=0x...
  return <PayClient to={resolvedSearchParams?.to ?? ''} />
}

