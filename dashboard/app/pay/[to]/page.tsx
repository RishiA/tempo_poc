import PayClient from '../PayClient'

export const dynamic = 'force-dynamic'

export default async function PayToPage(props: { params: Promise<{ to: string }> }) {
  // Next.js 15+ has async params - always await
  const resolvedParams = await props.params
  return <PayClient to={resolvedParams?.to ?? ''} />
}

