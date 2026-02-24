"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
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
        <section className={cn("w-full bg-[#003223] py-24", className)}>
            <div className="container max-w-6xl text-center flex flex-col items-center px-4">
                <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
                    {content.headline}
                </h2>
                <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
                    {content.subtext}
                </p>

                {/* Learn More Collapsible Section (Homepage Only) */}
                {content.showLearnMore && (
                    <div className="mb-8 w-full max-w-md mx-auto">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center justify-center w-full text-base font-medium text-primary hover:text-primary/80 transition-colors group"
                        >
                            Learn more about My Garage
                            {isExpanded ? (
                                <ChevronUp className="ml-1 h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                            ) : (
                                <ChevronDown className="ml-1 h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="mt-6 text-left space-y-3 animate-in slide-in-from-top-2 fade-in duration-200 bg-white/5 p-6 rounded-xl border border-white/10">
                                <div className="flex items-start gap-3 text-base text-white/90">
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <span>Save identified vehicles and parts in one place</span>
                                </div>
                                <div className="flex items-start gap-3 text-base text-white/90">
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <span>Build a collection of your rides and dream builds</span>
                                </div>
                                <div className="flex items-start gap-3 text-base text-white/90">
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <span>Quickly re-find parts and fitment info anytime</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto mt-2">
                    <GoogleSignInButton
                        onClick={signInWithGoogle}
                        variant="filled"
                        size="large"
                        fullWidth={false}
                        className="w-full sm:w-auto"
                    />
                    <Button
                        variant="ghost"
                        size="lg"
                        className="w-full sm:w-auto text-white/60 hover:text-white hover:bg-white/10"
                        onClick={handleDismiss}
                    >
                        Maybe later
                    </Button>
                </div>
            </div>
        </section>
    )
}
