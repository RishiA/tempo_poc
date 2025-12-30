import PayClient from './PayClient'

// This route must be dynamic so query params (e.g. ?to=0x...) are available at request time.
export const dynamic = 'force-dynamic'

export default function PayPage({
  searchParams,
}: {
  searchParams: { to?: string }
}) {
  // Server component: read search params here to avoid requiring Suspense for useSearchParams().
  return <PayClient to={searchParams?.to ?? ''} />
}

