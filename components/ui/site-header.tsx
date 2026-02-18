"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, ArrowRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

import { useState } from 'react'

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-white backdrop-blur-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Image
            src="/logo.png"
            alt="Visual Fitment Logo"
            width={32}
            height={32}
          />
          <span className="text-lg font-bold font-heading text-foreground">
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
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary focus:outline-none">
              By Product Category <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/wheels-rims">Wheels & Rims</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/truck-bed-covers">Truck Bed Covers</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/nerf-bars-running-boards">Running Boards</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="/part-identifier"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Part Identifier
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center justify-end flex-1">
          <Button asChild>
            <Link href="#upload-zone">
              Try it now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Trigger */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] p-6">
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

              <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Categories</p>
                <div className="flex flex-col gap-3 pl-4 border-l">
                  <Link
                    href="/wheels-rims"
                    className="text-base font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Wheels & Rims
                  </Link>
                  <Link
                    href="/truck-bed-covers"
                    className="text-base font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Truck Bed Covers
                  </Link>
                  <Link
                    href="/nerf-bars-running-boards"
                    className="text-base font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Running Boards
                  </Link>
                </div>
              </div>
              <Link
                href="/part-identifier"
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Part Identifier
              </Link>
              <div className="pt-4">
                <Button asChild className="w-full">
                  <Link href="#upload-zone" onClick={() => setIsOpen(false)}>
                    Try it now
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