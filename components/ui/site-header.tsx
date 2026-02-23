"use client"

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, Upload } from 'lucide-react'
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
import { ChevronDown, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react"

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const isHomepage = pathname === '/'
  const { session, user, signInWithGoogle, signOut } = useAuth()

  const handleCtaClick = (e: React.MouseEvent) => {
    if (isHomepage) {
      e.preventDefault()
      const el = document.getElementById('upload-zone')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setIsOpen(false)
  }

  const ctaHref = isHomepage ? '#upload-zone' : '/#upload-zone'

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
            href="/#upload-zone"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Vehicle Analysis
          </Link>
          <Link
            href="/part-identifier"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Part Identifier
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary focus:outline-none">
              Categories <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/wheels-rims">Wheels &amp; Rims</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/truck-bed-covers">Truck Bed Covers</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/nerf-bars-running-boards">Running Boards</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Desktop CTA & Auth */}
        <div className="hidden md:flex items-center justify-end flex-1 gap-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-9 w-9 border border-border/50 hover:border-primary/50 transition-colors">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.user_metadata?.full_name && (
                      <p className="font-medium">{user.user_metadata.full_name}</p>
                    )}
                    {user?.email && (
                      <p className="w-[150px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/my-garage">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>My Garage</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" onClick={signInWithGoogle}>
              Sign In
            </Button>
          )}

          <Button asChild>
            <Link href={ctaHref} onClick={handleCtaClick}>
              <Upload className="mr-2 h-4 w-4" /> Upload Photo
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
                href="/#upload-zone"
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Vehicle Analysis
              </Link>
              <Link
                href="/part-identifier"
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Part Identifier
              </Link>

              <div className="py-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Categories</p>
                <div className="flex flex-col gap-3 pl-4 border-l">
                  <Link
                    href="/wheels-rims"
                    className="text-base font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Wheels &amp; Rims
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
              <div className="pt-4 flex flex-col gap-3 border-t">
                {session ? (
                  <>
                    <Link
                      href="/my-garage"
                      className="text-base font-medium hover:text-primary transition-colors flex items-center"
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" /> My Garage
                    </Link>
                    <button
                      onClick={() => {
                        signOut()
                        setIsOpen(false)
                      }}
                      className="text-base font-medium text-red-600 hover:text-red-700 transition-colors flex items-center text-left"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Button variant="outline" onClick={signInWithGoogle} className="w-full justify-start">
                    Sign In
                  </Button>
                )}

                <Button asChild className="w-full">
                  <Link href={ctaHref} onClick={handleCtaClick}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Photo
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