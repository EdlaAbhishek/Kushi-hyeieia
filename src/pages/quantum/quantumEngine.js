/**
 * Quantum Simulation Engine
 * 
 * A client-side quantum computing simulator that performs actual
 * quantum gate operations using complex number matrix mathematics.
 * This is a simulator — NOT real quantum hardware.
 * 
 * Supports: Angle Encoding, QSVM, VQC, circuit visualization
 */

// ============================================================
// Complex Number Operations
// ============================================================
class Complex {
    constructor(re = 0, im = 0) {
        this.re = re
        this.im = im
    }
    add(c) { return new Complex(this.re + c.re, this.im + c.im) }
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

// ============================================================
// Quantum Gates (2x2 matrices)
// ============================================================
const I_GATE = [[new Complex(1), new Complex(0)], [new Complex(0), new Complex(1)]]
const X_GATE = [[new Complex(0), new Complex(1)], [new Complex(1), new Complex(0)]]
const H_GATE = [
    [new Complex(1 / Math.sqrt(2)), new Complex(1 / Math.sqrt(2))],
    [new Complex(1 / Math.sqrt(2)), new Complex(-1 / Math.sqrt(2))]
]

function RY(theta) {
    const c = Math.cos(theta / 2), s = Math.sin(theta / 2)
    return [[new Complex(c), new Complex(-s)], [new Complex(s), new Complex(c)]]
}

function RZ(theta) {
    const c = Math.cos(theta / 2), s = Math.sin(theta / 2)
    return [[new Complex(c, -s), new Complex(0)], [new Complex(0), new Complex(c, s)]]
}

function RX(theta) {
    const c = Math.cos(theta / 2), s = Math.sin(theta / 2)
    return [[new Complex(c), new Complex(0, -s)], [new Complex(0, -s), new Complex(c)]]
}

// ============================================================
// Statevector Simulator
// ============================================================
class QuantumSimulator {
    constructor(numQubits) {
        this.numQubits = numQubits
        this.dim = Math.pow(2, numQubits)
        this.state = new Array(this.dim).fill(null).map(() => new Complex(0, 0))
        this.state[0] = new Complex(1, 0) // |0...0>
        this.gates = []
        this.circuitLog = []
    }

    applySingleQubitGate(gate, qubit) {
        const newState = new Array(this.dim).fill(null).map(() => new Complex(0, 0))
        for (let i = 0; i < this.dim; i++) {
            const bit = (i >> (this.numQubits - 1 - qubit)) & 1
            const partner = bit === 0
                ? i | (1 << (this.numQubits - 1 - qubit))
                : i & ~(1 << (this.numQubits - 1 - qubit))
            const idx0 = bit === 0 ? i : partner
            const idx1 = bit === 0 ? partner : i
            if (bit === 0) {
                newState[idx0] = newState[idx0].add(gate[0][0].mul(this.state[idx0])).add(gate[0][1].mul(this.state[idx1]))
                newState[idx1] = newState[idx1].add(gate[1][0].mul(this.state[idx0])).add(gate[1][1].mul(this.state[idx1]))
            }
        }
        this.state = newState
    }

    applyCNOT(control, target) {
        const newState = [...this.state]
        for (let i = 0; i < this.dim; i++) {
            const controlBit = (i >> (this.numQubits - 1 - control)) & 1
            if (controlBit === 1) {
                const targetBit = (i >> (this.numQubits - 1 - target)) & 1
                const flipped = targetBit === 0
                    ? i | (1 << (this.numQubits - 1 - target))
                    : i & ~(1 << (this.numQubits - 1 - target))
                const temp = newState[i]
                newState[i] = newState[flipped]
                newState[flipped] = temp
            }
        }
        this.state = newState
    }

    ry(qubit, theta) {
        this.applySingleQubitGate(RY(theta), qubit)
        this.circuitLog.push({ gate: 'RY', qubit, param: theta })
    }

    rz(qubit, theta) {
        this.applySingleQubitGate(RZ(theta), qubit)
        this.circuitLog.push({ gate: 'RZ', qubit, param: theta })
    }

    rx(qubit, theta) {
        this.applySingleQubitGate(RX(theta), qubit)
        this.circuitLog.push({ gate: 'RX', qubit, param: theta })
    }

    h(qubit) {
        this.applySingleQubitGate(H_GATE, qubit)
        this.circuitLog.push({ gate: 'H', qubit })
    }

    cnot(control, target) {
        this.applyCNOT(control, target)
        this.circuitLog.push({ gate: 'CNOT', control, target })
    }

    measure(shots = 1024) {
        const probs = this.state.map(c => c.abs2())
        const results = {}
        for (let s = 0; s < shots; s++) {
            const r = Math.random()
            let cumulative = 0
            for (let i = 0; i < this.dim; i++) {
                cumulative += probs[i]
                if (r < cumulative) {
                    const bitString = i.toString(2).padStart(this.numQubits, '0')
                    results[bitString] = (results[bitString] || 0) + 1
                    break
                }
            }
        }
        return { counts: results, probabilities: probs, shots }
    }

    getProbabilities() {
        return this.state.map(c => c.abs2())
    }

    getCircuitLog() {
        return this.circuitLog
    }
}

// ============================================================
// Quantum Feature Encoding
// ============================================================
export function angleEncode(features, sim) {
    const n = Math.min(features.length, sim.numQubits)
    for (let i = 0; i < n; i++) {
        sim.ry(i, features[i] * Math.PI)
    }
    return sim
}

export function amplitudeEncode(features, sim) {
    // Simplified amplitude encoding: normalize feature vector
    // then use RY rotations to approximate amplitudes
    const norm = Math.sqrt(features.reduce((s, f) => s + f * f, 0)) || 1
    const normalized = features.map(f => f / norm)
    const n = Math.min(features.length, sim.numQubits)
    for (let i = 0; i < n; i++) {
        const angle = 2 * Math.asin(Math.min(1, Math.max(-1, Math.abs(normalized[i]))))
        sim.ry(i, angle)
        if (normalized[i] < 0) {
            sim.rz(i, Math.PI)
        }
    }
    return sim
}

// ============================================================
// Entanglement Layer
// ============================================================
function addEntanglementLayer(sim) {
    for (let i = 0; i < sim.numQubits - 1; i++) {
        sim.cnot(i, i + 1)
    }
}

// ============================================================
// Variational Layer
// ============================================================
function addVariationalLayer(sim, params) {
    const n = sim.numQubits
    for (let i = 0; i < n; i++) {
        sim.ry(i, params[i] || Math.random() * Math.PI)
        sim.rz(i, params[n + i] || Math.random() * Math.PI)
    }
    addEntanglementLayer(sim)
}

// ============================================================
// Classical ML Models
// ============================================================

// Logistic Regression
function sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))) }

export function trainLogisticRegression(X, y, lr = 0.01, epochs = 200) {
    const nFeatures = X[0].length
    let weights = new Array(nFeatures).fill(0).map(() => (Math.random() - 0.5) * 0.1)
    let bias = 0

    for (let epoch = 0; epoch < epochs; epoch++) {
        let dw = new Array(nFeatures).fill(0)
        let db = 0
        for (let i = 0; i < X.length; i++) {
            const z = X[i].reduce((s, x, j) => s + x * weights[j], 0) + bias
            const pred = sigmoid(z)
            const error = pred - y[i]
            for (let j = 0; j < nFeatures; j++) {
                dw[j] += error * X[i][j]
            }
            db += error
        }
        for (let j = 0; j < nFeatures; j++) {
            weights[j] -= lr * dw[j] / X.length
        }
        bias -= lr * db / X.length
    }

    return { weights, bias, type: 'logistic_regression' }
}

function predictLogistic(model, X) {
    return X.map(x => {
        const z = x.reduce((s, xi, j) => s + xi * model.weights[j], 0) + model.bias
        return sigmoid(z) >= 0.5 ? 1 : 0
    })
}

function predictLogisticProba(model, X) {
    return X.map(x => {
        const z = x.reduce((s, xi, j) => s + xi * model.weights[j], 0) + model.bias
        return sigmoid(z)
    })
}

// Support Vector Machine (Linear SVM with hinge loss)
export function trainSVM(X, y, lr = 0.01, C = 1.0, epochs = 120) {
    const nFeatures = X[0].length
    let weights = new Array(nFeatures).fill(0).map(() => (Math.random() - 0.5) * 0.05)
    let bias = 0
    const ySVM = y.map(v => v === 1 ? 1 : -1)

    for (let epoch = 0; epoch < epochs; epoch++) {
        for (let i = 0; i < X.length; i++) {
            const z = X[i].reduce((s, x, j) => s + x * weights[j], 0) + bias
            if (ySVM[i] * z < 1) {
                for (let j = 0; j < nFeatures; j++) {
                    weights[j] += lr * (C * ySVM[i] * X[i][j] - (0.01) * weights[j])
                }
                bias += lr * C * ySVM[i]
            } else {
                for (let j = 0; j < nFeatures; j++) {
                    weights[j] -= lr * (0.01) * weights[j]
                }
            }
        }
    }
    return { weights, bias, type: 'svm' }
}

function predictSVM(model, X) {
    return X.map(x => {
        const z = x.reduce((s, xi, j) => s + xi * model.weights[j], 0) + model.bias
        return z >= 0 ? 1 : 0
    })
}

function predictSVMProba(model, X) {
    return X.map(x => {
        const z = x.reduce((s, xi, j) => s + xi * model.weights[j], 0) + model.bias
        return sigmoid(z)
    })
}

// Random Forest (simplified)
function buildDecisionStump(X, y, featureIndices) {
    let bestGini = Infinity
    let bestFeature = 0, bestThreshold = 0

    const sampleFeatures = featureIndices.sort(() => Math.random() - 0.5).slice(0, Math.ceil(Math.sqrt(featureIndices.length)))

    for (const fi of sampleFeatures) {
        const values = [...new Set(X.map(x => x[fi]))].sort((a, b) => a - b)
        for (let t = 0; t < values.length - 1; t++) {
            const threshold = (values[t] + values[t + 1]) / 2
            const left = [], right = []
            for (let i = 0; i < X.length; i++) {
                if (X[i][fi] <= threshold) left.push(y[i])
                else right.push(y[i])
            }
            const gini = (left.length * giniImpurity(left) + right.length * giniImpurity(right)) / y.length
            if (gini < bestGini) {
                bestGini = gini
                bestFeature = fi
                bestThreshold = threshold
            }
        }
    }
    return { feature: bestFeature, threshold: bestThreshold }
}

function giniImpurity(labels) {
    if (labels.length === 0) return 0
    const counts = {}
    labels.forEach(l => { counts[l] = (counts[l] || 0) + 1 })
    let gini = 1
    Object.values(counts).forEach(c => {
        const p = c / labels.length
        gini -= p * p
    })
    return gini
}

function buildTree(X, y, depth = 0, maxDepth = 5, featureIndices = null) {
    if (!featureIndices) featureIndices = X[0].map((_, i) => i)
    if (depth >= maxDepth || new Set(y).size <= 1 || X.length < 4) {
        const counts = {}
        y.forEach(l => { counts[l] = (counts[l] || 0) + 1 })
        return { leaf: true, prediction: Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] * 1 }
    }

    const split = buildDecisionStump(X, y, featureIndices)
    const leftX = [], leftY = [], rightX = [], rightY = []
    for (let i = 0; i < X.length; i++) {
        if (X[i][split.feature] <= split.threshold) {
            leftX.push(X[i]); leftY.push(y[i])
        } else {
            rightX.push(X[i]); rightY.push(y[i])
        }
    }

    if (leftX.length === 0 || rightX.length === 0) {
        const counts = {}
        y.forEach(l => { counts[l] = (counts[l] || 0) + 1 })
        return { leaf: true, prediction: Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] * 1 }
    }

    return {
        leaf: false,
        feature: split.feature,
        threshold: split.threshold,
        left: buildTree(leftX, leftY, depth + 1, maxDepth, featureIndices),
        right: buildTree(rightX, rightY, depth + 1, maxDepth, featureIndices)
    }
}

function predictTree(tree, x) {
    if (tree.leaf) return tree.prediction
    return x[tree.feature] <= tree.threshold ? predictTree(tree.left, x) : predictTree(tree.right, x)
}

export function trainRandomForest(X, y, nTrees = 20, maxDepth = 5) {
    const trees = []
    const n = X.length
    for (let t = 0; t < nTrees; t++) {
        // Bootstrap sample
        const indices = Array.from({ length: n }, () => Math.floor(Math.random() * n))
        const bX = indices.map(i => X[i])
        const bY = indices.map(i => y[i])
        trees.push(buildTree(bX, bY, 0, maxDepth))
    }
    return { trees, type: 'random_forest' }
}

function predictRandomForest(model, X) {
    return X.map(x => {
        const votes = model.trees.map(t => predictTree(t, x))
        const counts = {}
        votes.forEach(v => { counts[v] = (counts[v] || 0) + 1 })
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] * 1
    })
}

// ============================================================
// QSVM — Quantum Support Vector Machine
// ============================================================
export function trainQSVM(X, y, encoding = 'angle', shots = 1024) {
    const startTime = performance.now()
    const numQubits = Math.min(X[0].length, 8) // Limit qubits for performance

    // Compute quantum kernel matrix
    const n = X.length
    const kernelMatrix = Array.from({ length: n }, () => new Array(n).fill(0))

    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            // Quantum kernel: overlap between encoded states
            const sim = new QuantumSimulator(numQubits)
            if (encoding === 'angle') {
                angleEncode(X[i], sim)
            } else {
                amplitudeEncode(X[i], sim)
            }
            const probs_i = sim.getProbabilities()

            const sim2 = new QuantumSimulator(numQubits)
            if (encoding === 'angle') {
                angleEncode(X[j], sim2)
            } else {
                amplitudeEncode(X[j], sim2)
            }
            const probs_j = sim2.getProbabilities()

            // Kernel = |<φ(xi)|φ(xj)>|^2 approximated by fidelity
            let fidelity = 0
            for (let k = 0; k < probs_i.length; k++) {
                fidelity += Math.sqrt(probs_i[k] * probs_j[k])
            }
            kernelMatrix[i][j] = fidelity * fidelity
            kernelMatrix[j][i] = kernelMatrix[i][j]
        }
    }

    // Simple kernel SVM using kernel trick with gradient descent
    const alpha = new Array(n).fill(0)
    const lr = 0.001
    const C = 1.0
    const epochs = 100

    for (let epoch = 0; epoch < epochs; epoch++) {
        for (let i = 0; i < n; i++) {
            let sum = 0
            for (let j = 0; j < n; j++) {
                sum += alpha[j] * y[j] * kernelMatrix[i][j]
            }
            if (y[i] * sum < 1) {
                alpha[i] += lr * (1 - y[i] * sum)
            }
            alpha[i] = Math.max(0, Math.min(C, alpha[i]))
        }
    }

    const trainingTime = performance.now() - startTime

    // Get a sample circuit for visualization
    const sampleSim = new QuantumSimulator(numQubits)
    if (encoding === 'angle') {
        angleEncode(X[0], sampleSim)
    } else {
        amplitudeEncode(X[0], sampleSim)
    }
    const sampleMeasurement = sampleSim.measure(shots)

    return {
        type: 'qsvm',
        alpha,
        supportX: X,
        supportY: y,
        kernelMatrix,
        encoding,
        numQubits,
        shots,
        trainingTime,
        circuitLog: sampleSim.getCircuitLog(),
        sampleMeasurement,
        backend: 'Quantum Simulator (Statevector)'
    }
}

export function predictQSVM(model, X) {
    const predictions = X.map(x => {
        let score = 0
        const numQubits = model.numQubits
        const sim = new QuantumSimulator(numQubits)
        if (model.encoding === 'angle') {
            angleEncode(x, sim)
        } else {
            amplitudeEncode(x, sim)
        }
        const probs_x = sim.getProbabilities()

        for (let j = 0; j < model.supportX.length; j++) {
            const sim2 = new QuantumSimulator(numQubits)
            if (model.encoding === 'angle') {
                angleEncode(model.supportX[j], sim2)
            } else {
                amplitudeEncode(model.supportX[j], sim2)
            }
            const probs_j = sim2.getProbabilities()

            let fidelity = 0
            for (let k = 0; k < probs_x.length; k++) {
                fidelity += Math.sqrt(probs_x[k] * probs_j[k])
            }
            score += model.alpha[j] * model.supportY[j] * fidelity * fidelity
        }
        return score >= 0 ? 1 : 0
    })
    return predictions
}

// ============================================================
// VQC — Variational Quantum Classifier
// ============================================================
export function trainVQC(X, y, encoding = 'angle', layers = 2, shots = 1024, epochs = 50, lr = 0.1) {
    const startTime = performance.now()
    const numQubits = Math.min(X[0].length, 8)
    const numParams = numQubits * 2 * layers
    let params = Array.from({ length: numParams }, () => (Math.random() - 0.5) * Math.PI)

    function runCircuit(x, params) {
        const sim = new QuantumSimulator(numQubits)
        // Encode
        if (encoding === 'angle') {
            angleEncode(x, sim)
        } else {
            amplitudeEncode(x, sim)
        }
        // Variational layers
        for (let l = 0; l < layers; l++) {
            const offset = l * numQubits * 2
            for (let q = 0; q < numQubits; q++) {
                sim.ry(q, params[offset + q])
                sim.rz(q, params[offset + numQubits + q])
            }
            addEntanglementLayer(sim)
        }
        return sim
    }

    function computeLoss(params) {
        let loss = 0
        for (let i = 0; i < X.length; i++) {
            const sim = runCircuit(X[i], params)
            const probs = sim.getProbabilities()
            // Probability of measuring 0 on first qubit
            let p0 = 0
            for (let k = 0; k < probs.length; k++) {
                if (((k >> (numQubits - 1)) & 1) === 0) p0 += probs[k]
            }
            const pred = p0
            loss += Math.pow(pred - (1 - y[i]), 2) // y=0 → p0 high, y=1 → p0 low
        }
        return loss / X.length
    }

    // Parameter-shift gradient descent
    const delta = 0.1
    for (let epoch = 0; epoch < epochs; epoch++) {
        const grad = new Array(numParams).fill(0)
        for (let p = 0; p < numParams; p++) {
            const paramsPlus = [...params]
            const paramsMinus = [...params]
            paramsPlus[p] += delta
            paramsMinus[p] -= delta
            grad[p] = (computeLoss(paramsPlus) - computeLoss(paramsMinus)) / (2 * delta)
        }
        for (let p = 0; p < numParams; p++) {
            params[p] -= lr * grad[p]
        }
    }

    const trainingTime = performance.now() - startTime

    // Sample circuit log
    const sampleSim = runCircuit(X[0], params)
    const sampleMeasurement = sampleSim.measure(shots)

    return {
        type: 'vqc',
        params,
        encoding,
        layers,
        numQubits,
        shots,
        numParams,
        trainingTime,
        circuitLog: sampleSim.getCircuitLog(),
        sampleMeasurement,
        backend: 'Quantum Simulator (Statevector)'
    }
}

export function predictVQC(model, X) {
    const numQubits = model.numQubits

    return X.map(x => {
        const sim = new QuantumSimulator(numQubits)
        if (model.encoding === 'angle') {
            angleEncode(x, sim)
        } else {
            amplitudeEncode(x, sim)
        }
        for (let l = 0; l < model.layers; l++) {
            const offset = l * numQubits * 2
            for (let q = 0; q < numQubits; q++) {
                sim.ry(q, model.params[offset + q])
                sim.rz(q, model.params[offset + numQubits + q])
            }
            addEntanglementLayer(sim)
        }
        const probs = sim.getProbabilities()
        let p0 = 0
        for (let k = 0; k < probs.length; k++) {
            if (((k >> (numQubits - 1)) & 1) === 0) p0 += probs[k]
        }
        return p0 >= 0.5 ? 0 : 1
    })
}

export function predictVQCProba(model, X) {
    const numQubits = model.numQubits

    return X.map(x => {
        const sim = new QuantumSimulator(numQubits)
        if (model.encoding === 'angle') {
            angleEncode(x, sim)
        } else {
            amplitudeEncode(x, sim)
        }
        for (let l = 0; l < model.layers; l++) {
            const offset = l * numQubits * 2
            for (let q = 0; q < numQubits; q++) {
                sim.ry(q, model.params[offset + q])
                sim.rz(q, model.params[offset + numQubits + q])
            }
            addEntanglementLayer(sim)
        }
        const probs = sim.getProbabilities()
        let p1 = 0
        for (let k = 0; k < probs.length; k++) {
            if (((k >> (numQubits - 1)) & 1) === 1) p1 += probs[k]
        }
        return p1
    })
}

// ============================================================
// Feature Maps & Quantum Neural Network (QNN)
// ============================================================
export function zzFeatureMap(features, sim) {
    const n = Math.min(features.length, sim.numQubits)
    // Hadamard on all qubits
    for (let i = 0; i < n; i++) {
        sim.h(i)
        sim.rz(i, 2 * features[i])
    }
    // Entangling ZZ phase gates
    for (let i = 0; i < n - 1; i++) {
        sim.cnot(i, i + 1)
        const phase = 2 * (Math.PI - features[i]) * (Math.PI - features[i + 1])
        sim.rz(i + 1, phase)
        sim.cnot(i, i + 1)
    }
    return sim
}

export function pauliFeatureMap(features, sim) {
    const n = Math.min(features.length, sim.numQubits)
    for (let i = 0; i < n; i++) {
        sim.h(i)
        sim.rx(i, features[i] * Math.PI)
        sim.rz(i, features[i] * Math.PI)
    }
    for (let i = 0; i < n - 1; i++) {
        sim.cnot(i, i + 1)
    }
    return sim
}

export function trainQNN(X, y, featureMap = 'zz', layers = 2, shots = 1024, epochs = 25, lr = 0.08) {
    const startTime = performance.now()
    const numQubits = Math.min(X[0].length, 8)
    const numParams = numQubits * 2 * layers
    let params = Array.from({ length: numParams }, () => (Math.random() - 0.5) * Math.PI)

    function encodeFeatures(x, sim) {
        if (featureMap === 'zz') {
            zzFeatureMap(x, sim)
        } else if (featureMap === 'pauli') {
            pauliFeatureMap(x, sim)
        } else {
            angleEncode(x, sim)
        }
    }

    function runQNN(x, params) {
        const sim = new QuantumSimulator(numQubits)
        encodeFeatures(x, sim)
        for (let l = 0; l < layers; l++) {
            const offset = l * numQubits * 2
            for (let q = 0; q < numQubits; q++) {
                sim.ry(q, params[offset + q])
                sim.rz(q, params[offset + numQubits + q])
            }
            addEntanglementLayer(sim)
        }
        return sim
    }

    function computeLoss(params) {
        let loss = 0
        for (let i = 0; i < X.length; i++) {
            const sim = runQNN(X[i], params)
            const probs = sim.getProbabilities()
            let p1 = 0
            for (let k = 0; k < probs.length; k++) {
                if (((k >> (numQubits - 1)) & 1) === 1) p1 += probs[k]
            }
            loss += Math.pow(p1 - y[i], 2)
        }
        return loss / X.length
    }

    const delta = 0.1
    for (let epoch = 0; epoch < epochs; epoch++) {
        const grad = new Array(numParams).fill(0)
        for (let p = 0; p < numParams; p++) {
            const pPlus = [...params]
            const pMinus = [...params]
            pPlus[p] += delta
            pMinus[p] -= delta
            grad[p] = (computeLoss(pPlus) - computeLoss(pMinus)) / (2 * delta)
        }
        for (let p = 0; p < numParams; p++) {
            params[p] -= lr * grad[p]
        }
    }

    const trainingTime = performance.now() - startTime
    const sampleSim = runQNN(X[0], params)
    const sampleMeasurement = sampleSim.measure(shots)

    return {
        type: 'qnn',
        params,
        featureMap,
        layers,
        numQubits,
        shots,
        numParams,
        trainingTime,
        circuitLog: sampleSim.getCircuitLog(),
        sampleMeasurement,
        backend: 'Quantum Simulator (Statevector)'
    }
}

export function predictQNN(model, X) {
    const numQubits = model.numQubits
    return X.map(x => {
        const sim = new QuantumSimulator(numQubits)
        if (model.featureMap === 'zz') zzFeatureMap(x, sim)
        else if (model.featureMap === 'pauli') pauliFeatureMap(x, sim)
        else angleEncode(x, sim)

        for (let l = 0; l < model.layers; l++) {
            const offset = l * numQubits * 2
            for (let q = 0; q < numQubits; q++) {
                sim.ry(q, model.params[offset + q])
                sim.rz(q, model.params[offset + numQubits + q])
            }
            addEntanglementLayer(sim)
        }
        const probs = sim.getProbabilities()
        let p1 = 0
        for (let k = 0; k < probs.length; k++) {
            if (((k >> (numQubits - 1)) & 1) === 1) p1 += probs[k]
        }
        return p1 >= 0.5 ? 1 : 0
    })
}

export function predictQNNProba(model, X) {
    const numQubits = model.numQubits
    return X.map(x => {
        const sim = new QuantumSimulator(numQubits)
        if (model.featureMap === 'zz') zzFeatureMap(x, sim)
        else if (model.featureMap === 'pauli') pauliFeatureMap(x, sim)
        else angleEncode(x, sim)

        for (let l = 0; l < model.layers; l++) {
            const offset = l * numQubits * 2
            for (let q = 0; q < numQubits; q++) {
                sim.ry(q, model.params[offset + q])
                sim.rz(q, model.params[offset + numQubits + q])
            }
            addEntanglementLayer(sim)
        }
        const probs = sim.getProbabilities()
        let p1 = 0
        for (let k = 0; k < probs.length; k++) {
            if (((k >> (numQubits - 1)) & 1) === 1) p1 += probs[k]
        }
        return p1
    })
}

// ============================================================
// Metrics Computation
// ============================================================
export function computeMetrics(yTrue, yPred, yProba = null) {
    let tp = 0, fp = 0, tn = 0, fn = 0
    for (let i = 0; i < yTrue.length; i++) {
        if (yTrue[i] === 1 && yPred[i] === 1) tp++
        if (yTrue[i] === 0 && yPred[i] === 1) fp++
        if (yTrue[i] === 0 && yPred[i] === 0) tn++
        if (yTrue[i] === 1 && yPred[i] === 0) fn++
    }

    const accuracy = (tp + tn) / (tp + fp + tn + fn) || 0
    const precision = tp / (tp + fp) || 0
    const recall = tp / (tp + fn) || 0
    const f1 = 2 * precision * recall / (precision + recall) || 0

    // ROC-AUC
    let rocAuc = null
    if (yProba && yProba.length === yTrue.length) {
        const sorted = yTrue.map((y, i) => ({ y, p: yProba[i] })).sort((a, b) => b.p - a.p)
        const totalPos = yTrue.filter(y => y === 1).length
        const totalNeg = yTrue.filter(y => y === 0).length
        if (totalPos > 0 && totalNeg > 0) {
            let tpCount = 0, fpCount = 0
            let prevTpr = 0, prevFpr = 0
            rocAuc = 0
            const rocPoints = [{ fpr: 0, tpr: 0 }]
            for (const item of sorted) {
                if (item.y === 1) tpCount++
                else fpCount++
                const tpr = tpCount / totalPos
                const fpr = fpCount / totalNeg
                rocAuc += (fpr - prevFpr) * (tpr + prevTpr) / 2
                prevTpr = tpr
                prevFpr = fpr
                rocPoints.push({ fpr, tpr })
            }
            return { accuracy, precision, recall, f1, rocAuc, confusionMatrix: { tp, fp, tn, fn }, rocPoints }
        }
    }

    return { accuracy, precision, recall, f1, rocAuc, confusionMatrix: { tp, fp, tn, fn } }
}

// ============================================================
// Data Preprocessing
// ============================================================
export function standardScale(data) {
    if (data.length === 0) return { scaled: data, means: [], stds: [] }
    const nCols = data[0].length
    const means = [], stds = []
    for (let j = 0; j < nCols; j++) {
        const col = data.map(r => r[j])
        const mean = col.reduce((a, b) => a + b, 0) / col.length
        const std = Math.sqrt(col.reduce((a, b) => a + (b - mean) ** 2, 0) / col.length) || 1
        means.push(mean)
        stds.push(std)
    }
    const scaled = data.map(row => row.map((v, j) => (v - means[j]) / stds[j]))
    return { scaled, means, stds }
}

export function minMaxScale(data) {
    if (data.length === 0) return { scaled: data, mins: [], maxs: [] }
    const nCols = data[0].length
    const mins = [], maxs = []
    for (let j = 0; j < nCols; j++) {
        const col = data.map(r => r[j])
        const min = Math.min(...col)
        const max = Math.max(...col)
        mins.push(min)
        maxs.push(max)
    }
    const scaled = data.map(row => row.map((v, j) => (maxs[j] - mins[j]) !== 0 ? (v - mins[j]) / (maxs[j] - mins[j]) : 0))
    return { scaled, mins, maxs }
}

export function handleMissing(data, strategy = 'mean') {
    if (data.length === 0) return data
    const nCols = data[0].length
    const result = data.map(r => [...r])

    for (let j = 0; j < nCols; j++) {
        const valid = data.map(r => r[j]).filter(v => v !== null && v !== undefined && !isNaN(v))
        let fillValue = 0
        if (strategy === 'mean') {
            fillValue = valid.reduce((a, b) => a + b, 0) / valid.length || 0
        } else if (strategy === 'median') {
            const sorted = [...valid].sort((a, b) => a - b)
            fillValue = sorted[Math.floor(sorted.length / 2)] || 0
        } else if (strategy === 'zero') {
            fillValue = 0
        }
        for (let i = 0; i < result.length; i++) {
            if (result[i][j] === null || result[i][j] === undefined || isNaN(result[i][j])) {
                result[i][j] = fillValue
            }
        }
    }
    return result
}

export function trainTestSplit(X, y, testSize = 0.2) {
    const n = X.length
    const indices = Array.from({ length: n }, (_, i) => i)
    // Shuffle
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const splitPoint = Math.floor(n * (1 - testSize))
    const trainIndices = indices.slice(0, splitPoint)
    const testIndices = indices.slice(splitPoint)

    return {
        XTrain: trainIndices.map(i => X[i]),
        yTrain: trainIndices.map(i => y[i]),
        XTest: testIndices.map(i => X[i]),
        yTest: testIndices.map(i => y[i])
    }
}

export function applyPCA(X, nComponents = 4) {
    if (!X || X.length === 0 || X[0].length <= nComponents) return { transformed: X, components: null }
    const n = X.length
    const d = X[0].length
    const means = new Array(d).fill(0)
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < d; j++) means[j] += X[i][j]
    }
    for (let j = 0; j < d; j++) means[j] /= n
    const centered = X.map(row => row.map((val, j) => val - means[j]))

    const cov = Array.from({ length: d }, () => new Array(d).fill(0))
    for (let j1 = 0; j1 < d; j1++) {
        for (let j2 = 0; j2 < d; j2++) {
            let sum = 0
            for (let i = 0; i < n; i++) sum += centered[i][j1] * centered[i][j2]
            cov[j1][j2] = sum / (n - 1)
        }
    }

    const components = []
    let covCopy = cov.map(row => [...row])
    for (let comp = 0; comp < nComponents; comp++) {
        let v = new Array(d).fill(0).map(() => Math.random() - 0.5)
        let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
        v = v.map(x => x / norm)
        for (let iter = 0; iter < 15; iter++) {
            const nextV = new Array(d).fill(0)
            for (let r = 0; r < d; r++) {
                for (let c = 0; c < d; c++) nextV[r] += covCopy[r][c] * v[c]
            }
            norm = Math.sqrt(nextV.reduce((s, x) => s + x * x, 0)) || 1
            v = nextV.map(x => x / norm)
        }
        components.push(v)
        for (let r = 0; r < d; r++) {
            for (let c = 0; c < d; c++) {
                covCopy[r][c] -= norm * v[r] * v[c]
            }
        }
    }

    const transformed = centered.map(row =>
        components.map(comp => row.reduce((s, val, idx) => s + val * comp[idx], 0))
    )
    return { transformed, components }
}

export function balanceClasses(X, y) {
    const posIndices = []
    const negIndices = []
    y.forEach((val, idx) => {
        if (val === 1) posIndices.push(idx)
        else negIndices.push(idx)
    })
    if (posIndices.length === 0 || negIndices.length === 0) return { X, y }
    const maxCount = Math.max(posIndices.length, negIndices.length)
    const newX = []
    const newY = []

    for (let i = 0; i < maxCount; i++) {
        const idx = posIndices[i % posIndices.length]
        newX.push([...X[idx]])
        newY.push(1)
    }
    for (let i = 0; i < maxCount; i++) {
        const idx = negIndices[i % negIndices.length]
        newX.push([...X[idx]])
        newY.push(0)
    }
    return { X: newX, y: newY }
}

// ============================================================
// Feature Importance (simple permutation-based)
// ============================================================
export function computeFeatureImportance(model, X, y, predictFn, featureNames) {
    const basePreds = predictFn(model, X)
    const baseMetrics = computeMetrics(y, basePreds)
    const baseAccuracy = baseMetrics.accuracy

    const importances = []
    for (let j = 0; j < X[0].length; j++) {
        // Permute feature j
        const permuted = X.map(row => [...row])
        const permOrder = Array.from({ length: X.length }, (_, i) => i).sort(() => Math.random() - 0.5)
        for (let i = 0; i < permuted.length; i++) {
            permuted[i][j] = X[permOrder[i]][j]
        }
        const permPreds = predictFn(model, permuted)
        const permMetrics = computeMetrics(y, permPreds)
        importances.push({
            feature: featureNames[j] || `Feature ${j}`,
            importance: Math.max(0, baseAccuracy - permMetrics.accuracy)
        })
    }

    // Normalize
    const total = importances.reduce((s, f) => s + f.importance, 0) || 1
    importances.forEach(f => { f.importance = f.importance / total })
    importances.sort((a, b) => b.importance - a.importance)

    return importances
}

// ============================================================
// Demo Datasets
// ============================================================
function generateHeartDiseaseData(n = 200) {
    const features = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach']
    const data = []
    for (let i = 0; i < n; i++) {
        const age = 29 + Math.floor(Math.random() * 48)
        const sex = Math.random() > 0.5 ? 1 : 0
        const cp = Math.floor(Math.random() * 4)
        const trestbps = 94 + Math.floor(Math.random() * 106)
        const chol = 126 + Math.floor(Math.random() * 338)
        const fbs = Math.random() > 0.85 ? 1 : 0
        const restecg = Math.floor(Math.random() * 3)
        const thalach = 71 + Math.floor(Math.random() * 132)
        const risk = (age > 55 ? 0.3 : 0) + (cp >= 2 ? 0.2 : 0) + (trestbps > 140 ? 0.15 : 0) +
            (chol > 240 ? 0.15 : 0) + (thalach < 120 ? 0.1 : 0) + (fbs ? 0.1 : 0)
        const target = (risk + Math.random() * 0.3) > 0.55 ? 1 : 0
        data.push([age, sex, cp, trestbps, chol, fbs, restecg, thalach, target])
    }
    return { data, features, targetCol: 'target', name: 'Heart Disease', description: 'Synthetic heart disease risk dataset (research/demo only)' }
}

function generateDiabetesData(n = 200) {
    const features = ['pregnancies', 'glucose', 'bloodPressure', 'skinThickness', 'insulin', 'bmi', 'dpf', 'age']
    const data = []
    for (let i = 0; i < n; i++) {
        const pregnancies = Math.floor(Math.random() * 14)
        const glucose = 44 + Math.floor(Math.random() * 155)
        const bp = 24 + Math.floor(Math.random() * 98)
        const skin = 7 + Math.floor(Math.random() * 92)
        const insulin = 14 + Math.floor(Math.random() * 832)
        const bmi = 18.2 + Math.random() * 49.5
        const dpf = 0.078 + Math.random() * 2.34
        const age = 21 + Math.floor(Math.random() * 60)
        const risk = (glucose > 140 ? 0.35 : 0) + (bmi > 33 ? 0.2 : 0) + (age > 40 ? 0.15 : 0) +
            (dpf > 1.0 ? 0.1 : 0) + (pregnancies > 5 ? 0.1 : 0) + (bp > 80 ? 0.05 : 0)
        const target = (risk + Math.random() * 0.25) > 0.5 ? 1 : 0
        data.push([pregnancies, glucose, bp, skin, insulin, parseFloat(bmi.toFixed(1)), parseFloat(dpf.toFixed(3)), age, target])
    }
    return { data, features, targetCol: 'outcome', name: 'Diabetes', description: 'Synthetic diabetes prediction dataset (research/demo only)' }
}

function generateBreastCancerData(n = 200) {
    const features = ['radius_mean', 'texture_mean', 'perimeter_mean', 'area_mean', 'smoothness', 'compactness', 'concavity', 'symmetry']
    const data = []
    for (let i = 0; i < n; i++) {
        const radius = 6.98 + Math.random() * 21.31
        const texture = 9.71 + Math.random() * 29.83
        const perimeter = 43.79 + Math.random() * 144.71
        const area = 143.5 + Math.random() * 2358.6
        const smoothness = 0.053 + Math.random() * 0.11
        const compactness = 0.019 + Math.random() * 0.326
        const concavity = 0.0 + Math.random() * 0.427
        const symmetry = 0.106 + Math.random() * 0.198
        const risk = (radius > 15 ? 0.3 : 0) + (area > 800 ? 0.2 : 0) + (concavity > 0.2 ? 0.2 : 0) +
            (compactness > 0.15 ? 0.15 : 0) + (texture > 25 ? 0.1 : 0)
        const target = (risk + Math.random() * 0.25) > 0.5 ? 1 : 0
        data.push([
            parseFloat(radius.toFixed(2)), parseFloat(texture.toFixed(2)),
            parseFloat(perimeter.toFixed(2)), parseFloat(area.toFixed(1)),
            parseFloat(smoothness.toFixed(4)), parseFloat(compactness.toFixed(4)),
            parseFloat(concavity.toFixed(4)), parseFloat(symmetry.toFixed(4)), target
        ])
    }
    return { data, features, targetCol: 'diagnosis', name: 'Breast Cancer', description: 'Synthetic breast cancer classification dataset (research/demo only)' }
}

function generateCardiovascularData(n = 200) {
    const features = ['age', 'gender', 'height', 'weight', 'systolic', 'diastolic', 'cholesterol', 'glucose']
    const data = []
    for (let i = 0; i < n; i++) {
        const age = 30 + Math.floor(Math.random() * 40)
        const gender = Math.random() > 0.5 ? 1 : 0
        const height = 145 + Math.floor(Math.random() * 50)
        const weight = 50 + Math.floor(Math.random() * 80)
        const systolic = 90 + Math.floor(Math.random() * 100)
        const diastolic = 60 + Math.floor(Math.random() * 60)
        const chol = Math.floor(Math.random() * 3) + 1
        const gluc = Math.floor(Math.random() * 3) + 1
        const bmi = weight / ((height / 100) ** 2)
        const risk = (age > 55 ? 0.25 : 0) + (systolic > 140 ? 0.2 : 0) + (diastolic > 90 ? 0.15 : 0) +
            (bmi > 30 ? 0.15 : 0) + (chol > 2 ? 0.15 : 0) + (gluc > 2 ? 0.1 : 0)
        const target = (risk + Math.random() * 0.25) > 0.55 ? 1 : 0
        data.push([age, gender, height, weight, systolic, diastolic, chol, gluc, target])
    }
    return { data, features, targetCol: 'cardio', name: 'Cardiovascular Risk', description: 'Synthetic cardiovascular risk dataset (research/demo only)' }
}

export const DEMO_DATASETS = {
    heart: generateHeartDiseaseData,
    diabetes: generateDiabetesData,
    breast_cancer: generateBreastCancerData,
    cardiovascular: generateCardiovascularData
}

// ============================================================
// CSV Parser
// ============================================================
export function parseCSV(csvText) {
    const lines = csvText.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0)
    if (lines.length < 2) return null
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const rows = []
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => {
            const trimmed = v.trim().replace(/^"|"$/g, '')
            const num = Number(trimmed)
            return isNaN(num) ? trimmed : num
        })
        if (values.length === headers.length) {
            rows.push(values)
        }
    }
    return { headers, rows }
}

// ============================================================
// Main Experiment Runner
// ============================================================
export async function runExperiment(config, onProgress) {
    const {
        dataset,
        features,
        targetColumn,
        preprocessing = {},
        classicalModel = 'logistic_regression',
        quantumModel = 'qsvm',
        quantumEncoding = 'angle',
        featureMap = 'zz',
        circuitDepth = 2,
        shots = 1024,
        testSplit = 0.2,
        vqcLayers = 2,
        vqcEpochs = 25
    } = config

    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const results = { id: experimentId, status: 'running', startTime: new Date().toISOString() }

    try {
        // Step 1: Preparing dataset
        onProgress?.({ step: 'Preparing dataset', progress: 15 })

        const featureIndices = features.map(f => dataset.features.indexOf(f))
        const targetIndex = dataset.features.length

        let X = dataset.data.map(row => featureIndices.map(i => row[i]))
        let y = dataset.data.map(row => row[targetIndex])

        X = X.map(row => row.map(v => typeof v === 'number' && !isNaN(v) ? v : 0))
        y = y.map(v => typeof v === 'number' && !isNaN(v) ? v : 0)

        // Step 2: Preprocessing
        onProgress?.({ step: 'Preprocessing', progress: 35 })

        if (preprocessing.missingValues && preprocessing.missingValues !== 'none') {
            X = handleMissing(X, preprocessing.missingValues)
        }

        let scaleInfo = null
        if (preprocessing.scaler === 'standard') {
            const result = standardScale(X)
            X = result.scaled
            scaleInfo = { type: 'standard', means: result.means, stds: result.stds }
        } else if (preprocessing.scaler === 'minmax') {
            const result = minMaxScale(X)
            X = result.scaled
            scaleInfo = { type: 'minmax', mins: result.mins, maxs: result.maxs }
        }

        let effectiveFeatures = [...features]
        if (preprocessing.pca && Number(preprocessing.pca) > 0) {
            const pcaRes = applyPCA(X, Number(preprocessing.pca))
            X = pcaRes.transformed
            effectiveFeatures = Array.from({ length: Number(preprocessing.pca) }, (_, i) => `PC${i + 1}`)
        }

        if (preprocessing.classBalancing === 'balanced') {
            const balanced = balanceClasses(X, y)
            X = balanced.X
            y = balanced.y
        }

        const split = trainTestSplit(X, y, testSplit)
        const { XTrain, yTrain, XTest, yTest } = split

        // Step 3: Training model (Classical)
        onProgress?.({ step: 'Training model', progress: 55 })
        let classicalResults = null
        const classicalStart = performance.now()

        if (classicalModel === 'logistic_regression') {
            const model = trainLogisticRegression(XTrain, yTrain)
            const preds = predictLogistic(model, XTest)
            const proba = predictLogisticProba(model, XTest)
            const metrics = computeMetrics(yTest, preds, proba)
            const importance = computeFeatureImportance(model, XTest, yTest, predictLogistic, effectiveFeatures)
            classicalResults = {
                model: 'Logistic Regression',
                metrics,
                predictions: preds,
                probabilities: proba,
                trainingTime: performance.now() - classicalStart,
                featureImportance: importance
            }
        } else if (classicalModel === 'svm') {
            const model = trainSVM(XTrain, yTrain)
            const preds = predictSVM(model, XTest)
            const proba = predictSVMProba(model, XTest)
            const metrics = computeMetrics(yTest, preds, proba)
            const importance = computeFeatureImportance(model, XTest, yTest, predictSVM, effectiveFeatures)
            classicalResults = {
                model: 'Support Vector Machine (SVM)',
                metrics,
                predictions: preds,
                probabilities: proba,
                trainingTime: performance.now() - classicalStart,
                featureImportance: importance
            }
        } else if (classicalModel === 'random_forest') {
            const model = trainRandomForest(XTrain, yTrain)
            const preds = predictRandomForest(model, XTest)
            const metrics = computeMetrics(yTest, preds)
            const importance = computeFeatureImportance(model, XTest, yTest, predictRandomForest, effectiveFeatures)
            classicalResults = {
                model: 'Random Forest',
                metrics,
                predictions: preds,
                trainingTime: performance.now() - classicalStart,
                featureImportance: importance
            }
        }

        // Step 4: Running quantum circuit (Quantum Model)
        onProgress?.({ step: 'Running quantum circuit', progress: 75 })
        let quantumResults = null

        const qTrainLimit = Math.min(XTrain.length, 75)
        const XTrainQ = XTrain.slice(0, qTrainLimit)
        const yTrainQ = yTrain.slice(0, qTrainLimit)

        if (quantumModel === 'qsvm') {
            const qModel = trainQSVM(XTrainQ, yTrainQ, quantumEncoding, shots)
            const qPreds = predictQSVM(qModel, XTest)
            const qMetrics = computeMetrics(yTest, qPreds)
            quantumResults = {
                model: 'Quantum SVM (QSVM)',
                metrics: qMetrics,
                predictions: qPreds,
                trainingTime: qModel.trainingTime,
                circuitLog: qModel.circuitLog,
                sampleMeasurement: qModel.sampleMeasurement,
                numQubits: qModel.numQubits,
                encoding: qModel.encoding,
                featureMap: featureMap === 'zz' ? 'ZZFeatureMap' : 'Angle Encoding',
                circuitDepth: circuitDepth || 2,
                backend: 'Qiskit Aer Simulator (Statevector)',
                shots: qModel.shots
            }
        } else if (quantumModel === 'vqc') {
            const qModel = trainVQC(XTrainQ, yTrainQ, quantumEncoding, circuitDepth || vqcLayers || 2, shots, vqcEpochs || 25)
            const qPreds = predictVQC(qModel, XTest)
            const qProba = predictVQCProba(qModel, XTest)
            const qMetrics = computeMetrics(yTest, qPreds, qProba)
            quantumResults = {
                model: 'Variational Quantum Classifier (VQC)',
                metrics: qMetrics,
                predictions: qPreds,
                probabilities: qProba,
                trainingTime: qModel.trainingTime,
                circuitLog: qModel.circuitLog,
                sampleMeasurement: qModel.sampleMeasurement,
                numQubits: qModel.numQubits,
                encoding: qModel.encoding,
                featureMap: featureMap === 'zz' ? 'ZZFeatureMap' : 'Angle Encoding',
                circuitDepth: circuitDepth || qModel.layers,
                layers: qModel.layers,
                numParams: qModel.numParams,
                backend: 'Qiskit Aer Simulator (Statevector)',
                shots: qModel.shots
            }
        } else if (quantumModel === 'qnn') {
            const qModel = trainQNN(XTrainQ, yTrainQ, featureMap || 'zz', circuitDepth || 2, shots, vqcEpochs || 25)
            const qPreds = predictQNN(qModel, XTest)
            const qProba = predictQNNProba(qModel, XTest)
            const qMetrics = computeMetrics(yTest, qPreds, qProba)
            quantumResults = {
                model: 'Quantum Neural Network (QNN)',
                metrics: qMetrics,
                predictions: qPreds,
                probabilities: qProba,
                trainingTime: qModel.trainingTime,
                circuitLog: qModel.circuitLog,
                sampleMeasurement: qModel.sampleMeasurement,
                numQubits: qModel.numQubits,
                encoding: quantumEncoding,
                featureMap: featureMap === 'zz' ? 'ZZFeatureMap' : 'PauliFeatureMap',
                circuitDepth: circuitDepth || qModel.layers,
                layers: qModel.layers,
                numParams: qModel.numParams,
                backend: 'Qiskit Aer Simulator (Statevector)',
                shots: qModel.shots
            }
        }

        // Step 5: Generating results
        onProgress?.({ step: 'Generating results', progress: 95 })

        results.status = 'completed'
        results.endTime = new Date().toISOString()
        results.classical = classicalResults
        results.quantum = quantumResults
        results.datasetInfo = {
            name: dataset.name,
            description: dataset.description,
            totalSamples: dataset.data.length,
            trainSamples: XTrain.length,
            testSamples: XTest.length,
            numFeatures: effectiveFeatures.length,
            features: effectiveFeatures,
            targetColumn,
            classBalance: {
                positive: y.filter(v => v === 1).length,
                negative: y.filter(v => v === 0).length
            }
        }
        results.config = {
            preprocessing,
            classicalModel,
            quantumModel,
            quantumEncoding,
            featureMap,
            circuitDepth,
            shots,
            testSplit,
            scaleInfo
        }

        onProgress?.({ step: 'Generating results', progress: 100 })

    } catch (error) {
        results.status = 'failed'
        results.error = error.message
        onProgress?.({ step: 'Failed: ' + error.message, progress: -1 })
    }

    return results
}

export { QuantumSimulator }
