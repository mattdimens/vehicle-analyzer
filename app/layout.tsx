import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import { cn } from '../lib/utils'
import { SiteHeader } from '../components/ui/site-header'
import { SiteFooter } from '../components/ui/site-footer'

// Setup your new fonts
const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontHeading = Manrope({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['700', '800'],
})

export const metadata: Metadata = {
  title: 'Vehicle Analyzer',
  description: 'Upload an image to analyze vehicle fitment',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontHeading.variable
        )}
      >
        {/* This adds your new header */}
        <SiteHeader /> 

        {/* We add 'pt-14' to the main content to offset for the fixed header */}
        <main className="flex-1 pt-14">{children}</main>

        {/* This adds your new footer */}
        <SiteFooter /> 
      </body>
    </html>
  )
}