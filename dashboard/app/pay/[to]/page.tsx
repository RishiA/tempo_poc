import PayClient from '../PayClient'

export const dynamic = 'force-dynamic'

export default function PayToPage({ params }: { params: { to: string } }) {
  return <PayClient to={params?.to ?? ''} />
}

