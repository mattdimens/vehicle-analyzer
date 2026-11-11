/**
 * Wiring checks for lib/alerts.ts with a fake Supabase client and a fake
 * fetch: no network, no database.
 *
 * Run: npm test
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'
import { notifyAnalysisFailure, sendAlertEmail } from '../lib/alerts'

let passed = 0
let failed = 0
function assert(condition: boolean, label: string) {
    if (condition) { passed++; console.log(`  ✓ ${label}`) } else { failed++; console.error(`  ✗ ${label}`) }
}

type Row = { id: string; error_details: string | null; updated_at: string }

function fakeSupabase(rows: Row[] | null) {
    const chain = {
        select: () => chain,
        eq: () => chain,
        gte: () => chain,
        order: () => chain,
        limit: async () => (rows ? { data: rows, error: null } : { data: null, error: { message: 'db down' } }),
    }
    return { from: () => chain } as unknown as SupabaseClient<Database>
}

const sent: { subject: string; to: string[] }[] = []
const realFetch = globalThis.fetch
globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)))
    return new Response('{"id":"x"}', { status: 200 })
}) as typeof fetch

const billing = '{"error":{"code":402,"message":"Your prepayment credits are depleted."}}'
const now = Date.now()
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString()

async function main() {
    console.log('\nalerts (fake Supabase and fetch)')

    delete process.env.RESEND_API_KEY
    delete process.env.ALERT_EMAIL
    const unconfigured = await sendAlertEmail({ subject: 's', text: 't' })
    assert(!unconfigured.sent && sent.length === 0, 'without keys nothing is sent and nothing throws')

    process.env.RESEND_API_KEY = 're_test'
    process.env.ALERT_EMAIL = 'alerts@example.com'

    await notifyAnalysisFailure(fakeSupabase([{ id: 'a', error_details: billing, updated_at: iso(1) }]), 'a')
    assert(sent.length === 1 && sent[0].subject === 'VisualFitment: analyses failing (billing)', 'first billing failure sends one email')
    assert(sent[0].to[0] === 'alerts@example.com', 'email goes to ALERT_EMAIL')

    await notifyAnalysisFailure(fakeSupabase([
        { id: 'a', error_details: billing, updated_at: iso(30) },
        { id: 'b', error_details: billing, updated_at: iso(1) },
    ]), 'b')
    assert(sent.length === 1, 'second billing failure within 6 hours sends nothing')

    await notifyAnalysisFailure(fakeSupabase(null), 'c')
    assert(sent.length === 1, 'a database error sends nothing and does not throw')

    globalThis.fetch = (async () => { throw new Error('network down') }) as typeof fetch
    const down = await sendAlertEmail({ subject: 's', text: 't' })
    assert(!down.sent, 'a failed send is reported, not thrown')

    globalThis.fetch = realFetch
    console.log(`\n${passed} passed, ${failed} failed`)
    if (failed > 0) process.exit(1)
}

main()
