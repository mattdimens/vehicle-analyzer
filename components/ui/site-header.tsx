"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Image
            src="/logo.png"
            alt="Visual Fitment Logo"
            width={32}
            height={32}
          />
          <span className="text-lg font-bold text-primary">
            Visual Fitment
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center justify-end flex-1">
          <Button asChild>
            <Link href="#hero">Try Now</Link>
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href="#how-it-works"
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#use-cases"
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Use Cases
              </Link>
              <div className="pt-4">
                <Button asChild className="w-full">
                  <Link href="#hero" onClick={() => setIsOpen(false)}>
                    Try Now
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}