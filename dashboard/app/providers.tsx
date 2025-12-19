'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { ThemeProvider } from 'next-themes'
import { wagmiConfig } from '@/lib/wagmi'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component to avoid sharing state between requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Disable automatic refetching in some cases to reduce RPC calls
        staleTime: 60_000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}

