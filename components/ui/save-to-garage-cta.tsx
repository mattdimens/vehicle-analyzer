"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { X, CheckCircle2, ChevronDown, ChevronUp, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GoogleSignInButton } from "@/components/GoogleSignInButton"
import { cn } from "@/lib/utils"

export type CTAPlacement = "homepage" | "category" | "results"

interface SaveToGarageCTAProps {
    placement: CTAPlacement
    categoryName?: string
    className?: string
}

const DISMISSED_STORAGE_KEY = "has_dismissed_garage_cta"

export function SaveToGarageCTA({ placement, categoryName, className }: SaveToGarageCTAProps) {
    const { session, signInWithGoogle } = useAuth()
    const [isVisible, setIsVisible] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Check session storage to see if user dismissed it this session
        const hasDismissed = sessionStorage.getItem(DISMISSED_STORAGE_KEY)
        if (!hasDismissed && !session) {
            setIsVisible(true)
        }
    }, [session])

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISSED_STORAGE_KEY, "true")
        setIsVisible(false)
    }

    // Don't render anything until mounted to prevent hydration mismatches
    // Also don't render if they are logged in or have dismissed it
    if (!mounted || !isVisible || session) return null

    const getContent = () => {
        switch (placement) {
            case "homepage":
                return {
                    headline: "Your Garage. Your Vehicles. Always Saved.",
                    subtext: "Sign in to save every vehicle and part you identify. Build your personal garage, revisit past lookups, and get recommendations tailored to your rides.",
                    showLearnMore: true,
                }
            case "category":
                const name = categoryName || "parts"
                return {
                    headline: `Found the right ${name}? Save it for later.`,
                    subtext: "Sign in to save this to your garage and never lose track of parts that fit your vehicle.",
                    showLearnMore: false,
                }
            case "results":
                return {
                    headline: "Great find! Save this to your garage.",
                    subtext: "Sign in to keep this identification and all compatible parts saved to your personal garage.",
                    showLearnMore: false,
                }
        }
    }

    const content = getContent()

    return (
        <div className={cn(
            "relative w-full rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-white p-6 shadow-sm overflow-hidden",
            className
        )}>
            {/* Dismiss Button */}
            <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col md:flex-row gap-6 md:items-start">

                {/* Icon Column */}
                <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <LayoutDashboard className="h-6 w-6" />
                </div>

                {/* Content Column */}
                <div className="flex-1 space-y-4 pr-6 md:pr-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2 md:hidden">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-foreground">
                                {content.headline}
                            </h3>
                        </div>
                        <h3 className="hidden md:block font-heading text-xl font-bold text-foreground mb-2">
                            {content.headline}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {content.subtext}
                        </p>
                    </div>

                    {/* Learn More Collapsible Section (Homepage Only) */}
                    {content.showLearnMore && (
                        <div className="pt-2">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center text-sm font-medium text-primary hover:underline group"
                            >
                                Learn more about My Garage
                                {isExpanded ? (
                                    <ChevronUp className="ml-1 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                                ) : (
                                    <ChevronDown className="ml-1 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                                )}
                            </button>

                            {isExpanded && (
                                <div className="mt-4 grid gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                    <div className="flex items-start gap-2 text-sm text-foreground/80">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <span>Save identified vehicles and parts in one place</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-foreground/80">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <span>Build a collection of your rides and dream builds</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-foreground/80">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <span>Quickly re-find parts and fitment info anytime</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <GoogleSignInButton
                            onClick={signInWithGoogle}
                            variant="filled"
                            size="medium"
                            fullWidth={false}
                            className="w-full sm:w-auto"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full sm:w-auto text-muted-foreground"
                            onClick={handleDismiss}
                        >
                            Maybe later
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
