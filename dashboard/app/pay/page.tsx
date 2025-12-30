import PayClient from './PayClient'

export default function PayPage({
  searchParams,
}: {
  searchParams: { to?: string }
}) {
  // Server component: read search params here to avoid requiring Suspense for useSearchParams().
  return <PayClient to={searchParams?.to ?? ''} />
}

