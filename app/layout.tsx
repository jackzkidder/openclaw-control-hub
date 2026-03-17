import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Sidebar } from '@/components/layout/Sidebar'
import { GatewayBanner } from '@/components/layout/GatewayBanner'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'OpenClaw Control',
  description: 'OpenClaw AI agent command center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} font-sans antialiased overflow-hidden`}
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
      >
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <GatewayBanner />
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
