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
        <div className="min-h-screen bg-[#EEF3F6] pb-12 pt-4 md:pt-7">
            <div className="container">
                <AnalysisView id={id} />
            </div>
        </div>
    )
}
