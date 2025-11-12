import Link from 'next/link'
import Image from 'next/image' // <-- 1. Import the Image component
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <nav className="flex items-center space-x-6 text-sm font-medium">
          
          {/* --- 2. This is your new logo link --- */}
          <Link
            href="/"
            className="flex items-center gap-2" // gap-2 adds space between logo and text
          >
            <Image
              src="/logo.png" // This automatically points to your public/logo.png
              alt="Visual Fitment Logo"
              width={32} // Set the width (in pixels)
              height={32} // Set the height (in pixels)
            />
            <span className="text-lg font-bold text-primary">
              Visual Fitment
            </span>
          </Link>
          {/* --- End of new logo link --- */}

          <Link
            href="#how-it-works"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            How It Works
          </Link>
          <Link
            href="#use-cases"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Use Cases
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end">
          <Button asChild>
            <Link href="#hero">Try Now</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}