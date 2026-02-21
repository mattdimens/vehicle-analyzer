import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { cn } from '../lib/utils'
import { SiteHeader } from '../components/ui/site-header'
import { SiteFooter } from '../components/ui/site-footer'

// Setup your new fonts
const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontHeading = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
})

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://visualfitment.com'),
  title: 'Find Vehicle Fitment, Parts, & Accessories From an Image | Visual Fitment',
  description: 'Instantly identify vehicle fitment, parts, and accessories just from a photo. Upload an image of any car or truck to get a detailed analysis.',
  openGraph: {
    title: 'Find Vehicle Fitment, Parts, & Accessories From an Image | Visual Fitment',
    description: 'Instantly identify vehicle fitment, parts, and accessories just from a photo.',
    url: 'https://visualfitment.com',
    siteName: 'Visual Fitment',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Vehicle Fitment, Parts, & Accessories From an Image | Visual Fitment',
    description: 'Instantly identify vehicle fitment, parts, and accessories just from a photo.',
  },
  alternates: {
    canonical: '/',
  },
}

// JSON-LD structured data for the application
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Visual Fitment',
  url: 'https://visualfitment.com',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Any',
  description:
    'Instantly identify vehicle fitment, parts, and accessories just from a photo. Upload an image of any car or truck to get a detailed analysis.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontHeading.variable
        )}
      >
        {/* GA4 — conditionally rendered, placed in body with afterInteractive strategy */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* Site Header */}
        <SiteHeader />

        {/* Main content — offset for the fixed header */}
        <main className="flex-1 pt-14">{children}</main>

        {/* Site Footer */}
        <SiteFooter />
      </body>
    </html>
  )
}