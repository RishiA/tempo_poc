import { http, createConfig } from 'wagmi'
import { webAuthn, KeyManager } from 'tempo.ts/wagmi'
import { TEMPO_TESTNET } from './constants'

// Key Manager for WebAuthn credentials
// Using localStorage for POC (NOT recommended for production)
// For production, use KeyManager.http() with a backend service
const keyManager = KeyManager.localStorage()

function getRpId(): string | undefined {
  // Prefer explicit env var so the relying party is stable across environments.
  // On Vercel, set NEXT_PUBLIC_RP_ID to your production domain (e.g. tempopoc.vercel.app).
  const envRpId = process.env.NEXT_PUBLIC_RP_ID
  if (envRpId && envRpId.trim()) return envRpId.trim()

  // Fallback to current hostname in the browser.
  if (typeof window !== 'undefined') return window.location.hostname

  // On the server (or during build), omit rpId to avoid accidentally binding to localhost.
  return undefined
}

const rpId = getRpId()

// Create two connectors:
// - platformConnector: nudges WebAuthn toward platform authenticators (Touch ID)
// - defaultConnector: allows cross-device (QR) / security key fallback
//
// Note: tempo.ts/wagmi's webAuthn options surface may evolve; keep config tolerant.
const platformConnector = webAuthn({
  keyManager,
  ...(rpId ? { rpId } : {}),
  // Some versions of tempo.ts accept additional WebAuthn options under `options`.
  options: {
    ...(rpId ? { rpId } : {}),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
    },
  },
} as any)

const defaultConnector = webAuthn({
  keyManager,
  ...(rpId ? { rpId } : {}),
} as any)

// Ensure unique ids/names so Wagmi can differentiate between connectors.
;(platformConnector as any).id = (platformConnector as any).id || 'webauthn-platform'
;(platformConnector as any).name = (platformConnector as any).name || 'Passkey (This device)'
;(defaultConnector as any).id = (defaultConnector as any).id || 'webauthn-default'
;(defaultConnector as any).name = (defaultConnector as any).name || 'Passkey (Phone / Security key)'

export const wagmiConfig = createConfig({
  chains: [TEMPO_TESTNET],
  connectors: [
    platformConnector as any,
    defaultConnector as any,
  ],
  transports: {
    [TEMPO_TESTNET.id]: http(TEMPO_TESTNET.rpcUrls.default.http[0]),
  },
  // This app is passkey-first; avoid SSR connector initialization surprises.
  ssr: false,
})

// Re-export for convenience
export { TEMPO_TESTNET as tempoTestnet }
