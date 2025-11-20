import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import Script from 'next/script' // <-- 1. IMPORT SCRIPT
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
  title: 'Find Vehicle Fitment, Parts, & Accessories From an Image | Visual Fitment',
  description: 'Instantly identify vehicle fitment, parts, and accessories just from a photo. Upload an image of any car or truck to get a detailed analysis.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* --- 2. ADD YOUR GA4 TAGS HERE --- */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
        {/* --- END OF GA4 TAGS --- */}
      </head>
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