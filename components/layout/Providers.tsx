'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { useGatewayEvents } from '@/hooks/useGatewayEvents'

function GatewayEventListener() {
  useGatewayEvents()

  // Auto-connect to the gateway on startup so the user doesn't have to
  // manually trigger it from the Settings page each time.
  useEffect(() => {
    fetch('/api/openclaw/connect', { method: 'POST' }).catch(() => {})
  }, [])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        <GatewayEventListener />
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
