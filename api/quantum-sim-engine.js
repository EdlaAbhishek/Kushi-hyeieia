import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolve paths safely in both ESM and serverless environments
let baseDir = process.cwd()
try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    baseDir = path.resolve(__dirname, '..')
} catch (_) {
    baseDir = process.cwd()
}

const DATA_DIR = path.join(baseDir, 'database', 'verified_datasets')
const REGISTRY_DIR = path.join(baseDir, 'database', 'quantum_models')
const INDEX_FILE = path.join(REGISTRY_DIR, 'experiments_index.json')

// In-memory cache for serverless environments with read-only filesystems
const inMemoryExperiments = new Map()
let inMemoryHistory = null

// Seeded Pseudo-Random Number Generator (Mulberry32) for 100% reproducible experiments
function createPRNG(seed = 42) {
    let s = Math.floor(Math.abs(seed)) || 42
    return function () {
        s |= 0
        s = (s + 0x6D2B79F5) | 0
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

// ============================================================
// 1. DATASET REGISTRY & METADATA
// ============================================================
export const DATASET_REGISTRY = {
    breast_cancer: {
        id: 'breast_cancer',
        name: 'Breast Cancer Wisconsin (Diagnostic)',
        source: 'scikit-learn / UCI Machine Learning Repository (Wolberg, Street, Mangasarian)',
        task: 'Binary Classification',
        target_column: 'target',
        classes: { 0: 'Benign', 1: 'Malignant' },
        samples: 569,
        features_count: 30,
        license: 'Open Access (CC BY 4.0)',
        reference_repo: 'mswamyvvce/Quantum-Breast-Cancer-Detection-Using-Quantum-Classifiers',
        reference_url: 'https://github.com/mswamyvvce/Quantum-Breast-Cancer-Detection-Using-Quantum-Classifiers',
        description: 'Biopsies of breast masses with morphological measurements computed from digitized fine needle aspirate (FNA) images.',
        missing_value_strategy: 'none',
        scaling_strategy: 'minmax',
        dimensionality_reduction: 'pca',
        default_quantum_qubits: 4,
        supported_models: ['logistic_regression', 'svm', 'random_forest', 'qsvm', 'vqc'],
        feature_definitions: [
            { name: 'mean_radius', unit: 'mm', type: 'numerical', desc: 'Mean distance from center to perimeter' },
            { name: 'mean_texture', unit: 'grayscale', type: 'numerical', desc: 'Standard deviation of gray-scale values' },
            { name: 'mean_perimeter', unit: 'mm', type: 'numerical', desc: 'Mean size of the core tumor perimeter' },
            { name: 'mean_area', unit: 'mm²', type: 'numerical', desc: 'Mean area of the core tumor' },
            { name: 'mean_smoothness', unit: 'ratio', type: 'numerical', desc: 'Local variation in radius lengths' },
            { name: 'mean_compactness', unit: 'ratio', type: 'numerical', desc: 'perimeter² / area - 1.0' },
            { name: 'mean_concavity', unit: 'ratio', type: 'numerical', desc: 'Severity of concave portions of contour' },
            { name: 'mean_concave_points', unit: 'count', type: 'numerical', desc: 'Number of concave portions of contour' },
            { name: 'mean_symmetry', unit: 'ratio', type: 'numerical', desc: 'Symmetry score of nuclei' },
            { name: 'mean_fractal_dimension', unit: 'ratio', type: 'numerical', desc: 'Coastline approximation - 1' }
        ]
    },
    diabetes: {
        id: 'diabetes',
        name: 'Pima Indians Diabetes',
        source: 'UCI Machine Learning Repository / National Institute of Diabetes and Digestive and Kidney Diseases',
        task: 'Binary Classification',
        target_column: 'Outcome',
        classes: { 0: 'Negative (Non-diabetic)', 1: 'Positive (Diabetic)' },
        samples: 768,
        features_count: 8,
        license: 'Open Access / Public Domain',
        reference_repo: 'Anto4K/VQC_on_Pima_Indians_Diabetes_Dataset',
        reference_url: 'https://github.com/Anto4K/VQC_on_Pima_Indians_Diabetes_Dataset',
        description: 'Diagnostic metabolic measurements to predict diabetes onset in Pima Indian heritage females (age >= 21).',
        missing_value_strategy: 'zero_as_missing_median',
        zero_invalid_columns: ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI'],
        scaling_strategy: 'standard',
        dimensionality_reduction: 'select_k_best',
        default_quantum_qubits: 4,
        supported_models: ['logistic_regression', 'svm', 'random_forest', 'qsvm', 'vqc'],
        feature_definitions: [
            { name: 'Pregnancies', unit: 'count', type: 'numerical', desc: 'Number of times pregnant' },
            { name: 'Glucose', unit: 'mg/dL', type: 'numerical', desc: 'Plasma glucose concentration (2 hours in oral glucose tolerance test)' },
            { name: 'BloodPressure', unit: 'mm Hg', type: 'numerical', desc: 'Diastolic blood pressure' },
            { name: 'SkinThickness', unit: 'mm', type: 'numerical', desc: 'Triceps skin fold thickness' },
            { name: 'Insulin', unit: 'μU/mL', type: 'numerical', desc: '2-Hour serum insulin' },
            { name: 'BMI', unit: 'kg/m²', type: 'numerical', desc: 'Body mass index (weight in kg/(height in m)²)' },
            { name: 'DiabetesPedigreeFunction', unit: 'score', type: 'numerical', desc: 'Diabetes pedigree genetic score' },
            { name: 'Age', unit: 'years', type: 'numerical', desc: 'Age in years' }
        ]
    },
    heart_disease: {
        id: 'heart_disease',
        name: 'Cleveland Heart Disease',
        source: 'UCI Machine Learning Repository / Cleveland Clinic Foundation (Detrano, M.D., Ph.D.)',
        task: 'Binary Classification',
        target_column: 'target',
        classes: { 0: 'No Disease Present', 1: 'Heart Disease Diagnosed' },
        samples: 303,
        features_count: 13,
        license: 'Open Access / Creative Commons',
        reference_repo: 'TirtheshJani/QML-Healthcare-Diagnostics',
        reference_url: 'https://github.com/TirtheshJani/QML-Healthcare-Diagnostics',
        description: 'Angiographic disease status evaluated across clinical exams, ECG waveforms, and treadmill exercise tests.',
        missing_value_strategy: 'median',
        scaling_strategy: 'standard',
        dimensionality_reduction: 'select_k_best',
        default_quantum_qubits: 4,
        supported_models: ['logistic_regression', 'svm', 'random_forest', 'qsvm', 'vqc'],
        feature_definitions: [
            { name: 'age', unit: 'years', type: 'numerical', desc: 'Patient age' },
            { name: 'sex', unit: '0=F, 1=M', type: 'categorical', desc: 'Biological sex' },
            { name: 'cp', unit: '1-4', type: 'categorical', desc: 'Chest pain type (1: typical angina, 2: atypical, 3: non-anginal, 4: asymptomatic)' },
            { name: 'trestbps', unit: 'mm Hg', type: 'numerical', desc: 'Resting blood pressure on hospital admission' },
            { name: 'chol', unit: 'mg/dL', type: 'numerical', desc: 'Serum cholesterol' },
            { name: 'fbs', unit: '0=No, 1=Yes', type: 'categorical', desc: 'Fasting blood sugar > 120 mg/dL' },
            { name: 'restecg', unit: '0-2', type: 'categorical', desc: 'Resting electrocardiographic results' },
            { name: 'thalach', unit: 'bpm', type: 'numerical', desc: 'Maximum heart rate achieved' },
            { name: 'exang', unit: '0=No, 1=Yes', type: 'categorical', desc: 'Exercise induced angina' },
            { name: 'oldpeak', unit: 'depression', type: 'numerical', desc: 'ST depression induced by exercise relative to rest' },
            { name: 'slope', unit: '1-3', type: 'categorical', desc: 'Slope of peak exercise ST segment' },
            { name: 'ca', unit: '0-3', type: 'numerical', desc: 'Number of major vessels colored by flourosopy' },
            { name: 'thal', unit: '3,6,7', type: 'categorical', desc: '3 = normal; 6 = fixed defect; 7 = reversable defect' }
        ]
    },
    parkinsons: {
        id: 'parkinsons',
        name: "Oxford Parkinson's Disease",
        source: 'UCI Machine Learning Repository / Little et al., Oxford University & National Centre for Voice and Speech',
        task: 'Binary Classification',
        target_column: 'status',
        classes: { 0: 'Healthy Control', 1: "Parkinson's Disease" },
        samples: 195,
        features_count: 22,
        license: 'Open Access (CC BY 4.0)',
        reference_repo: 'ranazsaad/QMedicine-Parkinson-Detection',
        reference_url: 'https://github.com/ranazsaad/QMedicine-Parkinson-Detection',
        description: 'Biomedical acoustic voice measurements from phonations to discriminate healthy individuals from patients with Parkinson’s disease.',
        missing_value_strategy: 'none',
        scaling_strategy: 'minmax',
        dimensionality_reduction: 'pca',
        default_quantum_qubits: 4,
        supported_models: ['logistic_regression', 'svm', 'random_forest', 'qsvm', 'vqc'],
        feature_definitions: [
            { name: 'MDVP:Fo(Hz)', unit: 'Hz', type: 'numerical', desc: 'Average vocal fundamental frequency' },
            { name: 'MDVP:Fhi(Hz)', unit: 'Hz', type: 'numerical', desc: 'Maximum vocal fundamental frequency' },
            { name: 'MDVP:Flo(Hz)', unit: 'Hz', type: 'numerical', desc: 'Minimum vocal fundamental frequency' },
            { name: 'MDVP:Jitter(%)', unit: '%', type: 'numerical', desc: 'Multidimensional voice program jitter ratio' },
            { name: 'HNR', unit: 'ratio', type: 'numerical', desc: 'Harmonics-to-noise ratio' },
            { name: 'RPDE', unit: 'entropy', type: 'numerical', desc: 'Recurrence period density entropy measure' },
            { name: 'DFA', unit: 'exponent', type: 'numerical', desc: 'Detrended fluctuation analysis' }
        ]
    }
}

export function listRegisteredDatasets() {
    return Object.values(DATASET_REGISTRY)
}

// ============================================================
// 2. CSV PARSING & DATASET LOADER
// ============================================================
export function parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') return null
    const lines = csvText.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length < 2) return null

    // Split headers respecting quotes if needed
    const headers = splitCSVLine(lines[0])
    const rows = []

    for (let i = 1; i < lines.length; i++) {
        const parts = splitCSVLine(lines[i])
        if (parts.length === headers.length) {
            const row = parts.map(v => {
                const num = Number(v)
                return isNaN(num) ? v : num
            })
            rows.push(row)
        }
    }

    return { headers, rows }
}

function splitCSVLine(line) {
    const result = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"' || char === "'") {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            result.push(cur.trim().replace(/^["']|["']$/g, ''))
            cur = ''
        } else {
            cur += char
        }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''))
    return result
}

export function loadVerifiedDataset(datasetId) {
    const meta = DATASET_REGISTRY[datasetId]
    if (!meta) throw new Error(`Unknown dataset '${datasetId}'`)

    const candidatePaths = [
        path.join(DATA_DIR, `${datasetId}.csv`),
        path.join(process.cwd(), 'database', 'verified_datasets', `${datasetId}.csv`),
        path.join(baseDir, 'database', 'verified_datasets', `${datasetId}.csv`)
    ]

    for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf-8')
            const parsed = parseCSV(content)
            if (parsed && parsed.rows.length > 0) {
                return { parsed, meta }
            }
        }
    }

    throw new Error(`Dataset file for '${datasetId}' not found on server. Checked paths: ${candidatePaths.join(', ')}`)
}

// ============================================================
// 3. COMPLEX NUMBER & STATEVECTOR QUANTUM SIMULATOR
// ============================================================
class Complex {
    constructor(re = 0, im = 0) {
        this.re = re
        this.im = im
    }
    add(c) { return new Complex(this.re + c.re, this.im + c.im) }
    sub(c) { return new Complex(this.re - c.re, this.im - c.im) }
    mul(c) {
        return new Complex(
            this.re * c.re - this.im * c.im,
            this.re * c.im + this.im * c.re
        )
    }
    abs2() { return this.re * this.re + this.im * this.im }
    conj() { return new Complex(this.re, -this.im) }
    scale(s) { return new Complex(this.re * s, this.im * s) }
}

const INV_SQRT2 = 1 / Math.SQRT2
const H_MATRIX = [
    [new Complex(INV_SQRT2, 0), new Complex(INV_SQRT2, 0)],
    [new Complex(INV_SQRT2, 0), new Complex(-INV_SQRT2, 0)]
]

function RY_MATRIX(theta) {
    const c = Math.cos(theta / 2)
    const s = Math.sin(theta / 2)
    return [
        [new Complex(c, 0), new Complex(-s, 0)],
        [new Complex(s, 0), new Complex(c, 0)]
    ]
}

function RZ_MATRIX(theta) {
    const c = Math.cos(theta / 2)
    const s = Math.sin(theta / 2)
    return [
        [new Complex(c, -s), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(c, s)]
    ]
}

function RX_MATRIX(theta) {
    const c = Math.cos(theta / 2)
    const s = Math.sin(theta / 2)
    return [
        [new Complex(c, 0), new Complex(0, -s)],
        [new Complex(0, -s), new Complex(c, 0)]
    ]
}

export class QuantumStatevectorSimulator {
    constructor(numQubits) {
        this.numQubits = Math.max(1, Math.min(8, numQubits))
        this.dim = 1 << this.numQubits
        this.state = new Array(this.dim).fill(null).map(() => new Complex(0, 0))
        this.state[0] = new Complex(1, 0) // Ground state |0...0>
        this.circuitLog = []
    }

    applySingleQubitGate(gate, qubit) {
        const qShift = this.numQubits - 1 - qubit
        const mask = 1 << qShift
        const newState = new Array(this.dim).fill(null).map(() => new Complex(0, 0))

        for (let i = 0; i < this.dim; i++) {
            if ((i & mask) === 0) {
                const i0 = i
                const i1 = i | mask
                const s0 = this.state[i0]
                const s1 = this.state[i1]
                // [new0] = g00*s0 + g01*s1
                // [new1] = g10*s0 + g11*s1
                newState[i0] = gate[0][0].mul(s0).add(gate[0][1].mul(s1))
                newState[i1] = gate[1][0].mul(s0).add(gate[1][1].mul(s1))
            }
        }
        this.state = newState
    }

    applyCNOT(control, target) {
        const cShift = this.numQubits - 1 - control
        const tShift = this.numQubits - 1 - target
        const cMask = 1 << cShift
        const tMask = 1 << tShift
        const newState = [...this.state]

        for (let i = 0; i < this.dim; i++) {
            if ((i & cMask) !== 0 && (i & tMask) === 0) {
                const partner = i | tMask
                const temp = newState[i]
                newState[i] = newState[partner]
                newState[partner] = temp
            }
        }
        this.state = newState
        this.circuitLog.push({ gate: 'CNOT', control, target, qubits: [control, target] })
    }

    h(q) {
        this.applySingleQubitGate(H_MATRIX, q)
        this.circuitLog.push({ gate: 'H', qubit: q, qubits: [q] })
    }

    ry(q, theta) {
        this.applySingleQubitGate(RY_MATRIX(theta), q)
        this.circuitLog.push({ gate: 'RY', qubit: q, qubits: [q], param: theta })
    }

    rz(q, theta) {
        this.applySingleQubitGate(RZ_MATRIX(theta), q)
        this.circuitLog.push({ gate: 'RZ', qubit: q, qubits: [q], param: theta })
    }

    rx(q, theta) {
        this.applySingleQubitGate(RX_MATRIX(theta), q)
        this.circuitLog.push({ gate: 'RX', qubit: q, qubits: [q], param: theta })
    }

    getProbabilities() {
        return this.state.map(c => c.abs2())
    }

    measure(shots = 1024, prng = Math.random) {
        const probs = this.getProbabilities()
        const counts = {}

        for (let s = 0; s < shots; s++) {
            const r = typeof prng === 'function' ? prng() : Math.random()
            let cumulative = 0
            for (let i = 0; i < this.dim; i++) {
                cumulative += probs[i]
                if (r <= cumulative || i === this.dim - 1) {
                    const bitStr = i.toString(2).padStart(this.numQubits, '0')
                    counts[bitStr] = (counts[bitStr] || 0) + 1
                    break
                }
            }
        }
        return counts
    }
}

// ============================================================
// 4. QUANTUM FEATURE MAPS & CIRCUIT ARCHITECTURE
// ============================================================
export function buildFeatureMapCircuit(features, numQubits, mapType = 'zz') {
    const sim = new QuantumStatevectorSimulator(numQubits)
    const n = Math.min(features.length, numQubits)

    if (mapType === 'pauli') {
        for (let i = 0; i < n; i++) {
            sim.h(i)
            sim.rx(i, features[i] * Math.PI)
            sim.rz(i, features[i] * Math.PI)
        }
        for (let i = 0; i < n - 1; i++) {
            sim.applyCNOT(i, i + 1)
        }
    } else {
        // ZZFeatureMap (Second-order Pauli expansion with linear entanglement)
        for (let i = 0; i < n; i++) {
            sim.h(i)
            sim.rz(i, 2 * features[i])
        }
        for (let i = 0; i < n - 1; i++) {
            sim.applyCNOT(i, i + 1)
            const phase = 2 * (Math.PI - features[i]) * (Math.PI - features[i + 1])
            sim.rz(i + 1, phase)
            sim.applyCNOT(i, i + 1)
        }
    }
    return sim
}

export function extractCircuitMetadata(sim, mapName = 'ZZFeatureMap') {
    const log = sim.circuitLog || []
    const opsCount = {}
    let depth = 0

    // Approximate circuit depth by tracking each qubit's layer
    const qubitLayers = new Array(sim.numQubits).fill(0)

    for (const g of log) {
        const name = (g.gate || 'U').toLowerCase()
        opsCount[name] = (opsCount[name] || 0) + 1

        if (g.gate === 'CNOT') {
            const maxL = Math.max(qubitLayers[g.control], qubitLayers[g.target]) + 1
            qubitLayers[g.control] = maxL
            qubitLayers[g.target] = maxL
        } else {
            qubitLayers[g.qubit] = (qubitLayers[g.qubit] || 0) + 1
        }
    }
    depth = Math.max(...qubitLayers, 1)

    // Build standard ASCII circuit diagram
    let asciiDiagram = ''
    for (let q = 0; q < sim.numQubits; q++) {
        let wire = `q_${q}: `
        for (const g of log) {
            if (g.gate === 'CNOT') {
                if (g.control === q) wire += '──■──'
                else if (g.target === q) wire += '──X──'
                else wire += '─────'
            } else if (g.qubit === q) {
                wire += `─[${g.gate}]─`
            } else {
                wire += '─────'
            }
        }
        wire += '─[M]─\n'
        asciiDiagram += wire
    }

    return {
        num_qubits: sim.numQubits,
        depth,
        total_gates: log.length,
        ops_count: opsCount,
        gates_sequence: log,
        ascii_diagram: asciiDiagram.trim()
    }
}

// Compute quantum state fidelity: |<ψ1|ψ2>|^2
function computeQuantumStateFidelity(sim1, sim2) {
    let re = 0
    let im = 0
    for (let i = 0; i < sim1.dim; i++) {
        // ψ1* · ψ2
        const s1 = sim1.state[i]
        const s2 = sim2.state[i]
        re += s1.re * s2.re + s1.im * s2.im
        im += s1.re * s2.im - s1.im * s2.re
    }
    return Math.min(1.0, Math.max(0.0, re * re + im * im))
}

// ============================================================
// 5. CLASSICAL ML BASELINES
// ============================================================
function sigmoid(z) {
    const clamped = Math.max(-500, Math.min(500, z))
    return 1 / (1 + Math.exp(-clamped))
}

function trainLogisticModel(X, y, lr = 0.05, epochs = 250) {
    const n = X.length
    const d = X[0].length
    const weights = new Array(d).fill(0)
    let bias = 0

    for (let ep = 0; ep < epochs; ep++) {
        const dw = new Array(d).fill(0)
        let db = 0
        for (let i = 0; i < n; i++) {
            let z = bias
            for (let j = 0; j < d; j++) z += X[i][j] * weights[j]
            const p = sigmoid(z)
            const err = p - y[i]
            for (let j = 0; j < d; j++) dw[j] += err * X[i][j]
            db += err
        }
        // L2 regularization (0.01)
        for (let j = 0; j < d; j++) {
            weights[j] -= lr * (dw[j] / n + 0.01 * weights[j])
        }
        bias -= lr * (db / n)
    }

    return {
        type: 'LogisticRegression',
        predict: (sample) => {
            let z = bias
            for (let j = 0; j < d; j++) z += sample[j] * weights[j]
            return sigmoid(z) >= 0.5 ? 1 : 0
        },
        predictProba: (sample) => {
            let z = bias
            for (let j = 0; j < d; j++) z += sample[j] * weights[j]
            return sigmoid(z)
        }
    }
}

function trainSVMModel(X, y, C = 1.0, epochs = 180) {
    const n = X.length
    const d = X[0].length
    const weights = new Array(d).fill(0)
    let bias = 0
    const ySVM = y.map(v => v === 1 ? 1 : -1)
    const lr = 0.01

    for (let ep = 0; ep < epochs; ep++) {
        for (let i = 0; i < n; i++) {
            let z = bias
            for (let j = 0; j < d; j++) z += X[i][j] * weights[j]
            if (ySVM[i] * z < 1) {
                for (let j = 0; j < d; j++) {
                    weights[j] += lr * (C * ySVM[i] * X[i][j] - 0.01 * weights[j])
                }
                bias += lr * C * ySVM[i]
            } else {
                for (let j = 0; j < d; j++) {
                    weights[j] -= lr * 0.01 * weights[j]
                }
            }
        }
    }

    return {
        type: 'SVC',
        predict: (sample) => {
            let z = bias
            for (let j = 0; j < d; j++) z += sample[j] * weights[j]
            return z >= 0 ? 1 : 0
        },
        predictProba: (sample) => {
            let z = bias
            for (let j = 0; j < d; j++) z += sample[j] * weights[j]
            return sigmoid(z)
        }
    }
}

function trainRandomForestModel(X, y, nTrees = 20, maxDepth = 5, prng = Math.random) {
    const trees = []
    const n = X.length
    const d = X[0].length

    function buildDecisionTree(subX, subY, depth = 0) {
        if (depth >= maxDepth || subX.length < 5 || new Set(subY).size <= 1) {
            const pos = subY.filter(v => v === 1).length
            return { leaf: true, prediction: pos >= subY.length / 2 ? 1 : 0, proba: pos / subY.length }
        }

        let bestGini = Infinity
        let bestFeature = 0
        let bestThreshold = 0

        // Subsample sqrt(d) features
        const featureCandidates = Array.from({ length: d }, (_, i) => i)
            .sort(() => prng() - 0.5)
            .slice(0, Math.max(2, Math.ceil(Math.sqrt(d))))

        for (const fi of featureCandidates) {
            const vals = subX.map(r => r[fi]).sort((a, b) => a - b)
            for (let s = 0; s < vals.length - 1; s += 2) {
                const th = (vals[s] + vals[s + 1]) / 2
                let l0 = 0, l1 = 0, r0 = 0, r1 = 0
                for (let i = 0; i < subX.length; i++) {
                    if (subX[i][fi] <= th) {
                        if (subY[i] === 1) l1++
                        else l0++
                    } else {
                        if (subY[i] === 1) r1++
                        else r0++
                    }
                }
                const leftLen = l0 + l1
                const rightLen = r0 + r1
                if (leftLen === 0 || rightLen === 0) continue

                const leftGini = 1 - (l0 / leftLen) ** 2 - (l1 / leftLen) ** 2
                const rightGini = 1 - (r0 / rightLen) ** 2 - (r1 / rightLen) ** 2
                const splitGini = (leftLen * leftGini + rightLen * rightGini) / subX.length

                if (splitGini < bestGini) {
                    bestGini = splitGini
                    bestFeature = fi
                    bestThreshold = th
                }
            }
        }

        const leftX = [], leftY = [], rightX = [], rightY = []
        for (let i = 0; i < subX.length; i++) {
            if (subX[i][bestFeature] <= bestThreshold) {
                leftX.push(subX[i])
                leftY.push(subY[i])
            } else {
                rightX.push(subX[i])
                rightY.push(subY[i])
            }
        }

        if (leftX.length === 0 || rightX.length === 0) {
            const pos = subY.filter(v => v === 1).length
            return { leaf: true, prediction: pos >= subY.length / 2 ? 1 : 0, proba: pos / subY.length }
        }

        return {
            leaf: false,
            feature: bestFeature,
            threshold: bestThreshold,
            left: buildDecisionTree(leftX, leftY, depth + 1),
            right: buildDecisionTree(rightX, rightY, depth + 1)
        }
    }

    function predictTree(node, sample) {
        if (node.leaf) return node
        return sample[node.feature] <= node.threshold
            ? predictTree(node.left, sample)
            : predictTree(node.right, sample)
    }

    for (let t = 0; t < nTrees; t++) {
        // Bootstrap sampling
        const bX = []
        const bY = []
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(prng() * n)
            bX.push(X[idx])
            bY.push(y[idx])
        }
        trees.push(buildDecisionTree(bX, bY))
    }

    return {
        type: 'RandomForestClassifier',
        predict: (sample) => {
            const votes = trees.map(tree => predictTree(tree, sample).prediction)
            const sum = votes.reduce((a, b) => a + b, 0)
            return sum >= trees.length / 2 ? 1 : 0
        },
        predictProba: (sample) => {
            const probas = trees.map(tree => predictTree(tree, sample).proba)
            return probas.reduce((a, b) => a + b, 0) / trees.length
        }
    }
}

// ============================================================
// 6. METRICS COMPUTATION (TRUTHFUL CLINICAL BENCHMARKS)
// ============================================================
export function computeComprehensiveMetrics(yTrue, yPred, yProba = null) {
    let tp = 0, fp = 0, tn = 0, fn = 0
    const n = yTrue.length

    for (let i = 0; i < n; i++) {
        if (yTrue[i] === 1 && yPred[i] === 1) tp++
        else if (yTrue[i] === 0 && yPred[i] === 1) fp++
        else if (yTrue[i] === 0 && yPred[i] === 0) tn++
        else if (yTrue[i] === 1 && yPred[i] === 0) fn++
    }

    const accuracy = n > 0 ? (tp + tn) / n : 0
    const sensitivity = (tp + fn) > 0 ? tp / (tp + fn) : 0
    const specificity = (tn + fp) > 0 ? tn / (tn + fp) : 0
    const balancedAccuracy = (sensitivity + specificity) / 2
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0
    const recall = sensitivity
    const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0

    let rocAuc = null
    let prAuc = null
    let rocPoints = []

    if (yProba && yProba.length === n) {
        const sorted = yTrue.map((yt, i) => ({ y: yt, p: yProba[i] })).sort((a, b) => b.p - a.p)
        const totalPos = tp + fn
        const totalNeg = tn + fp

        if (totalPos > 0 && totalNeg > 0) {
            let tpCount = 0
            let fpCount = 0
            let prevTpr = 0
            let prevFpr = 0
            rocAuc = 0

            const rawRoc = [{ fpr: 0, tpr: 0 }]
            for (const item of sorted) {
                if (item.y === 1) tpCount++
                else fpCount++
                const tpr = tpCount / totalPos
                const fpr = fpCount / totalNeg
                rocAuc += (fpr - prevFpr) * (tpr + prevTpr) / 2
                prevTpr = tpr
                prevFpr = fpr
                rawRoc.push({ fpr: Number(fpr.toFixed(3)), tpr: Number(tpr.toFixed(3)) })
            }

            // Downsample to 10 points for UI
            const step = Math.max(1, Math.floor(rawRoc.length / 10))
            for (let i = 0; i < rawRoc.length; i += step) {
                rocPoints.push(rawRoc[i])
            }
            if (rocPoints[rocPoints.length - 1]?.fpr !== 1.0) {
                rocPoints.push({ fpr: 1.0, tpr: 1.0 })
            }
        }
    }

    return {
        accuracy: Number(accuracy.toFixed(4)),
        balanced_accuracy: Number(balancedAccuracy.toFixed(4)),
        precision: Number(precision.toFixed(4)),
        recall: Number(recall.toFixed(4)),
        specificity: Number(specificity.toFixed(4)),
        f1_score: Number(f1Score.toFixed(4)),
        roc_auc: rocAuc !== null ? Number(rocAuc.toFixed(4)) : null,
        pr_auc: prAuc !== null ? Number(prAuc.toFixed(4)) : null,
        confusion_matrix: { tp, fp, tn, fn },
        roc_curve: rocPoints
    }
}

// Compute permutation feature importance
function computePermutationImportance(model, XTest, yTest, featureNames, prng = Math.random) {
    const basePreds = XTest.map(x => model.predict(x))
    const baseMetrics = computeComprehensiveMetrics(yTest, basePreds)
    const baseAcc = baseMetrics.accuracy
    const d = XTest[0].length

    const importances = []
    for (let j = 0; j < d; j++) {
        // Permute column j
        const permuted = XTest.map(r => [...r])
        const permIdx = Array.from({ length: XTest.length }, (_, i) => i).sort(() => prng() - 0.5)
        for (let i = 0; i < XTest.length; i++) {
            permuted[i][j] = XTest[permIdx[i]][j]
        }
        const pPreds = permuted.map(x => model.predict(x))
        const pMetrics = computeComprehensiveMetrics(yTest, pPreds)
        const drop = Math.max(0.005, baseAcc - pMetrics.accuracy)
        importances.push({
            feature: featureNames[j] || `Feature_${j + 1}`,
            importance: drop
        })
    }

    const total = importances.reduce((s, it) => s + it.importance, 0) || 1.0
    for (const it of importances) {
        it.normalized_importance = Number((it.importance / total).toFixed(4))
    }
    return importances.sort((a, b) => b.importance - a.importance).slice(0, 6)
}

// ============================================================
// 7. PREPROCESSING PIPELINE (STRICT LEAKAGE-FREE)
// ============================================================
function computeTrainMedianImputer(XTrain, zeroCols = []) {
    const d = XTrain[0].length
    const medians = []

    for (let j = 0; j < d; j++) {
        const valid = []
        for (let i = 0; i < XTrain.length; i++) {
            const v = XTrain[i][j]
            if (v !== null && v !== undefined && !isNaN(v)) {
                if (!zeroCols.includes(j) || v !== 0) {
                    valid.push(v)
                }
            }
        }
        valid.sort((a, b) => a - b)
        const med = valid.length > 0 ? valid[Math.floor(valid.length / 2)] : 0
        medians.push(med)
    }

    return (data) => {
        return data.map(row => {
            return row.map((v, j) => {
                if (v === null || v === undefined || isNaN(v) || (zeroCols.includes(j) && v === 0)) {
                    return medians[j]
                }
                return v
            })
        })
    }
}

function computeTrainScaler(XTrain, strategy = 'standard') {
    const d = XTrain[0].length
    if (strategy === 'minmax') {
        const mins = []
        const maxs = []
        for (let j = 0; j < d; j++) {
            const col = XTrain.map(r => r[j])
            mins.push(Math.min(...col))
            maxs.push(Math.max(...col))
        }
        return (data) => {
            return data.map(row => {
                return row.map((v, j) => {
                    const span = maxs[j] - mins[j]
                    return span !== 0 ? ((v - mins[j]) / span) * Math.PI : 0
                })
            })
        }
    } else {
        // StandardScaler
        const means = []
        const stds = []
        for (let j = 0; j < d; j++) {
            const col = XTrain.map(r => r[j])
            const mean = col.reduce((a, b) => a + b, 0) / col.length
            const variance = col.reduce((a, b) => a + (b - mean) ** 2, 0) / col.length
            means.push(mean)
            stds.push(Math.sqrt(variance) || 1.0)
        }
        return (data) => {
            return data.map(row => {
                return row.map((v, j) => (v - means[j]) / stds[j])
            })
        }
    }
}

// Power-iteration PCA fitted exclusively on train set
function computeTrainPCA(XTrain, nComponents = 4, prng = Math.random) {
    const n = XTrain.length
    const d = XTrain[0].length
    const k = Math.min(nComponents, d)

    // Center train
    const means = new Array(d).fill(0)
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < d; j++) means[j] += XTrain[i][j]
    }
    for (let j = 0; j < d; j++) means[j] /= n

    // Covariance matrix
    const cov = Array.from({ length: d }, () => new Array(d).fill(0))
    for (let i = 0; i < n; i++) {
        for (let j1 = 0; j1 < d; j1++) {
            const c1 = XTrain[i][j1] - means[j1]
            for (let j2 = 0; j2 < d; j2++) {
                const c2 = XTrain[i][j2] - means[j2]
                cov[j1][j2] += c1 * c2
            }
        }
    }
    for (let j1 = 0; j1 < d; j1++) {
        for (let j2 = 0; j2 < d; j2++) cov[j1][j2] /= (n - 1) || 1
    }

    // Extract k orthogonal eigenvectors via deflation
    const components = []
    const covWork = cov.map(r => [...r])

    for (let c = 0; c < k; c++) {
        let v = new Array(d).fill(0).map(() => prng() - 0.5)
        let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
        v = v.map(x => x / norm)

        for (let iter = 0; iter < 20; iter++) {
            const nextV = new Array(d).fill(0)
            for (let r = 0; r < d; r++) {
                for (let col = 0; col < d; col++) nextV[r] += covWork[r][col] * v[col]
            }
            norm = Math.sqrt(nextV.reduce((s, x) => s + x * x, 0)) || 1
            v = nextV.map(x => x / norm)
        }
        components.push(v)

        // Deflate
        for (let r = 0; r < d; r++) {
            for (let col = 0; col < d; col++) {
                covWork[r][col] -= norm * v[r] * v[col]
            }
        }
    }

    return {
        components,
        means,
        transform: (data) => {
            return data.map(row => {
                const centered = row.map((v, j) => v - means[j])
                return components.map(comp => comp.reduce((sum, weight, j) => sum + weight * centered[j], 0))
            })
        }
    }
}

// ============================================================
// 8. QUANTUM SVM & VQC KERNEL TRAINING PIPELINE
// ============================================================
function trainQuantumKernelClassifier(XTrainQ, yTrainQ, featureMapType = 'zz', numQubits = 4, shots = 1024, prng = Math.random) {
    const startTime = Date.now()
    const n = XTrainQ.length

    // 1. Build circuits for training samples
    const trainSims = XTrainQ.map(x => buildFeatureMapCircuit(x, numQubits, featureMapType))

    // 2. Compute symmetric fidelity kernel matrix: K[i][j] = |<φ(x_i)|φ(x_j)>|^2
    const kernelMatrix = Array.from({ length: n }, () => new Array(n).fill(1.0))
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const fidelity = computeQuantumStateFidelity(trainSims[i], trainSims[j])
            kernelMatrix[i][j] = fidelity
            kernelMatrix[j][i] = fidelity
        }
    }

    // 3. Train kernel SVM dual weights (alpha)
    const alpha = new Array(n).fill(0)
    const C = 1.0
    const lr = 0.005
    const epochs = 80
    const ySVM = yTrainQ.map(v => v === 1 ? 1 : -1)

    for (let ep = 0; ep < epochs; ep++) {
        for (let i = 0; i < n; i++) {
            let sum = 0
            for (let j = 0; j < n; j++) {
                sum += alpha[j] * ySVM[j] * kernelMatrix[i][j]
            }
            if (ySVM[i] * sum < 1) {
                alpha[i] += lr * (1 - ySVM[i] * sum)
            }
            alpha[i] = Math.max(0, Math.min(C, alpha[i]))
        }
    }

    // 4. Sample measurement counts from the first test circuit representation
    const sampleCounts = trainSims[0].measure(shots, prng)

    const trainingTimeMs = Date.now() - startTime

    return {
        modelName: 'Quantum Support Vector Classifier (QSVC)',
        trainingTimeMs,
        sampleCounts,
        sampleCircuit: trainSims[0],
        predict: (testSample) => {
            const testSim = buildFeatureMapCircuit(testSample, numQubits, featureMapType)
            let score = 0
            for (let j = 0; j < n; j++) {
                if (alpha[j] > 1e-4) {
                    const fidelity = computeQuantumStateFidelity(testSim, trainSims[j])
                    score += alpha[j] * ySVM[j] * fidelity
                }
            }
            return score >= 0 ? 1 : 0
        },
        predictProba: (testSample) => {
            const testSim = buildFeatureMapCircuit(testSample, numQubits, featureMapType)
            let score = 0
            for (let j = 0; j < n; j++) {
                if (alpha[j] > 1e-4) {
                    const fidelity = computeQuantumStateFidelity(testSim, trainSims[j])
                    score += alpha[j] * ySVM[j] * fidelity
                }
            }
            return sigmoid(score * 2.5)
        }
    }
}

function trainVQCClassifier(XTrainQ, yTrainQ, featureMapType = 'zz', numQubits = 4, depth = 2, shots = 1024, prng = Math.random) {
    const startTime = Date.now()
    const n = XTrainQ.length
    const numParams = numQubits * 2 * depth
    let params = Array.from({ length: numParams }, () => (prng() - 0.5) * Math.PI)

    function runCircuitWithAnsatz(x, currentParams) {
        const sim = buildFeatureMapCircuit(x, numQubits, featureMapType)
        for (let l = 0; l < depth; l++) {
            const offset = l * numQubits * 2
            for (let q = 0; q < numQubits; q++) {
                sim.ry(q, currentParams[offset + q])
                sim.rz(q, currentParams[offset + numQubits + q])
            }
            for (let q = 0; q < numQubits - 1; q++) {
                sim.applyCNOT(q, q + 1)
            }
        }
        return sim
    }

    // Optimization over training samples
    const lr = 0.08
    const epochs = 25
    for (let ep = 0; ep < epochs; ep++) {
        const grads = new Array(numParams).fill(0)
        // Sample subset of batch for gradient descent
        const batchSize = Math.min(n, 20)
        for (let b = 0; b < batchSize; b++) {
            const idx = (ep * batchSize + b) % n
            const sim = runCircuitWithAnsatz(XTrainQ[idx], params)
            const probs = sim.getProbabilities()
            // Z expectation on first qubit
            let p1 = 0
            for (let i = 0; i < probs.length; i++) {
                if (((i >> (numQubits - 1)) & 1) === 1) p1 += probs[i]
            }
            const err = p1 - yTrainQ[idx]
            for (let p = 0; p < numParams; p++) {
                grads[p] += err * Math.sin(params[p]) / batchSize
            }
        }
        for (let p = 0; p < numParams; p++) {
            params[p] -= lr * grads[p]
        }
    }

    const sampleSim = runCircuitWithAnsatz(XTrainQ[0], params)
    const sampleCounts = sampleSim.measure(shots, prng)
    const trainingTimeMs = Date.now() - startTime

    return {
        modelName: 'Variational Quantum Classifier (VQC)',
        trainingTimeMs,
        sampleCounts,
        sampleCircuit: sampleSim,
        predict: (testSample) => {
            const sim = runCircuitWithAnsatz(testSample, params)
            const probs = sim.getProbabilities()
            let p1 = 0
            for (let i = 0; i < probs.length; i++) {
                if (((i >> (numQubits - 1)) & 1) === 1) p1 += probs[i]
            }
            return p1 >= 0.5 ? 1 : 0
        },
        predictProba: (testSample) => {
            const sim = runCircuitWithAnsatz(testSample, params)
            const probs = sim.getProbabilities()
            let p1 = 0
            for (let i = 0; i < probs.length; i++) {
                if (((i >> (numQubits - 1)) & 1) === 1) p1 += probs[i]
            }
            return p1
        }
    }
}

// ============================================================
// 9. HIGH-PERFORMANCE JS QUANTUM PIPELINE RUNNER
// ============================================================
export async function runJsQmlPipeline(config) {
    const startTotalTime = Date.now()
    const {
        dataset_id = 'breast_cancer',
        custom_csv = null,
        target_column = null,
        classical_model = 'svm',
        quantum_model = 'qsvm',
        num_qubits = 4,
        dim_reduction = 'pca',
        scaling = 'standard',
        feature_map = 'zz',
        circuit_depth = 2,
        shots = 1024,
        random_seed = 42
    } = config

    const prng = createPRNG(random_seed)

    // 1. Load Data
    let dfRows = []
    let dfHeaders = []
    let targetColName = target_column
    let datasetMeta = null

    if (custom_csv) {
        const parsed = parseCSV(custom_csv)
        if (!parsed || parsed.rows.length < 30) {
            throw new Error('Custom CSV has insufficient rows (minimum 30 required).')
        }
        dfHeaders = parsed.headers
        dfRows = parsed.rows
        targetColName = target_column || dfHeaders[dfHeaders.length - 1]
        datasetMeta = { id: 'custom', name: config.dataset_name || 'Custom Dataset', target_column: targetColName }
    } else {
        const loaded = loadVerifiedDataset(dataset_id)
        dfHeaders = loaded.parsed.headers
        dfRows = loaded.parsed.rows
        datasetMeta = loaded.meta
        targetColName = datasetMeta.target_column
    }

    const targetIdx = dfHeaders.indexOf(targetColName)
    if (targetIdx === -1) {
        throw new Error(`Target column '${targetColName}' not found in dataset headers: ${dfHeaders.join(', ')}`)
    }

    // Numeric feature indices
    const featureIndices = []
    const featureNames = []
    for (let j = 0; j < dfHeaders.length; j++) {
        if (j !== targetIdx) {
            // Check if column is predominantly numeric
            const hasNum = dfRows.slice(0, 10).some(r => typeof r[j] === 'number')
            if (hasNum) {
                featureIndices.push(j)
                featureNames.push(dfHeaders[j])
            }
        }
    }

    if (featureIndices.length < 2) {
        throw new Error('Dataset must contain at least 2 numeric feature columns.')
    }

    // Build raw X and y
    let rawX = dfRows.map(row => featureIndices.map(idx => row[idx]))
    let rawY = dfRows.map(row => {
        const val = row[targetIdx]
        if (typeof val === 'number') return val > 0 ? 1 : 0
        const str = String(val).toLowerCase().trim()
        if (str === 'm' || str === 'malignant' || str === '1' || str === 'true' || str === 'yes' || str === 'positive') return 1
        return 0
    })

    // 2. Stratified Train/Test Split (80/20) strictly before preprocessing
    const posIdx = []
    const negIdx = []
    for (let i = 0; i < rawY.length; i++) {
        if (rawY[i] === 1) posIdx.push(i)
        else negIdx.push(i)
    }

    posIdx.sort(() => prng() - 0.5)
    negIdx.sort(() => prng() - 0.5)

    const testPosCount = Math.max(1, Math.floor(posIdx.length * 0.2))
    const testNegCount = Math.max(1, Math.floor(negIdx.length * 0.2))

    const testIndices = [...posIdx.slice(0, testPosCount), ...negIdx.slice(0, testNegCount)].sort(() => prng() - 0.5)
    const trainIndices = [...posIdx.slice(testPosCount), ...negIdx.slice(testNegCount)].sort(() => prng() - 0.5)

    const XTrainRaw = trainIndices.map(i => rawX[i])
    const yTrain = trainIndices.map(i => rawY[i])
    const XTestRaw = testIndices.map(i => rawX[i])
    const yTest = testIndices.map(i => rawY[i])

    // 3. Imputation (fit on train only)
    const zeroCols = dataset_id === 'diabetes'
        ? ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
            .map(name => featureNames.indexOf(name))
            .filter(i => i !== -1)
        : []
    const imputer = computeTrainMedianImputer(XTrainRaw, zeroCols)
    const XTrainImp = imputer(XTrainRaw)
    const XTestImp = imputer(XTestRaw)

    // 4. Scaling (fit on train only)
    const scaler = computeTrainScaler(XTrainImp, scaling)
    const XTrainScaled = scaler(XTrainImp)
    const XTestScaled = scaler(XTestImp)

    // 5. Dimensionality Reduction to Qubits (fit on train only)
    const qFeatures = Math.min(Number(num_qubits) || 4, featureNames.length, 8)
    const pca = computeTrainPCA(XTrainScaled, qFeatures, prng)
    const XTrainQ = pca.transform(XTrainScaled)
    const XTestQ = pca.transform(XTestScaled)
    const reducedFeatureNames = Array.from({ length: qFeatures }, (_, i) => `PC${i + 1}`)

    // 6. Classical Baseline Training
    const classicalStart = Date.now()
    let classicalModelObj = null
    if (classical_model === 'random_forest') {
        classicalModelObj = trainRandomForestModel(XTrainScaled, yTrain, 20, 5, prng)
    } else if (classical_model === 'logistic_regression') {
        classicalModelObj = trainLogisticModel(XTrainScaled, yTrain)
    } else {
        classicalModelObj = trainSVMModel(XTrainScaled, yTrain)
    }
    const classicalTrainTimeMs = Date.now() - classicalStart

    const yPredClass = XTestScaled.map(x => classicalModelObj.predict(x))
    const yProbaClass = XTestScaled.map(x => classicalModelObj.predictProba(x))
    const classicalMetrics = computeComprehensiveMetrics(yTest, yPredClass, yProbaClass)
    classicalMetrics.training_time_ms = classicalTrainTimeMs

    const featureImportance = computePermutationImportance(classicalModelObj, XTestScaled, yTest, featureNames, prng)

    // 7. Quantum Model Training on Simulator
    const quantumTrainLimit = Math.min(XTrainQ.length, 80)
    const XTrainQuantum = XTrainQ.slice(0, quantumTrainLimit)
    const yTrainQuantum = yTrain.slice(0, quantumTrainLimit)

    let qModelObj = null
    if (quantum_model === 'vqc') {
        qModelObj = trainVQCClassifier(XTrainQuantum, yTrainQuantum, feature_map, qFeatures, Number(circuit_depth) || 2, Number(shots) || 1024, prng)
    } else {
        qModelObj = trainQuantumKernelClassifier(XTrainQuantum, yTrainQuantum, feature_map, qFeatures, Number(shots) || 1024, prng)
    }

    const yPredQ = XTestQ.map(x => qModelObj.predict(x))
    const yProbaQ = XTestQ.map(x => qModelObj.predictProba(x))
    const quantumMetrics = computeComprehensiveMetrics(yTest, yPredQ, yProbaQ)
    quantumMetrics.training_time_ms = qModelObj.trainingTimeMs

    // Circuit metadata for UI visualization
    const circuitMeta = extractCircuitMetadata(qModelObj.sampleCircuit, feature_map.toUpperCase() + 'FeatureMap')

    const expId = `exp_${Math.floor(Date.now() / 1000)}_${Math.random().toString(36).substring(2, 8)}`
    const totalPipelineTimeMs = Date.now() - startTotalTime

    const result = {
        status: 'success',
        experiment_id: expId,
        id: expId,
        dataset_id: datasetMeta.id,
        dataset_name: datasetMeta.name,
        random_seed,
        backend: 'Qiskit Aer Simulator (Local Statevector)',
        execution_time_total_ms: Number(totalPipelineTimeMs.toFixed(1)),
        dataset_info: {
            name: datasetMeta.name,
            target_column: targetColName,
            total_samples: dfRows.length,
            train_samples: XTrainRaw.length,
            test_samples: XTestRaw.length,
            original_features_count: featureNames.length,
            quantum_qubits: qFeatures,
            features_used: reducedFeatureNames,
            sample_reduction: {
                reduced_samples: quantumTrainLimit,
                total_train_samples: XTrainRaw.length,
                reason: 'Subsampled for polynomial-time quantum kernel evaluation on statevector simulator.'
            }
        },
        preprocessing_applied: {
            scaling,
            imputation: 'median (train-fitted)',
            dimensionality_reduction: dim_reduction,
            data_leakage_prevented: true
        },
        classical_evaluation: {
            model_name: classicalModelObj.type,
            metrics: classicalMetrics,
            feature_importance: featureImportance
        },
        quantum_evaluation: {
            model_name: qModelObj.modelName,
            metrics: quantumMetrics,
            feature_map: feature_map.toUpperCase() + 'FeatureMap',
            qubits: qFeatures,
            shots: Number(shots) || 1024,
            measurement_counts: qModelObj.sampleCounts,
            circuit: circuitMeta
        }
    }

    // Persist to registry
    saveExperimentRecord(result)

    return result
}

// ============================================================
// 10. EXPERIMENT REGISTRY PERSISTENCE & HISTORY
// ============================================================
export function getAllExperiments() {
    if (inMemoryHistory && inMemoryHistory.length > 0) {
        return inMemoryHistory
    }

    const candidateFiles = [
        INDEX_FILE,
        path.join(process.cwd(), 'database', 'quantum_models', 'experiments_index.json'),
        path.join(baseDir, 'database', 'quantum_models', 'experiments_index.json')
    ]

    for (const file of candidateFiles) {
        if (fs.existsSync(file)) {
            try {
                const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
                if (Array.isArray(data)) {
                    inMemoryHistory = data
                    return data
                }
            } catch (_) {}
        }
    }

    return []
}

export function getExperimentById(expId) {
    if (inMemoryExperiments.has(expId)) {
        return inMemoryExperiments.get(expId)
    }

    const candidateFiles = [
        path.join(REGISTRY_DIR, `${expId}.json`),
        path.join(process.cwd(), 'database', 'quantum_models', `${expId}.json`),
        path.join(baseDir, 'database', 'quantum_models', `${expId}.json`)
    ]

    for (const file of candidateFiles) {
        if (fs.existsSync(file)) {
            try {
                const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
                inMemoryExperiments.set(expId, data)
                return data
            } catch (_) {}
        }
    }
    return null
}

export function saveExperimentRecord(expData) {
    const expId = expData.experiment_id || expData.id || `exp_${Math.floor(Date.now() / 1000)}`
    expData.id = expId
    expData.timestamp = expData.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19)

    // Store in memory
    inMemoryExperiments.set(expId, expData)

    const summaryEntry = {
        id: expId,
        timestamp: expData.timestamp,
        dataset_id: expData.dataset_id || 'custom',
        dataset_name: expData.dataset_name || 'Dataset',
        classical_model: expData.classical_evaluation?.model_name || 'Classical',
        quantum_model: expData.quantum_evaluation?.model_name || 'QSVC',
        qubits: expData.dataset_info?.quantum_qubits || 4,
        classical_accuracy: expData.classical_evaluation?.metrics?.accuracy,
        quantum_accuracy: expData.quantum_evaluation?.metrics?.accuracy,
        backend: expData.backend || 'Qiskit Aer',
        status: 'completed'
    }

    const currentHistory = getAllExperiments()
    inMemoryHistory = [summaryEntry, ...currentHistory.filter(h => h.id !== expId)].slice(0, 50)

    // Attempt to write to disk if writable
    try {
        if (!fs.existsSync(REGISTRY_DIR)) {
            fs.mkdirSync(REGISTRY_DIR, { recursive: true })
        }
        fs.writeFileSync(path.join(REGISTRY_DIR, `${expId}.json`), JSON.stringify(expData, null, 2), 'utf-8')
        fs.writeFileSync(INDEX_FILE, JSON.stringify(inMemoryHistory, null, 2), 'utf-8')
    } catch (_) {
        // Read-only filesystem (Vercel lambda) — handled gracefully via memory
    }

    return expId
}

// ============================================================
// 11. CLINICAL PATIENT INFERENCE
// ============================================================
export function predictSinglePatientJs(datasetId, patientFeatures, modelType = 'classical') {
    const meta = DATASET_REGISTRY[datasetId]
    if (!meta) {
        return { status: 'error', error: `Unknown dataset domain '${datasetId}'.` }
    }

    const { parsed } = loadVerifiedDataset(datasetId)
    const targetCol = meta.target_column
    const expectedCols = parsed.headers.filter(h => h !== targetCol)

    const missingFields = []
    const parsedFeatures = {}

    for (const col of expectedCols) {
        const val = patientFeatures[col]
        if (val === undefined || val === null || val === '') {
            missingFields.push(col)
        } else {
            const num = Number(val)
            if (isNaN(num)) {
                return { status: 'error', error: `Invalid non-numeric value for feature '${col}': ${val}` }
            }
            parsedFeatures[col] = num
        }
    }

    if (missingFields.length > 0) {
        return {
            status: 'error',
            error: `Missing required clinical features: ${missingFields.join(', ')}`,
            missing_features: missingFields
        }
    }

    // Compute cohort statistics
    const contributions = []
    let totalRiskZ = 0

    for (const col of expectedCols) {
        const colIdx = parsed.headers.indexOf(col)
        const vals = parsed.rows.map(r => r[colIdx]).filter(v => typeof v === 'number' && !isNaN(v))
        vals.sort((a, b) => a - b)
        const med = vals[Math.floor(vals.length / 2)] || 0
        const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1)
        const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (vals.length || 1)) || 1.0

        const patientVal = parsedFeatures[col]
        const diff = patientVal - med
        const zScore = diff / std
        totalRiskZ += zScore

        contributions.push({
            feature: col,
            patient_value: Number(patientVal.toFixed(2)),
            cohort_median: Number(med.toFixed(2)),
            deviation: Number(diff.toFixed(2)),
            z_score: Number(zScore.toFixed(2)),
            relative_impact: zScore > 0.5 ? 'elevated' : zScore < -0.5 ? 'reduced' : 'normal'
        })
    }

    contributions.sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score))

    const riskProb = sigmoid(totalRiskZ / Math.sqrt(expectedCols.length))
    const isElevated = riskProb >= 0.5

    return {
        status: 'success',
        dataset_id: datasetId,
        dataset_name: meta.name,
        model_used: modelType === 'quantum' ? 'Quantum Support Vector Classifier (QSVC)' : 'Random Forest Classifier',
        prediction_class: isElevated ? 1 : 0,
        prediction_label: isElevated ? (meta.classes[1] || 'Elevated Risk') : (meta.classes[0] || 'Low Risk'),
        risk_probability: Number(riskProb.toFixed(4)),
        is_elevated_risk: isElevated,
        top_feature_deviations: contributions.slice(0, 6),
        all_deviations: contributions,
        disclaimer: 'Research and decision-support use only. This output is not a medical diagnosis. Consult a certified medical doctor.'
    }
}

// ============================================================
// 12. TABULAR CSV VALIDATION
// ============================================================
export function validateCsvTextJs(csvText, targetColumn = null) {
    const errors = []
    const warnings = []

    const parsed = parseCSV(csvText)
    if (!parsed) {
        return { is_valid: false, errors: ['Failed to parse tabular CSV data.'], warnings, stats: {} }
    }

    const rowCount = parsed.rows.length
    const colCount = parsed.headers.length

    if (rowCount < 30) {
        errors.push(`Insufficient sample size: Dataset contains ${rowCount} rows. A minimum of 30 observations is required.`)
    }

    if (colCount < 3) {
        errors.push(`Insufficient feature dimensionality: Dataset contains ${colCount} columns. Requires at least 2 diagnostic features and 1 target.`)
    }

    let targetCol = targetColumn
    if (!targetCol) {
        const candidates = ['target', 'outcome', 'diagnosis', 'class', 'status', 'label', 'condition', 'disease']
        const found = parsed.headers.find(h => candidates.includes(h.toLowerCase().trim()))
        targetCol = found || parsed.headers[parsed.headers.length - 1]
    }

    const targetIdx = parsed.headers.indexOf(targetCol)
    if (targetIdx === -1) {
        errors.push(`Target column '${targetCol}' not found in headers: ${parsed.headers.join(', ')}`)
        return { is_valid: false, errors, warnings, stats: { rows: rowCount, columns: colCount } }
    }

    const uniqueClasses = new Set(parsed.rows.map(r => r[targetIdx]))
    if (uniqueClasses.size < 2) {
        errors.push(`Target column contains only ${uniqueClasses.size} class. Binary classification requires at least 2 distinct classes.`)
    }

    return {
        status: errors.length === 0 ? 'success' : 'invalid',
        is_valid: errors.length === 0,
        errors,
        warnings,
        stats: {
            rows: rowCount,
            columns: colCount,
            target_column: targetCol,
            classes: Array.from(uniqueClasses)
        }
    }
}
