import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Inti - Intent-Based Swap Chatbot',
  description: 'A modern, intelligent chatbot interface for cryptocurrency swaps with 1-click SDK integration.',
  keywords: ['blockchain', 'swap', 'chatbot', 'defi', 'web3', 'cryptocurrency'],
  authors: [{ name: 'Gaston Cartier' }],
  robots: 'index, follow',
  icons: {
    icon: '/inti-logo.png',
    shortcut: '/inti-logo.png',
    apple: '/inti-logo.png',
  },
  openGraph: {
    title: 'Inti - Intent-Based Swap Chatbot',
    description: 'A modern, intelligent chatbot interface for cryptocurrency swaps with 1-click SDK integration.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inti - Intent-Based Swap Chatbot',
    description: 'A modern, intelligent chatbot interface for cryptocurrency swaps with 1-click SDK integration.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
