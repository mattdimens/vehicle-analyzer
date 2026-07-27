import { Metadata } from 'next'
import { AnalysisView } from '@/components/analysis/analysis-view'

export const metadata: Metadata = {
    title: 'Analysis Results',
    robots: {
        index: false,
        follow: false,
    },
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center pt-8">
            <div className="container max-w-4xl px-4">
                <AnalysisView id={id} />
            </div>
        </main>
    )
}
