'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[300px]">
                    <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground text-sm max-w-md mb-6">
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <Button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        variant="outline"
                    >
                        Try Again
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
