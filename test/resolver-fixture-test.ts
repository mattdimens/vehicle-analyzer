import { getConfidence, getConfidenceBand, AnalysisRecord } from '../types/analysis'

function runTests() {
    console.log("Running Confidence Resolver Tests...")
    const baseRecord: Partial<AnalysisRecord> = {
        id: 'test',
        result_data: {
            primary: {
                make: 'Toyota',
                model: 'Tacoma',
                year: '2020',
                confidence: null as any
            }
        }
    }

    // 1. Only confidence_score
    const rec1 = JSON.parse(JSON.stringify(baseRecord))
    rec1.confidence_score = 60
    
    // 2. Only top-level confidence
    const rec2 = JSON.parse(JSON.stringify(baseRecord))
    rec2.confidence = 60

    // 3. Only primary.confidence
    const rec3 = JSON.parse(JSON.stringify(baseRecord))
    rec3.result_data.primary.confidence = 60

    // 4. Missing confidence
    const rec4 = JSON.parse(JSON.stringify(baseRecord))

    const conf1 = getConfidence(rec1 as AnalysisRecord)
    const conf2 = getConfidence(rec2 as AnalysisRecord)
    const conf3 = getConfidence(rec3 as AnalysisRecord)
    const conf4 = getConfidence(rec4 as AnalysisRecord)

    console.log("Rec 1 (confidence_score):", conf1, "Band:", getConfidenceBand(conf1))
    console.log("Rec 2 (confidence):", conf2, "Band:", getConfidenceBand(conf2))
    console.log("Rec 3 (primary.confidence):", conf3, "Band:", getConfidenceBand(conf3))
    console.log("Rec 4 (none):", conf4, "Band:", getConfidenceBand(conf4))

    if (conf1 === 60 && conf2 === 60 && conf3 === 60 && conf4 === 0) {
        console.log("SUCCESS: All fixtures resolved correctly.")
    } else {
        console.error("FAILED")
    }
}

runTests()
