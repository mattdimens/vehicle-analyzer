import { cache } from 'react'
import { Metadata } from 'next'
import { AnalysisView } from '@/components/analysis/analysis-view'
import { pageBackgroundClass } from '@/components/results/tokens'
import { getSupabaseAdmin } from '@/lib/pipeline'
import type { AnalysisKind } from '@/types/analysis'

/** The row's kind, looked up once per request for both the metadata and the loading screen. Null if the lookup fails. */
const getAnalysisKind = cache(async (id: string): Promise<AnalysisKind | null> => {
    try {
        const { data } = await getSupabaseAdmin().from('analyses').select('kind').eq('id', id).maybeSingle()
        return data?.kind === 'part' ? 'part' : 'vehicle'
    } catch (err) {
        console.error('Result kind lookup failed', err)
        return null
    }
})

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    // Results stay out of search engines whatever they hold
    const robots = { index: false, follow: false }
    if (await getAnalysisKind(id) === 'part') return { title: 'Part Identification Result', robots }
    return { title: 'Analysis Results', robots }
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    // Picks the part or vehicle loading screen before the first fetch returns
    const kind = await getAnalysisKind(id)
    return (
        <div className={`min-h-screen ${pageBackgroundClass} pb-12 pt-4 md:pt-7`}>
            <div className="container">
                <AnalysisView id={id} initialKind={kind ?? undefined} />
            </div>
        </div>
    )
}
