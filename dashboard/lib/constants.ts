import { tempoTestnet } from 'tempo.ts/chains'

// Token Addresses (Tempo Testnet Stablecoins)
export const TOKENS = {
  pathUSD: process.env.NEXT_PUBLIC_PATH_USD || '0x20c0000000000000000000000000000000000000',
  AlphaUSD: process.env.NEXT_PUBLIC_ALPHA_USD || '0x20c0000000000000000000000000000000000001',
  BetaUSD: process.env.NEXT_PUBLIC_BETA_USD || '0x20c0000000000000000000000000000000000002',
  ThetaUSD: process.env.NEXT_PUBLIC_THETA_USD || '0x20c0000000000000000000000000000000000003',
} as const

// Tempo Testnet Configuration
//
// Important: we use Tempo's chain definition (via `tempo.ts`) so Tempo-specific
// transaction types (e.g. `0x76` for multi-call) + fee token inference work.
// This enables `wallet_sendCalls` for one-approval payroll batches.
export const TEMPO_TESTNET = (tempoTestnet as any)({
  feeToken: TOKENS.AlphaUSD as `0x${string}`,
})

// Alias for easier import
export const TEMPO_TOKENS = TOKENS

// Token Metadata
export const TOKEN_METADATA = {
  [TOKENS.pathUSD]: {
    name: 'pathUSD',
    symbol: 'pathUSD',
    decimals: 6,
    address: TOKENS.pathUSD as `0x${string}`,
  },
  [TOKENS.AlphaUSD]: {
    name: 'AlphaUSD',
    symbol: 'AlphaUSD',
    decimals: 6,
    address: TOKENS.AlphaUSD as `0x${string}`,
  },
  [TOKENS.BetaUSD]: {
    name: 'BetaUSD',
    symbol: 'BetaUSD',
    decimals: 6,
    address: TOKENS.BetaUSD as `0x${string}`,
  },
  [TOKENS.ThetaUSD]: {
    name: 'ThetaUSD',
    symbol: 'ThetaUSD',
    decimals: 6,
    address: TOKENS.ThetaUSD as `0x${string}`,
  },
} as const

// ERC-20 ABI (minimal)
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
] as const

// Explorer URLs
export const EXPLORER_URL = process.env.NEXT_PUBLIC_TEMPO_EXPLORER_URL || 'https://explore.tempo.xyz'
export const SPONSOR_URL = process.env.NEXT_PUBLIC_SPONSOR_URL || 'https://sponsor.testnet.tempo.xyz'

