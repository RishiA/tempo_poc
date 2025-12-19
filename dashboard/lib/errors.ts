/**
 * Error handling utilities for wallet connections and transactions
 */

export type WalletError = {
  title: string
  description: string
  action?: string
}

/**
 * Parse and format wallet connection errors for user-friendly display
 */
export function parseWalletError(error: unknown): WalletError {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorName = error instanceof Error ? error.name : ''

  // WebAuthn-specific errors - check both message and name
  if (
    errorName === 'NotAllowedError' ||
    errorName.includes('CredentialRequestFailedError') ||
    errorMessage.includes('NotAllowedError') || 
    errorMessage.includes('not allowed') ||
    errorMessage.includes('cancelled') ||
    errorMessage.includes('canceled') ||
    errorMessage.includes('User cancelled') ||
    errorMessage.includes('timed out')
  ) {
    return {
      title: 'Authentication cancelled',
      description: 'You cancelled the passkey authentication. Please try again.',
      action: 'Try again',
    }
  }

  if (errorMessage.includes('NotSupportedError')) {
    return {
      title: 'Passkeys not supported',
      description: 'Your browser or device does not support passkeys. Please use a modern browser (Chrome, Safari, Edge).',
      action: 'Update browser',
    }
  }

  if (errorMessage.includes('InvalidStateError')) {
    return {
      title: 'Passkey already exists',
      description: 'A passkey for this wallet already exists. Try signing in instead.',
      action: 'Sign in',
    }
  }

  if (errorMessage.includes('SecurityError')) {
    return {
      title: 'Security error',
      description: 'Passkeys require a secure connection (HTTPS or localhost). Make sure you\'re on a secure page.',
      action: 'Check connection',
    }
  }

  if (errorMessage.includes('TimeoutError') || errorMessage.includes('timeout')) {
    return {
      title: 'Authentication timeout',
      description: 'The passkey authentication took too long. Please try again.',
      action: 'Try again',
    }
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      title: 'Network error',
      description: 'Could not connect to the Tempo network. Check your internet connection.',
      action: 'Retry',
    }
  }

  // Chain mismatch
  if (errorMessage.includes('chain') || errorMessage.includes('network')) {
    return {
      title: 'Wrong network',
      description: 'Please switch to Tempo Testnet (Chain ID: 42429).',
      action: 'Switch network',
    }
  }

  // User rejection
  if (errorMessage.includes('reject') || errorMessage.includes('denied')) {
    return {
      title: 'Request rejected',
      description: 'You rejected the connection request.',
      action: 'Try again',
    }
  }

  // Generic error
  return {
    title: 'Connection failed',
    description: errorMessage || 'An unexpected error occurred. Please try again.',
    action: 'Try again',
  }
}

/**
 * Check if the browser supports WebAuthn passkeys
 */
export function isPasskeySupported(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  )
}

/**
 * Check if running on a secure context (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.isSecureContext
}

/**
 * Get user-friendly error message for connection issues
 */
export function getConnectionErrorMessage(error: unknown): string {
  const parsed = parseWalletError(error)
  return `${parsed.title}: ${parsed.description}`
}

