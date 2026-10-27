import { Metadata } from 'next'
import { AnalysisView } from '@/components/analysis/analysis-view'
import { getSupabaseAdmin } from '@/lib/pipeline'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    // Results stay out of search engines whatever they hold
    const robots = { index: false, follow: false }
    try {
        const { data } = await getSupabaseAdmin().from('analyses').select('kind').eq('id', id).maybeSingle()
        if (data?.kind === 'part') return { title: 'Part Identification Result', robots }
    } catch (err) {
        console.error('Result metadata lookup failed', err)
    }
    return { title: 'Analysis Results', robots }
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
