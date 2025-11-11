import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className="text-lg font-bold text-primary"
          >
            VehicleAnalyzer
          </Link>
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
          <Link
            href="#footer"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Footer
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