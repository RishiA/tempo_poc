import { http, createConfig } from 'wagmi'
import { webAuthn, KeyManager } from 'tempo.ts/wagmi'
import { TEMPO_TESTNET } from './constants'

// Key Manager for WebAuthn credentials
// Using localStorage for POC (NOT recommended for production)
// For production, use KeyManager.http() with a backend service
const keyManager = KeyManager.localStorage()

export const wagmiConfig = createConfig({
  chains: [TEMPO_TESTNET],
  connectors: [
    webAuthn({
      keyManager,
      rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
    }),
  ],
  transports: {
    [TEMPO_TESTNET.id]: http(TEMPO_TESTNET.rpcUrls.default.http[0]),
  },
  ssr: true,
})

// Re-export for convenience
export { TEMPO_TESTNET as tempoTestnet }
