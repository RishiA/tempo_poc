export type Recipient = {
  id: string
  name: string
  address: `0x${string}`
  createdAt: number
  lastUsed?: number
}

export function isValidAddress(address: string): address is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}
