/**
 * Gemini model eval for the scout/sniper swap (docs/briefs/vf-model-swap-brief-nov-2026.md).
 *
 * Runs the exact production prompts and schemas from lib/analysis-stages.ts over a
 * fixed set of real photos, once per candidate model, and reports agreement with
 * the recorded production answer, Zod failures, latency, tokens and cost.
 *
 * It never touches production code paths and never writes to Supabase.
 *
 * Run (needs GEMINI_API_KEY; costs money, about 300 calls on a 50-photo set):
 *   npx tsx --env-file=.env.local scripts/eval-models.ts eval/test-set.csv
 *
 * Options:
 *   --only=label[,label]   run a subset of configs (see CONFIGS below)
 *   --limit=N              first N photos only (smoke test: --limit=2)
 *   --dry-run              parse the CSV and list the plan, no network calls
 *
 * Input CSV columns:
 *   id,kind,image_url,confidence,created_at,make,model,year,part_name,part_number
 *
 * To rebuild the test set, run this read-only query in the production Supabase
 * SQL editor and download the result as CSV to eval/test-set.csv:
 *
 *   (select id, kind, image_url, confidence, created_at,
 *           result_data->'primary'->>'make'  as make,
 *           result_data->'primary'->>'model' as model,
 *           result_data->'primary'->>'year'  as year,
 *           null as part_name, null as part_number
 *    from analyses
 *    where status = 'complete' and kind = 'vehicle' and created_at >= '2026-10-01'
 *    order by created_at desc limit 25)
 *   union all
 *   (select id, kind, image_url, confidence, created_at,
 *           null, null, null,
 *           result_data->>'partName', result_data->>'partNumber'
 *    from analyses
 *    where status = 'complete' and kind = 'part' and created_at >= '2026-10-01'
 *    order by created_at desc limit 25);
 *
 * Output: eval/results-YYYY-MM-DD.csv (one row per call) and eval/report-YYYY-MM-DD.md.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { z } from 'zod'
import { ThinkingLevel } from '@google/genai'
import { getAI, cleanJsonResponse, fetchImageForGemini, SCOUT_MODEL, SNIPER_MODEL } from '../lib/gemini'
import { buildFitmentPrompt, PART_PROMPT, type ImagePart } from '../lib/analysis-stages'
import { AnalysisResultsSchema, PartIdentificationSchema } from '../lib/schemas'

// ---------------------------------------------------------------------------
// Candidate configs. `config` is passed to generateContent exactly as written;
// production passes none, so "as production" means no config at all.
// Prices are USD per 1M tokens, paid tier, list price on 2026-11-12.
// ---------------------------------------------------------------------------
type Role = 'sniper' | 'scout'
type Config = {
    label: string
    role: Role
    model: string
    config?: { thinkingConfig?: { thinkingLevel?: ThinkingLevel } }
    priceIn: number
    priceOut: number
    note: string
}

const CONFIGS: Config[] = [
    { label: 'pro31', role: 'sniper', model: SNIPER_MODEL, priceIn: 2.0, priceOut: 12.0, note: 'current sniper, as production calls it' },
    { label: 'carbon', role: 'sniper', model: 'gemini-4-carbon', priceIn: 2.0, priceOut: 10.0, note: 'default thinking ($4/$20 from Dec 1)' },
    { label: 'carbon-low', role: 'sniper', model: 'gemini-4-carbon', config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }, priceIn: 2.0, priceOut: 10.0, note: 'thinkingLevel LOW ($4/$20 from Dec 1)' },
    { label: 'argon-low', role: 'sniper', model: 'gemini-4-argon', config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }, priceIn: 2.0, priceOut: 10.0, note: 'thinkingLevel LOW ($4/$20 from Dec 1)' },
    { label: 'flash36', role: 'scout', model: SCOUT_MODEL, priceIn: 0.75, priceOut: 3.75, note: 'current scout, as production calls it ($1.50/$7.50 from Jan 1)' },
    { label: 'flash38', role: 'scout', model: 'gemini-3.8-flash', priceIn: 0.75, priceOut: 3.75, note: 'as production would call it ($1.50/$7.50 from Jan 1)' },
]

const CONCURRENCY = 3 // 3.1 Pro Preview is capped at 25 RPM on Tier 1
const MAX_PHOTOS = 60
const MAX_CONFIGS = 6

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const PhotoSchema = z.object({
    id: z.string().min(1),
    kind: z.enum(['vehicle', 'part']),
    image_url: z.string().url(),
    confidence: z.coerce.number().default(0),
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.string().optional(),
    part_name: z.string().optional(),
    part_number: z.string().optional(),
})
type Photo = z.infer<typeof PhotoSchema>

/** Minimal RFC-4180 CSV parser (quoted fields, doubled quotes, CRLF). */
function parseCsv(text: string): Record<string, string>[] {
    const rows: string[][] = []
    let row: string[] = []
    let field = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
        const c = text[i]
        if (inQuotes) {
            if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
            else if (c === '"') inQuotes = false
            else field += c
        } else if (c === '"') inQuotes = true
        else if (c === ',') { row.push(field); field = '' }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++
            row.push(field); field = ''
            if (row.some((f) => f !== '')) rows.push(row)
            row = []
        } else field += c
    }
    row.push(field)
    if (row.some((f) => f !== '')) rows.push(row)
    const [header, ...body] = rows
    return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

function loadPhotos(path: string, limit?: number): Photo[] {
    const raw = parseCsv(readFileSync(path, 'utf8'))
    const photos = raw.map((r) => {
        // The SQL export writes SQL NULL as the string "null"; treat it as missing
        const clean = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v === 'null' ? '' : v]))
        return PhotoSchema.parse(clean)
    })
    return photos.slice(0, Math.min(limit ?? MAX_PHOTOS, MAX_PHOTOS))
}

// ---------------------------------------------------------------------------
// One call
// ---------------------------------------------------------------------------
type CallResult = {
    label: string
    model: string
    photoId: string
    kind: Photo['kind']
    ok: boolean
    parsed: boolean
    zodOk: boolean
    latencyMs: number
    inTokens: number
    outTokens: number
    thoughtTokens: number
    answer: string // normalized short answer for agreement
    answerFull: string // the fields that matter, as JSON
    recorded: string
    agree: boolean
    error: string
}

function norm(s: unknown): string {
    return String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** make + model for vehicles, partName for parts */
function recordedAnswer(p: Photo): string {
    if (p.kind === 'vehicle') return norm(`${p.make ?? ''} ${p.model ?? ''}`)
    return norm(p.part_name)
}

function vehicleAgrees(answer: string, recorded: string): boolean {
    // Recorded "Unknown" counts as a miss for both sides unless the model also says unknown
    if (!recorded || recorded === 'unknown unknown') return answer === recorded || answer.includes('unknown')
    return answer === recorded
}

function partAgrees(answer: string, recorded: string): boolean {
    if (!recorded) return false
    if (answer === recorded) return true
    // Loose match: every word of the shorter name appears in the longer one
    const a = new Set(answer.split(' '))
    const r = new Set(recorded.split(' '))
    const [short, long] = a.size <= r.size ? [a, r] : [r, a]
    return [...short].every((w) => long.has(w))
}

async function sleep(ms: number) {
    await new Promise((r) => setTimeout(r, ms))
}

async function runOne(cfg: Config, photo: Photo, imageParts: ImagePart[]): Promise<CallResult> {
    const prompt = photo.kind === 'vehicle' ? buildFitmentPrompt() : PART_PROMPT
    const base: CallResult = {
        label: cfg.label, model: cfg.model, photoId: photo.id, kind: photo.kind,
        ok: false, parsed: false, zodOk: false, latencyMs: 0, inTokens: 0, outTokens: 0, thoughtTokens: 0,
        answer: '', answerFull: '', recorded: recordedAnswer(photo), agree: false, error: '',
    }

    for (let attempt = 0; attempt < 2; attempt++) {
        const started = Date.now()
        try {
            const response = await getAI().models.generateContent({
                model: cfg.model,
                contents: [{ role: 'user' as const, parts: [{ text: prompt }, ...imageParts] }],
                ...(cfg.config ? { config: cfg.config } : {}),
            })
            base.latencyMs = Date.now() - started
            base.ok = true
            const usage = response.usageMetadata
            base.inTokens = usage?.promptTokenCount ?? 0
            base.outTokens = usage?.candidatesTokenCount ?? 0
            base.thoughtTokens = usage?.thoughtsTokenCount ?? 0

            let json: unknown
            try { json = JSON.parse(cleanJsonResponse(response.text ?? '')) } catch { json = undefined }
            base.parsed = json !== undefined && typeof json === 'object'
            if (!base.parsed) { base.error = 'not JSON'; return base }

            if (photo.kind === 'vehicle') {
                const z1 = AnalysisResultsSchema.safeParse(json)
                base.zodOk = z1.success
                const primary = (json as { primary?: Record<string, unknown> }).primary ?? {}
                base.answer = norm(`${primary.make ?? ''} ${primary.model ?? ''}`)
                base.answerFull = JSON.stringify({
                    make: primary.make, model: primary.model, year: primary.year, trim: primary.trim,
                    confidence: primary.confidence, confidence_score: (json as Record<string, unknown>).confidence_score,
                    vehicle_present: (json as Record<string, unknown>).vehicle_present,
                })
                base.agree = vehicleAgrees(base.answer, base.recorded)
            } else {
                const z1 = PartIdentificationSchema.safeParse(json)
                base.zodOk = z1.success
                const j = json as Record<string, unknown>
                base.answer = norm(j.partName)
                base.answerFull = JSON.stringify({
                    partName: j.partName, partNumber: j.partNumber ?? null, searchVehicle: j.searchVehicle ?? null, confidence: j.confidence,
                })
                base.agree = partAgrees(base.answer, base.recorded)
            }
            if (!base.zodOk) base.error = 'zod'
            return base
        } catch (err) {
            base.latencyMs = Date.now() - started
            const message = err instanceof Error ? err.message : String(err)
            base.error = message.slice(0, 300)
            const status = (err as { status?: number }).status
            if ((status === 429 || /429|RESOURCE_EXHAUSTED/.test(message)) && attempt === 0) {
                await sleep(15_000)
                continue
            }
            return base
        }
    }
    return base
}

// ---------------------------------------------------------------------------
// Pool
// ---------------------------------------------------------------------------
async function pool<T>(items: (() => Promise<T>)[], size: number, onDone: (done: number) => void): Promise<T[]> {
    const out: T[] = new Array(items.length)
    let next = 0
    let done = 0
    async function worker() {
        while (next < items.length) {
            const i = next++
            out[i] = await items[i]()
            onDone(++done)
        }
    }
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker))
    return out
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
function pct(n: number, d: number) { return d ? `${Math.round((100 * n) / d)}%` : '-' }
function quantile(xs: number[], q: number) {
    if (!xs.length) return 0
    const s = [...xs].sort((a, b) => a - b)
    return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]
}
function money(x: number) { return `$${x.toFixed(2)}` }

function csvCell(v: unknown) {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function summaryTable(results: CallResult[], cfgs: Config[], kind: Photo['kind'] | 'all'): string {
    const lines = [
        '| Config | Model | Calls | API errors | Not JSON | Zod fail | Agree w/ recorded | p50 ms | p90 ms | In tok | Out tok (incl. thinking) | $ / 1,000 calls |',
        '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ]
    for (const cfg of cfgs) {
        const rs = results.filter((r) => r.label === cfg.label && (kind === 'all' || r.kind === kind))
        if (!rs.length) continue
        const okRs = rs.filter((r) => r.ok)
        const lat = okRs.map((r) => r.latencyMs)
        const inAvg = okRs.reduce((s, r) => s + r.inTokens, 0) / (okRs.length || 1)
        const outAvg = okRs.reduce((s, r) => s + r.outTokens + r.thoughtTokens, 0) / (okRs.length || 1)
        const perCall = (inAvg * cfg.priceIn + outAvg * cfg.priceOut) / 1_000_000
        lines.push(
            `| ${cfg.label} | ${cfg.model} | ${rs.length} | ${rs.length - okRs.length} | ${okRs.filter((r) => !r.parsed).length} | ${okRs.filter((r) => r.parsed && !r.zodOk).length} | ${pct(rs.filter((r) => r.agree).length, rs.length)} | ${quantile(lat, 0.5)} | ${quantile(lat, 0.9)} | ${Math.round(inAvg)} | ${Math.round(outAvg)} | ${money(perCall * 1000)} |`
        )
    }
    return lines.join('\n')
}

function disagreements(results: CallResult[], photos: Photo[], cfgs: Config[], role: Role): string {
    const labels = cfgs.filter((c) => c.role === role).map((c) => c.label)
    const lines = [`| Photo | Kind | Recorded | ${labels.join(' | ')} |`, `|---|---|---|${labels.map(() => '---').join('|')}|`]
    for (const p of photos) {
        const rs = labels.map((l) => results.find((r) => r.label === l && r.photoId === p.id))
        if (rs.every((r) => r?.agree)) continue
        const cells = rs.map((r) => (r ? (r.ok ? (r.answerFull || r.error) : `ERR ${r.error}`) : '-'))
        lines.push(`| ${p.id} | ${p.kind} | ${p.kind === 'vehicle' ? `${p.make} ${p.model} ${p.year}` : `${p.part_name}${p.part_number ? ` (${p.part_number})` : ''}`} | ${cells.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |`)
    }
    return lines.length > 2 ? lines.join('\n') : '_All configs agree with the recorded answer on every photo._'
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    const args = process.argv.slice(2)
    const csvPath = args.find((a) => !a.startsWith('--'))
    if (!csvPath) {
        console.error('Usage: npx tsx --env-file=.env.local scripts/eval-models.ts eval/test-set.csv [--only=a,b] [--limit=N] [--dry-run]')
        process.exit(1)
    }
    const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',').filter(Boolean)
    const limit = Number(args.find((a) => a.startsWith('--limit='))?.slice(8)) || undefined
    const dryRun = args.includes('--dry-run')

    const cfgs = (only ? CONFIGS.filter((c) => only.includes(c.label)) : CONFIGS).slice(0, MAX_CONFIGS)
    if (!cfgs.length) { console.error('No configs match --only'); process.exit(1) }
    const photos = loadPhotos(resolve(csvPath), limit)
    const totalCalls = photos.length * cfgs.length

    console.log(`Photos: ${photos.length} (${photos.filter((p) => p.kind === 'vehicle').length} vehicle, ${photos.filter((p) => p.kind === 'part').length} part)`)
    console.log(`Configs: ${cfgs.map((c) => `${c.label}=${c.model}`).join(', ')}`)
    console.log(`Calls planned: ${totalCalls}`)
    if (dryRun) return
    if (!process.env.GEMINI_API_KEY) { console.error('GEMINI_API_KEY is not set'); process.exit(1) }

    console.log('Fetching photos...')
    const images = new Map<string, ImagePart[]>()
    for (const p of photos) {
        try { images.set(p.id, [await fetchImageForGemini(p.image_url)]) }
        catch (err) { console.warn(`  skip ${p.id}: ${err instanceof Error ? err.message : err}`) }
    }
    const usable = photos.filter((p) => images.has(p.id))
    console.log(`Fetched ${usable.length}/${photos.length}. Running ${usable.length * cfgs.length} calls, ${CONCURRENCY} at a time...`)

    const jobs: (() => Promise<CallResult>)[] = []
    for (const cfg of cfgs) for (const p of usable) jobs.push(() => runOne(cfg, p, images.get(p.id)!))
    const started = Date.now()
    const results = await pool(jobs, CONCURRENCY, (done) => {
        if (done % 10 === 0 || done === jobs.length) console.log(`  ${done}/${jobs.length} (${Math.round((Date.now() - started) / 1000)}s)`)
    })

    const date = new Date().toISOString().slice(0, 10)
    const outDir = resolve('eval')
    mkdirSync(outDir, { recursive: true })

    const csvHeader = ['label', 'model', 'photo_id', 'kind', 'ok', 'parsed', 'zod_ok', 'agree', 'latency_ms', 'in_tokens', 'out_tokens', 'thought_tokens', 'recorded', 'answer', 'answer_full', 'error']
    const csv = [csvHeader.join(',')].concat(results.map((r) => [
        r.label, r.model, r.photoId, r.kind, r.ok, r.parsed, r.zodOk, r.agree, r.latencyMs, r.inTokens, r.outTokens, r.thoughtTokens, r.recorded, r.answer, r.answerFull, r.error,
    ].map(csvCell).join(','))).join('\n')
    const csvOut = join(outDir, `results-${date}.csv`)
    writeFileSync(csvOut, csv)

    const totalIn = results.reduce((s, r) => s + r.inTokens, 0)
    const totalOut = results.reduce((s, r) => s + r.outTokens + r.thoughtTokens, 0)
    const totalCost = cfgs.reduce((s, c) => {
        const rs = results.filter((r) => r.label === c.label)
        return s + (rs.reduce((a, r) => a + r.inTokens, 0) * c.priceIn + rs.reduce((a, r) => a + r.outTokens + r.thoughtTokens, 0) * c.priceOut) / 1_000_000
    }, 0)

    const report = [
        `# Model eval, ${date}`,
        '',
        `${usable.length} photos (${usable.filter((p) => p.kind === 'vehicle').length} vehicle, ${usable.filter((p) => p.kind === 'part').length} part), ${results.length} calls, ${Math.round((Date.now() - started) / 1000)}s wall clock.`,
        `Tokens: ${totalIn.toLocaleString()} in, ${totalOut.toLocaleString()} out (incl. thinking). Eval cost at list price: ${money(totalCost)}.`,
        '',
        '"Agree w/ recorded" compares make+model (vehicles) or part name (parts) with what production answered at the time, so it measures consistency with the current sniper as much as correctness. The disagreement tables below are where to judge which answer is actually right.',
        '',
        '## Configs',
        '',
        ...cfgs.map((c) => `- **${c.label}**: \`${c.model}\`, ${c.note}, $${c.priceIn} in / $${c.priceOut} out per 1M`),
        '',
        '## Sniper candidates',
        '',
        '### All photos', '', summaryTable(results, cfgs.filter((c) => c.role === 'sniper'), 'all'), '',
        '### Vehicles', '', summaryTable(results, cfgs.filter((c) => c.role === 'sniper'), 'vehicle'), '',
        '### Parts', '', summaryTable(results, cfgs.filter((c) => c.role === 'sniper'), 'part'), '',
        '### Disagreements (sniper)', '', disagreements(results, usable, cfgs, 'sniper'), '',
        '## Scout candidates',
        '',
        '### All photos', '', summaryTable(results, cfgs.filter((c) => c.role === 'scout'), 'all'), '',
        '### Vehicles', '', summaryTable(results, cfgs.filter((c) => c.role === 'scout'), 'vehicle'), '',
        '### Parts', '', summaryTable(results, cfgs.filter((c) => c.role === 'scout'), 'part'), '',
        '### Disagreements (scout)', '', disagreements(results, usable, cfgs, 'scout'), '',
    ].join('\n')
    const mdOut = join(outDir, `report-${date}.md`)
    writeFileSync(mdOut, report)

    console.log('\n' + report)
    console.log(`\nWrote ${csvOut} and ${mdOut}`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
