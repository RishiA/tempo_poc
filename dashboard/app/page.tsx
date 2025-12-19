'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ConnectionHandler } from "@/components/wallet/ConnectionHandler";
import { useConnect, useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { parseWalletError, isPasskeySupported, isSecureContext } from '@/lib/errors';

export default function Home() {
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { isConnected, isReconnecting } = useAccount();
  const router = useRouter();
  const [browserSupported] = useState(() => isPasskeySupported());

  const connector = connectors[0]; // WebAuthn connector

  // Redirect to dashboard if connected
  useEffect(() => {
    if (isConnected && !isReconnecting) {
      router.push('/dashboard');
    }
  }, [isConnected, isReconnecting, router]);

  // Monitor Wagmi's error state
  useEffect(() => {
    if (connectError) {
      // Wagmi automatically logs the error, we just show user-friendly message
      const error = parseWalletError(connectError);
      toast.error(error.title, {
        description: error.description,
        duration: 5000,
      });
    }
  }, [connectError]);

  // Handle client-side rendering and check browser compatibility
  useEffect(() => {
    // Only side effects here (no synchronous setState calls)
    if (!browserSupported) {
      toast.error('Passkeys not supported', {
        description: 'Your browser does not support passkeys. Please use Chrome, Safari, or Edge.',
        duration: 10000,
      });
    }

    // Check if running on secure context
    if (!isSecureContext()) {
      toast.warning('Insecure context', {
        description: 'Passkeys require HTTPS or localhost. Connection may fail.',
        duration: 10000,
      });
    }
  }, [browserSupported]);

  // Handle sign up
  const handleSignUp = async () => {
    if (!connector) {
      toast.error('No connector available', {
        description: 'Wallet connector not initialized. Please refresh the page.',
      });
      return;
    }

    if (!browserSupported) {
      toast.error('Passkeys not supported', {
        description: 'Please use a modern browser that supports passkeys.',
      });
      return;
    }
    
    try {
      await connect({
        connector,
        chainId: 42429, // Tempo testnet
        capabilities: {
          type: 'sign-up',
          label: 'Tempo Wallet', // Label for the passkey
        },
      });
      // Success toast will be handled by ConnectionHandler
    } catch (err) {
      // Error is logged by Wagmi, we just need to show user-friendly message
      const error = parseWalletError(err);
      toast.error(error.title, {
        description: error.description,
        duration: 5000,
        action: error.action ? {
          label: error.action,
          onClick: () => handleSignUp(),
        } : undefined,
      });
    }
  };

  // Handle sign in
  const handleSignIn = async () => {
    if (!connector) {
      toast.error('No connector available', {
        description: 'Wallet connector not initialized. Please refresh the page.',
      });
      return;
    }

    if (!browserSupported) {
      toast.error('Passkeys not supported', {
        description: 'Please use a modern browser that supports passkeys.',
      });
      return;
    }
    
    try {
      await connect({
        connector,
        chainId: 42429,
        capabilities: {
          type: 'sign-in',
        },
      });
      // Success toast will be handled by ConnectionHandler
    } catch (err) {
      // Error is logged by Wagmi, we just need to show user-friendly message
      const error = parseWalletError(err);
      toast.error(error.title, {
        description: error.description,
        duration: 5000,
        action: error.action ? {
          label: error.action,
          onClick: () => handleSignIn(),
        } : undefined,
      });
    }
  };

  // Show loading while redirecting to dashboard
  if (isConnected || isReconnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Connection Handler - manages reconnection and events */}
      <ConnectionHandler />
      
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600" />
            <span className="text-xl font-bold">Tempo</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              About
            </Button>
            <Button variant="ghost" size="sm">
              Docs
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Hero Text */}
          <div className="space-y-6">
            <div className="inline-block">
              <div className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">
                Testnet POC • No real money
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Stablecoin payments,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                instant settlement
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Send and receive stablecoins on Tempo blockchain with sub-second finality. 
              Built for modern finance, powered by blockchain.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Sub-second transaction finality</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Pay fees in any stablecoin</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Passkey authentication (no seed phrases)</span>
              </li>
            </ul>
          </div>

          {/* Right Column - Auth Card */}
          <Card className="shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Get started</CardTitle>
              <CardDescription>
                Sign in with your passkey or create a new account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sign Up Button */}
              <Button 
                className="w-full h-12 text-base" 
                size="lg"
                onClick={handleSignUp}
                disabled={isPending || isReconnecting || !isClient || !browserSupported}
              >
                {(isPending || isReconnecting) ? (
                  <>
                    <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg 
                      className="mr-2 h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
                      />
                    </svg>
                    Sign up with Passkey
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              {/* Sign In Button */}
              <Button 
                variant="outline" 
                className="w-full h-12 text-base"
                size="lg"
                onClick={handleSignIn}
                disabled={isPending || isReconnecting || !isClient || !browserSupported}
              >
                {(isPending || isReconnecting) ? (
                  <>
                    <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg 
                      className="mr-2 h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                      />
                    </svg>
                    Sign in with existing Passkey
                  </>
                )}
              </Button>

              {/* Info Section */}
              <div className="pt-4 space-y-4 text-sm text-muted-foreground border-t">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">What are Passkeys?</p>
                    <p className="text-xs">
                      Use your fingerprint, face, or device PIN to securely access your wallet. 
                      No passwords or seed phrases required.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-foreground">Testnet Only</p>
                    <p className="text-xs">
                      This is a proof of concept using Tempo testnet. 
                      Test tokens have no real value.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 sm:px-8">
          <p className="text-sm text-muted-foreground">
            Built on <span className="font-medium">Tempo Testnet</span> • Powered by{" "}
            <span className="font-medium">Wagmi</span> + <span className="font-medium">Viem</span>
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="https://docs.tempo.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Tempo Docs
            </a>
            <a href="https://explore.tempo.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
