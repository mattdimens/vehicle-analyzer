/**
 * runPartIdentification with the Gemini client stubbed out: no network, no cost.
 *
 * Run: npm test
 */
// Set before anything reads it, so getAI() never sees a real key
process.env.GEMINI_API_KEY = 'test-placeholder-no-network'

import { getAI, SCOUT_MODEL, SNIPER_MODEL } from '../lib/gemini'
import { runPartIdentification, type ImagePart } from '../lib/analysis-stages'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
    if (condition) {
        passed++
        console.log(`  ✓ ${label}`)
    } else {
        failed++
        console.error(`  ✗ ${label}`)
    }
}

const part = (confidence: number, partName: string) => ({
    partName,
    category: 'Engine',
    function: 'Meters air into the engine.',
    estimatedVehicle: null,
    confidence,
    amazonSearchTerm: partName,
    reasoning: 'Shape and connector.',
})

/** Replaces generateContent with canned answers per model and records which models were called. */
function stubGemini(answers: Record<string, unknown>): string[] {
    const calls: string[] = []
    const models = getAI().models as unknown as { generateContent: (req: { model: string }) => Promise<{ text: string }> }
    models.generateContent = async ({ model }) => {
        calls.push(model)
        return { text: JSON.stringify(answers[model]) }
    }
    return calls
}

const imageParts: ImagePart[] = [{ inlineData: { data: '', mimeType: 'image/jpeg' } }]

async function run() {
    // Quiet the pipeline's own logging while the tests run
    const log = { log: console.log, warn: console.warn, error: console.error }
    const quiet = () => { console.warn = () => {}; console.error = () => {}; console.log = () => {} }
    const loud = () => Object.assign(console, log)

    console.log('\nrunPartIdentification')

    {
        const calls = stubGemini({ [SCOUT_MODEL]: part(95, 'Throttle Body') })
        let escalated = 0
        quiet()
        const res = await runPartIdentification(imageParts, { onEscalate: async () => { escalated++ } })
        loud()
        assert(calls.length === 1 && calls[0] === SCOUT_MODEL, 'confident scout: one call, no Sniper')
        assert(escalated === 0, 'confident scout: onEscalate not called')
        assert(res.identification.partName === 'Throttle Body' && res.modelUsed === SCOUT_MODEL, 'confident scout: scout result')
    }

    {
        const calls = stubGemini({ [SCOUT_MODEL]: part(60, 'MAF Sensor'), [SNIPER_MODEL]: part(90, 'Mass Air Flow Sensor') })
        const order: string[] = []
        quiet()
        const res = await runPartIdentification(imageParts, {
            onEscalate: async () => { order.push(`escalate after ${calls.length} call`) },
        })
        loud()
        assert(order.length === 1 && order[0] === 'escalate after 1 call', 'onEscalate runs once, after the scout and before the Sniper')
        assert(calls.join(',') === `${SCOUT_MODEL},${SNIPER_MODEL}`, 'unsure scout escalates to the Sniper')
        assert(res.identification.partName === 'Mass Air Flow Sensor' && res.modelUsed === SNIPER_MODEL, 'Sniper result wins')
    }

    {
        stubGemini({ [SCOUT_MODEL]: part(60, 'MAF Sensor'), [SNIPER_MODEL]: part(90, 'Mass Air Flow Sensor') })
        quiet()
        let res: Awaited<ReturnType<typeof runPartIdentification>> | null = null
        try {
            res = await runPartIdentification(imageParts, { onEscalate: async () => { throw new Error('database down') } })
        } catch {
            res = null
        }
        loud()
        assert(res?.identification.partName === 'Mass Air Flow Sensor', 'onEscalate throwing still returns the Sniper result')
    }

    {
        const calls = stubGemini({ [SCOUT_MODEL]: part(60, 'MAF Sensor'), [SNIPER_MODEL]: part(90, 'Mass Air Flow Sensor') })
        quiet()
        const res = await runPartIdentification(imageParts)
        loud()
        assert(calls.length === 2 && res.modelUsed === SNIPER_MODEL, 'no options (POST /api/analyze/part): cascade unchanged')
    }

    console.log(`\n${passed} passed, ${failed} failed`)
    if (failed > 0) process.exit(1)
}

run().catch(err => {
    console.error(err)
    process.exit(1)
})
