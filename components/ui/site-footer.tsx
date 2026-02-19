import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer id="footer" className="border-t py-12 md:py-16 bg-white">
      {/* These classes here are what center your footer content */}
      <div className="container flex max-w-4xl flex-col items-center justify-center text-center">
        <p className="text-lg font-bold">Visual Fitment</p>
        <div className="my-6 flex space-x-6">
          <Link
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            How It Works
          </Link>
          <Link
            href="#use-cases"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Use Cases
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Privacy
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Visual Fitment. All rights reserved.
        </p>
      </div>
    </footer>
  )
}