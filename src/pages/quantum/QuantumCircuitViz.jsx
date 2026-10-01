import { useMemo } from 'react'

/**
 * QuantumCircuitViz
 * 
 * A read-only quantum circuit visualizer that renders qubit wires,
 * rotation gates, entanglement gates, and measurement operations
 * from a circuit log.
 */
export default function QuantumCircuitViz({
    circuitLog,
    numQubits,
    featureMap = 'ZZFeatureMap',
    circuitDepth,
    entanglement = 'Linear CNOT',
    measurements = 'Computational Basis Z'
}) {
    const circuitData = useMemo(() => {
        if (!circuitLog || circuitLog.length === 0 || !numQubits) return null

        // Group gates into time steps
        const timeSteps = []
        const occupied = new Set()

        for (const gate of circuitLog) {
            const isTwoQubit = gate.gate === 'CNOT' || gate.gate === 'CX'
            if (isTwoQubit) {
                const qubits = [gate.control !== undefined ? gate.control : (gate.qubits?.[0] ?? 0), gate.target !== undefined ? gate.target : (gate.qubits?.[1] ?? 1)]
                let stepIdx = timeSteps.length - 1
                while (stepIdx >= 0 && qubits.some(q => timeSteps[stepIdx].some(g =>
                    (g.gate === 'CNOT' || g.gate === 'CX') ? [g.control ?? g.qubits?.[0], g.target ?? g.qubits?.[1]].includes(q) : g.qubit === q
                ))) {
                    stepIdx--
                }
                stepIdx++
                if (stepIdx >= timeSteps.length) timeSteps.push([])
                timeSteps[stepIdx].push(gate)
            } else {
                const qTarget = gate.qubit !== undefined ? gate.qubit : (gate.qubits?.[0] ?? 0)
                let stepIdx = timeSteps.length - 1
                while (stepIdx >= 0 && timeSteps[stepIdx].some(g =>
                    (g.gate === 'CNOT' || g.gate === 'CX') ? [g.control ?? g.qubits?.[0], g.target ?? g.qubits?.[1]].includes(qTarget) : g.qubit === qTarget
                )) {
                    stepIdx--
                }
                stepIdx++
                if (stepIdx >= timeSteps.length) timeSteps.push([])
                timeSteps[stepIdx].push(gate)
            }
        }

        // Add measurement step
        timeSteps.push(Array.from({ length: numQubits }, (_, i) => ({ gate: 'M', qubit: i })))

        return { timeSteps, numQubits }
    }, [circuitLog, numQubits])

    if (!circuitData) {
        return <div className="qi-circuit-empty">No circuit execution data available</div>
    }

    const { timeSteps } = circuitData
    const cellWidth = 72
    const cellHeight = 48
    const labelWidth = 48
    const totalWidth = Math.max(680, labelWidth + timeSteps.length * cellWidth + 40)
    const totalHeight = numQubits * cellHeight + 20

    const getGateColor = (gate) => {
        switch (gate) {
            case 'RY': return { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8' }
            case 'RX': return { bg: '#F0FDFA', border: '#0D9488', text: '#0F766E' }
            case 'RZ': return { bg: '#FEF3C7', border: '#F59E0B', text: '#B45309' }
            case 'P': return { bg: '#FEF3C7', border: '#F59E0B', text: '#B45309' }
            case 'H': return { bg: '#F5F3FF', border: '#8B5CF6', text: '#6D28D9' }
            case 'M': return { bg: '#F1F5F9', border: '#64748B', text: '#334155' }
            case 'CNOT':
            case 'CX': return { bg: '#EFF6FF', border: '#2563EB', text: '#1D4ED8' }
            default: return { bg: '#F8FAFC', border: '#94A3B8', text: '#475569' }
        }
    }

    const formatParam = (param) => {
        if (param === undefined) return ''
        const val = param / Math.PI
        if (Math.abs(val - Math.round(val)) < 0.01) {
            const rounded = Math.round(val)
            if (rounded === 0) return '0'
            if (rounded === 1) return 'π'
            if (rounded === -1) return '-π'
            return `${rounded}π`
        }
        return `${val.toFixed(2)}π`
    }

    const depth = circuitDepth || (timeSteps.length - 1)

    return (
        <div className="qi-circuit-viz">
            <div className="qi-circuit-meta-row">
                <div className="qi-circuit-meta-item">
                    <span className="qi-meta-label">Qubits</span>
                    <span className="qi-meta-val">{numQubits}</span>
                </div>
                <div className="qi-circuit-meta-item">
                    <span className="qi-meta-label">Gates</span>
                    <span className="qi-meta-val">{circuitLog.length}</span>
                </div>
                <div className="qi-circuit-meta-item">
                    <span className="qi-meta-label">Feature Map</span>
                    <span className="qi-meta-val">{featureMap}</span>
                </div>
                <div className="qi-circuit-meta-item">
                    <span className="qi-meta-label">Entanglement</span>
                    <span className="qi-meta-val">{entanglement}</span>
                </div>
                <div className="qi-circuit-meta-item">
                    <span className="qi-meta-label">Circuit Depth</span>
                    <span className="qi-meta-val">{depth}</span>
                </div>
                <div className="qi-circuit-meta-item">
                    <span className="qi-meta-label">Measurements</span>
                    <span className="qi-meta-val">{measurements}</span>
                </div>
            </div>
            <div className="qi-circuit-scroll">
                <svg width={totalWidth} height={totalHeight} viewBox={`0 0 ${totalWidth} ${totalHeight}`}>
                    {/* Qubit labels and wires */}
                    {Array.from({ length: numQubits }, (_, q) => {
                        const y = 10 + q * cellHeight + cellHeight / 2
                        return (
                            <g key={`wire-${q}`}>
                                <text x={8} y={y + 4} fontSize="12" fontWeight="600" fill="#334155" fontFamily="'JetBrains Mono', monospace">
                                    q{q}
                                </text>
                                <line
                                    x1={labelWidth}
                                    y1={y}
                                    x2={totalWidth - 20}
                                    y2={y}
                                    stroke="#CBD5E1"
                                    strokeWidth="1.5"
                                />
                            </g>
                        )
                    })}

                    {/* Gates */}
                    {timeSteps.map((stepGates, stepIdx) =>
                        stepGates.map((gate, gateIdx) => {
                            const x = labelWidth + stepIdx * cellWidth + cellWidth / 2
                            const colors = getGateColor(gate.gate)

                            if (gate.gate === 'CNOT' || gate.gate === 'CX') {
                                const cQ = gate.control !== undefined ? gate.control : (gate.qubits?.[0] ?? 0)
                                const tQ = gate.target !== undefined ? gate.target : (gate.qubits?.[1] ?? 1)
                                const cy = 10 + cQ * cellHeight + cellHeight / 2
                                const ty = 10 + tQ * cellHeight + cellHeight / 2
                                return (
                                    <g key={`${stepIdx}-${gateIdx}`}>
                                        {/* Vertical line */}
                                        <line x1={x} y1={cy} x2={x} y2={ty} stroke={colors.border} strokeWidth="1.5" />
                                        {/* Control dot */}
                                        <circle cx={x} cy={cy} r={4} fill={colors.border} />
                                        {/* Target circle */}
                                        <circle cx={x} cy={ty} r={10} fill="none" stroke={colors.border} strokeWidth="1.5" />
                                        <line x1={x - 7} y1={ty} x2={x + 7} y2={ty} stroke={colors.border} strokeWidth="1.5" />
                                        <line x1={x} y1={ty - 7} x2={x} y2={ty + 7} stroke={colors.border} strokeWidth="1.5" />
                                    </g>
                                )
                            }

                            const y = 10 + gate.qubit * cellHeight + cellHeight / 2
                            const w = gate.gate === 'M' ? 28 : 36
                            const h = 26

                            return (
                                <g key={`${stepIdx}-${gateIdx}`}>
                                    <rect
                                        x={x - w / 2}
                                        y={y - h / 2}
                                        width={w}
                                        height={h}
                                        rx={4}
                                        fill={colors.bg}
                                        stroke={colors.border}
                                        strokeWidth="1.2"
                                    />
                                    <text
                                        x={x}
                                        y={y + 4}
                                        textAnchor="middle"
                                        fontSize={gate.gate === 'M' ? '11' : '10'}
                                        fontWeight="700"
                                        fill={colors.text}
                                        fontFamily="'JetBrains Mono', monospace"
                                    >
                                        {gate.gate}
                                    </text>
                                    {gate.param !== undefined && (
                                        <text
                                            x={x}
                                            y={y + h / 2 + 12}
                                            textAnchor="middle"
                                            fontSize="8"
                                            fill="#94A3B8"
                                            fontFamily="'JetBrains Mono', monospace"
                                        >
                                            {formatParam(gate.param)}
                                        </text>
                                    )}
                                </g>
                            )
                        })
                    )}
                </svg>
            </div>
            <div className="qi-circuit-legend">
                <span><span className="qi-legend-dot" style={{ background: '#1565C0' }}></span> Rotation / CNOT</span>
                <span><span className="qi-legend-dot" style={{ background: '#7C3AED' }}></span> Hadamard</span>
                <span><span className="qi-legend-dot" style={{ background: '#EC4899' }}></span> Measurement</span>
                <span><span className="qi-legend-dot" style={{ background: '#D97706' }}></span> RZ Phase</span>
            </div>
        </div>
    )
}
