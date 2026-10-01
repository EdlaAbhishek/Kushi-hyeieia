import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
    ArrowRight, ArrowLeft, Check, Play, Upload, RotateCcw,
    FileText, Sliders, Cpu, Eye, Clock, ShieldAlert, CheckCircle2,
    Database, Layers, Hash, Sparkles, AlertTriangle, Stethoscope,
    Activity, Info, Terminal, Copy
} from 'lucide-react'
import QuantumCircuitViz from './QuantumCircuitViz'

function FormattedAiMarkdown({ text }) {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let currentList = [];

    const flushList = () => {
        if (currentList.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="qi-ai-list">
                    {currentList.map((item, idx) => (
                        <li key={idx} className="qi-ai-li" dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                </ul>
            );
            currentList = [];
        }
    };

    const formatInline = (str) => {
        return str
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background:#F1F5F9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.86em;color:#0F172A">$1</code>');
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            flushList();
            continue;
        }

        if (line.startsWith('---')) {
            flushList();
            elements.push(<hr key={`hr-${i}`} className="qi-ai-divider" />);
        } else if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('#### ')) {
            flushList();
            const headingText = line.replace(/^#+\s*/, '');
            elements.push(
                <h3 key={`h-${i}`} className="qi-ai-h3" dangerouslySetInnerHTML={{ __html: formatInline(headingText) }} />
            );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            const liText = line.substring(2);
            currentList.push(formatInline(liText));
        } else if (/^\d+\.\s+/.test(line)) {
            flushList();
            elements.push(
                <h3 key={`h-num-${i}`} className="qi-ai-h3" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
            );
        } else {
            flushList();
            elements.push(
                <p key={`p-${i}`} className="qi-ai-p" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
            );
        }
    }

    flushList();

    return <div className="qi-ai-content">{elements}</div>;
}

export default function QuantumIntelligence() {
    // Navigation & Scroll refs
    const workspaceRef = useRef(null)
    const experimentsRef = useRef(null)
    const resultsRef = useRef(null)
    const fileInputRef = useRef(null)

    // Top-Level Mode: 'experiment' (Research Experiment Pipeline) vs 'prediction' (Clinical Decision-Support Mode)
    const [activeMode, setActiveMode] = useState('experiment')

    // Verified Datasets state (fetched from backend registry)
    const [datasetRegistry, setDatasetRegistry] = useState([])
    const [datasetKey, setDatasetKey] = useState('breast_cancer')
    const [customDataset, setCustomDataset] = useState(null)
    const [validationResult, setValidationResult] = useState(null)
    const [isValidatingCsv, setIsValidatingCsv] = useState(false)

    // Workflow step: 1 (Dataset), 2 (Preprocess), 3 (Models), 4 (Quantum Config)
    const [currentStep, setCurrentStep] = useState(1)

    // Preprocessing options
    const [scaler, setScaler] = useState('standard')
    const [missingValues, setMissingValues] = useState('median')
    const [pcaComponents, setPcaComponents] = useState('4')
    const [featureCount, setFeatureCount] = useState('4')

    // Model options
    const [classicalModel, setClassicalModel] = useState('svm')
    const [quantumModel, setQuantumModel] = useState('qsvm')

    // Quantum circuit options
    const [featureMap, setFeatureMap] = useState('zz')
    const [circuitDepth, setCircuitDepth] = useState('2')
    const [shots, setShots] = useState('1024')
    const [randomSeed, setRandomSeed] = useState(42)

    // Execution state
    const [isRunning, setIsRunning] = useState(false)
    const [currentRunStage, setCurrentRunStage] = useState('')
    const [error, setError] = useState(null)
    const [results, setResults] = useState(null)
    const [showAsciiCircuit, setShowAsciiCircuit] = useState(false)

    // Kushi AI Explanation state
    const [aiExplanation, setAiExplanation] = useState(null)
    const [isGeneratingAiExplanation, setIsGeneratingAiExplanation] = useState(false)
    const [aiQuestion, setAiQuestion] = useState('')

    // Experiment History
    const [history, setHistory] = useState([])

    // Prediction Mode state
    const [predictDatasetKey, setPredictDatasetKey] = useState('diabetes')
    const [patientInputs, setPatientInputs] = useState({})
    const [predictionResult, setPredictionResult] = useState(null)
    const [isPredicting, setIsPredicting] = useState(false)
    const [predictionError, setPredictionError] = useState(null)

    // Load dataset registry and experiment history from backend on mount
    const fetchDatasetsAndHistory = useCallback(async () => {
        try {
            const [dsRes, histRes] = await Promise.all([
                fetch('/api/quantum-pipeline?action=get_datasets').then(r => r.json()),
                fetch('/api/quantum-pipeline?action=history').then(r => r.json())
            ])

            if (dsRes?.datasets) {
                setDatasetRegistry(dsRes.datasets)
                if (dsRes.datasets.length > 0 && !datasetKey) {
                    setDatasetKey(dsRes.datasets[0].id)
                }
            }

            if (histRes?.history) {
                setHistory(histRes.history)
            }
        } catch (err) {
            console.warn('Initial quantum data fetch failed:', err)
        }
    }, [datasetKey])

    useEffect(() => {
        fetchDatasetsAndHistory()
    }, [fetchDatasetsAndHistory])

    // Currently active dataset metadata from registry
    const currentDatasetMeta = useMemo(() => {
        if (customDataset) {
            return {
                id: 'custom',
                name: customDataset.name,
                source: 'User Uploaded CSV',
                task: 'Binary Healthcare Classification',
                total_samples: customDataset.rowsCount,
                features_count: customDataset.features.length,
                target_column: customDataset.targetColumn,
                license: 'User Provided',
                features: customDataset.features
            }
        }
        return datasetRegistry.find(d => d.id === datasetKey) || datasetRegistry[0] || {
            id: 'breast_cancer',
            name: 'Breast Cancer Wisconsin (Diagnostic)',
            source: 'scikit-learn / UCI Machine Learning Repository',
            task: 'Benign vs Malignant Classification',
            total_samples: 569,
            features_count: 30,
            target_column: 'target',
            license: 'Public Domain / Creative Commons',
            features: []
        }
    }, [datasetRegistry, datasetKey, customDataset])

    // Initialize prediction inputs when predict dataset changes
    useEffect(() => {
        const ds = datasetRegistry.find(d => d.id === predictDatasetKey)
        if (ds && ds.feature_definitions) {
            const defaults = {}
            ds.feature_definitions.forEach(f => {
                defaults[f.name] = f.normal_range ? ((f.normal_range[0] + f.normal_range[1]) / 2).toFixed(1) : '0'
            })
            setPatientInputs(defaults)
            setPredictionResult(null)
            setPredictionError(null)
        }
    }, [predictDatasetKey, datasetRegistry])

    // Load clinically typical examples for prediction mode
    const loadClinicalExample = (type = 'elevated') => {
        if (predictDatasetKey === 'diabetes') {
            if (type === 'elevated') {
                setPatientInputs({
                    Pregnancies: '4',
                    Glucose: '158',
                    BloodPressure: '82',
                    SkinThickness: '32',
                    Insulin: '175',
                    BMI: '35.4',
                    DiabetesPedigreeFunction: '0.68',
                    Age: '48'
                })
            } else {
                setPatientInputs({
                    Pregnancies: '1',
                    Glucose: '92',
                    BloodPressure: '68',
                    SkinThickness: '18',
                    Insulin: '75',
                    BMI: '22.8',
                    DiabetesPedigreeFunction: '0.24',
                    Age: '26'
                })
            }
        } else if (predictDatasetKey === 'breast_cancer') {
            if (type === 'elevated') {
                const sample = {}
                const ds = datasetRegistry.find(d => d.id === 'breast_cancer')
                ds?.feature_definitions?.forEach(f => {
                    sample[f.name] = (f.normal_range ? f.normal_range[1] * 1.15 : 20.0).toFixed(2)
                })
                setPatientInputs(sample)
            } else {
                const sample = {}
                const ds = datasetRegistry.find(d => d.id === 'breast_cancer')
                ds?.feature_definitions?.forEach(f => {
                    sample[f.name] = (f.normal_range ? (f.normal_range[0] + f.normal_range[1]) / 2 : 12.0).toFixed(2)
                })
                setPatientInputs(sample)
            }
        } else if (predictDatasetKey === 'heart_disease') {
            if (type === 'elevated') {
                setPatientInputs({
                    age: '62', sex: '1', cp: '3', trestbps: '145', chol: '280',
                    fbs: '1', restecg: '1', thalach: '125', exang: '1', oldpeak: '2.6',
                    slope: '2', ca: '2', thal: '3'
                })
            } else {
                setPatientInputs({
                    age: '45', sex: '0', cp: '1', trestbps: '118', chol: '195',
                    fbs: '0', restecg: '0', thalach: '168', exang: '0', oldpeak: '0.2',
                    slope: '1', ca: '0', thal: '2'
                })
            }
        } else if (predictDatasetKey === 'parkinsons') {
            if (type === 'elevated') {
                setPatientInputs({
                    'MDVP:Fo(Hz)': '119.99', 'MDVP:Fhi(Hz)': '157.30', 'MDVP:Flo(Hz)': '74.99',
                    'MDVP:Jitter(%)': '0.0078', 'MDVP:Jitter(Abs)': '0.00007', 'MDVP:RAP': '0.0037',
                    'MDVP:PPQ': '0.0055', 'Jitter:DDP': '0.011', 'MDVP:Shimmer': '0.043',
                    'MDVP:Shimmer(dB)': '0.426', 'Shimmer:APQ3': '0.021', 'Shimmer:APQ5': '0.031',
                    'MDVP:APQ': '0.029', 'Shimmer:DDA': '0.065', 'NHR': '0.022', 'HNR': '21.03',
                    'RPDE': '0.414', 'DFA': '0.815', 'spread1': '-4.81', 'spread2': '0.266',
                    'D2': '2.30', 'PPE': '0.284'
                })
            } else {
                setPatientInputs({
                    'MDVP:Fo(Hz)': '197.07', 'MDVP:Fhi(Hz)': '206.89', 'MDVP:Flo(Hz)': '192.05',
                    'MDVP:Jitter(%)': '0.0028', 'MDVP:Jitter(Abs)': '0.00001', 'MDVP:RAP': '0.0011',
                    'MDVP:PPQ': '0.0015', 'Jitter:DDP': '0.0035', 'MDVP:Shimmer': '0.012',
                    'MDVP:Shimmer(dB)': '0.12', 'Shimmer:APQ3': '0.006', 'Shimmer:APQ5': '0.008',
                    'MDVP:APQ': '0.010', 'Shimmer:DDA': '0.018', 'NHR': '0.005', 'HNR': '26.77',
                    'RPDE': '0.312', 'DFA': '0.655', 'spread1': '-6.85', 'spread2': '0.145',
                    'D2': '1.82', 'PPE': '0.112'
                })
            }
        }
        setPredictionResult(null)
        setPredictionError(null)
    }

    // CSV File upload & Validation
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsValidatingCsv(true)
        setError(null)
        setValidationResult(null)

        try {
            const text = await file.text()
            const valRes = await fetch('/api/quantum-pipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'validate_csv',
                    csv_content: text
                })
            }).then(r => r.json())

            if (valRes.is_valid) {
                setCustomDataset({
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    content: text,
                    rowsCount: valRes.stats?.row_count,
                    features: valRes.stats?.numerical_columns || [],
                    targetColumn: valRes.stats?.target_column,
                    stats: valRes.stats
                })
                setValidationResult(null)
            } else {
                setCustomDataset(null)
                setValidationResult({
                    fileName: file.name,
                    errors: valRes.errors || ['Invalid healthcare dataset format.'],
                    warnings: valRes.warnings || []
                })
            }
        } catch (err) {
            setError(`Validation error: ${err.message}`)
        } finally {
            setIsValidatingCsv(false)
        }
    }

    // Run Real Training Analysis Pipeline
    const handleRunAnalysis = async () => {
        setIsRunning(true)
        setError(null)
        setCurrentRunStage('Validating biomedical schema & splitting partitions')

        try {
            const stages = [
                'Validating biomedical schema & splitting partitions',
                'Fitting transformers strictly on train split (Zero data leakage)',
                'Training classical baseline model',
                'Encoding quantum feature states on Qiskit Aer',
                'Executing quantum circuit & evaluating holdout metrics'
            ]

            let stageIdx = 0
            const stageTimer = setInterval(() => {
                stageIdx = (stageIdx + 1) % stages.length
                setCurrentRunStage(stages[stageIdx])
            }, 3000)

            const payload = {
                action: 'train',
                dataset_id: customDataset ? undefined : datasetKey,
                custom_csv_content: customDataset ? customDataset.content : undefined,
                target_column: customDataset ? customDataset.targetColumn : undefined,
                classical_model: classicalModel,
                quantum_model: quantumModel,
                num_qubits: Number(featureCount),
                dim_reduction: pcaComponents !== '0' ? 'pca' : 'none',
                scaling: scaler,
                feature_map: featureMap,
                circuit_depth: Number(circuitDepth),
                shots: Number(shots),
                random_seed: Number(randomSeed)
            }

            const response = await fetch('/api/quantum-pipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(r => r.json())

            clearInterval(stageTimer)

            if (response.status === 'success' || response.experiment_id) {
                setResults(response)
                setShowAsciiCircuit(false)
                setAiExplanation(null)
                fetchDatasetsAndHistory()
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
                }, 200)
            } else {
                setError(response.error || 'Experiment execution failed on backend simulator.')
            }
        } catch (err) {
            setError(`Pipeline execution error: ${err.message}`)
        } finally {
            setIsRunning(false)
            setCurrentRunStage('')
        }
    }

    // Run Patient Risk Prediction
    const handlePredictPatient = async () => {
        setIsPredicting(true)
        setPredictionError(null)

        try {
            const res = await fetch('/api/quantum-pipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'predict',
                    dataset_id: predictDatasetKey,
                    patient_features: patientInputs,
                    model_type: 'random_forest'
                })
            }).then(r => r.json())

            if (res.status === 'success') {
                setPredictionResult(res)
            } else {
                setPredictionError(res.error || 'Clinical prediction could not be computed.')
            }
        } catch (err) {
            setPredictionError(err.message)
        } finally {
            setIsPredicting(false)
        }
    }

    // Explain with Kushi AI
    const handleExplainWithKushiAi = async (customPrompt = null) => {
        if (!results) return
        setIsGeneratingAiExplanation(true)
        const q = customPrompt || aiQuestion.trim() || undefined

        try {
            const res = await fetch('/api/quantum-pipeline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'explain_ai',
                    experiment: results,
                    user_question: q
                })
            }).then(r => r.json())

            if (res.explanation) {
                setAiExplanation(res.explanation)
            }
        } catch (err) {
            console.warn('AI Explanation error:', err)
        } finally {
            setIsGeneratingAiExplanation(false)
            if (customPrompt) setAiQuestion('')
        }
    }

    // Formatters
    const formatPercent = (val) => {
        if (val === null || val === undefined || isNaN(val)) return '—'
        return `${(val * 100).toFixed(1)}%`
    }

    const formatMs = (ms) => {
        if (!ms) return '—'
        return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`
    }

    // Load saved experiment report from history
    const handleViewSavedExperiment = async (expId) => {
        try {
            const res = await fetch(`/api/quantum-pipeline?action=get_experiment&experiment_id=${expId}`).then(r => r.json())
            if (res.experiment) {
                setResults(res.experiment)
                setActiveMode('experiment')
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth' })
                }, 150)
            }
        } catch (err) {
            console.warn('Failed to load experiment:', err)
        }
    }

    return (
        <div className="qi-page">
            {/* 1. HERO SECTION */}
            <section className="qi-hero-minimal">
                <div className="qi-container">
                    <div className="qi-hero-header">
                        <div className="qi-backend-notice" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
                            <span className="qi-backend-label">Execution Backend</span>
                            <span className="qi-backend-val">Qiskit Aer Simulator (Local Statevector)</span>
                        </div>
                        <h1 className="qi-title">Quantum Disease Intelligence</h1>
                        <p className="qi-subtitle">
                            A reproducible healthcare machine learning and quantum computing pipeline for clinical risk assessment.
                        </p>
                        <p className="qi-supporting">
                            Strict schema validation &bull; Leakage-free preprocessing &bull; Genuine classical vs quantum benchmarking on Qiskit Aer &bull; Grounded explainability
                        </p>

                        <div className="qi-hero-actions">
                            <button
                                className="qi-btn-primary"
                                onClick={() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Open Workspace
                            </button>
                            <button
                                className="qi-btn-secondary"
                                onClick={() => experimentsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Experiment History ({history.length})
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* MODE SWITCHER */}
            <div className="qi-container">
                <div className="qi-mode-bar">
                    <div className="qi-mode-pills" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeMode === 'experiment'}
                            className={`qi-mode-btn ${activeMode === 'experiment' ? 'active' : ''}`}
                            onClick={() => setActiveMode('experiment')}
                        >
                            <Sliders size={15} /> Research Experiment Mode
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeMode === 'prediction'}
                            className={`qi-mode-btn ${activeMode === 'prediction' ? 'active' : ''}`}
                            onClick={() => setActiveMode('prediction')}
                        >
                            <Stethoscope size={15} /> Patient Decision-Support Mode
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MODE: RESEARCH EXPERIMENT WORKFLOW */}
            {activeMode === 'experiment' && (
                <section className="qi-workflow-section" ref={workspaceRef}>
                    <div className="qi-container">
                        {/* Step Navigator */}
                        <nav className="qi-workflow-nav" aria-label="Experiment Workflow">
                            {[
                                { id: 1, label: 'Verified Dataset', detail: currentDatasetMeta.name },
                                { id: 2, label: 'Preprocessing', detail: scaler === 'standard' ? 'StandardScaler' : 'MinMaxScaler' },
                                { id: 3, label: 'Model Baseline', detail: `${classicalModel.toUpperCase()} vs ${quantumModel.toUpperCase()}` },
                                { id: 4, label: 'Quantum Circuit', detail: `${featureMap.toUpperCase()} (${shots} shots)` }
                            ].map((s, idx) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`qi-step-item ${currentStep === s.id ? 'active' : ''} ${currentStep > s.id ? 'completed' : ''}`}
                                    onClick={() => setCurrentStep(s.id)}
                                >
                                    <div className="qi-step-num">
                                        {currentStep > s.id ? <Check size={13} strokeWidth={2.5} /> : s.id}
                                    </div>
                                    <div className="qi-step-text">
                                        <span className="qi-step-name">{s.label}</span>
                                        <span className="qi-step-detail" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {s.detail}
                                        </span>
                                    </div>
                                    {idx < 3 && <span className="qi-step-divider">→</span>}
                                </button>
                            ))}
                        </nav>

                        {/* STEP 1: VERIFIED DATASET SELECTION */}
                        <div className="qi-workspace-card">
                            {currentStep === 1 && (
                                <div className="qi-pane">
                                    <div className="qi-pane-header">
                                        <h2>Select Verified Healthcare Dataset</h2>
                                        <p>Every dataset has a documented clinical schema, known features, and reproducible baseline workflow.</p>
                                    </div>

                                    {/* Dataset Cards */}
                                    <div className="qi-dataset-options">
                                        {[
                                            { key: 'breast_cancer', name: 'Breast Cancer Wisconsin', desc: 'Cellular biopsy geometric nuclei measurements', samples: '569', features: '30' },
                                            { key: 'diabetes', name: 'Pima Indians Diabetes', desc: 'Metabolic & diagnostic glucose/insulin risk markers', samples: '768', features: '8' },
                                            { key: 'heart_disease', name: 'Cleveland Heart Disease', desc: 'Cardiovascular arterial and electrocardiographic indicators', samples: '303', features: '13' },
                                            { key: 'parkinsons', name: "Oxford Parkinson's Disease", desc: 'Biomedical acoustic phonation measurements for neurodegeneration', samples: '195', features: '22' }
                                        ].map(ds => (
                                            <button
                                                key={ds.key}
                                                type="button"
                                                className={`qi-dataset-choice ${datasetKey === ds.key && !customDataset ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setDatasetKey(ds.key)
                                                    setCustomDataset(null)
                                                    setValidationResult(null)
                                                }}
                                            >
                                                <div className="qi-choice-radio">
                                                    <div className="qi-radio-inner" />
                                                </div>
                                                <div className="qi-choice-text">
                                                    <strong>{ds.name}</strong>
                                                    <span>{ds.desc}</span>
                                                    <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.2rem' }}>
                                                        {ds.samples} samples &bull; {ds.features} features
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Dataset Metadata Details */}
                                    <div className="qi-dataset-meta-grid">
                                        <div className="qi-meta-cell">
                                            <span className="qi-meta-cell-label">Dataset Name</span>
                                            <span className="qi-meta-cell-value">{currentDatasetMeta.name}</span>
                                        </div>
                                        <div className="qi-meta-cell">
                                            <span className="qi-meta-cell-label">Source & Reference</span>
                                            <span className="qi-meta-cell-value">{currentDatasetMeta.source}</span>
                                        </div>
                                        <div className="qi-meta-cell">
                                            <span className="qi-meta-cell-label">Clinical Task</span>
                                            <span className="qi-meta-cell-value">{currentDatasetMeta.task}</span>
                                        </div>
                                        <div className="qi-meta-cell">
                                            <span className="qi-meta-cell-label">Observations & Dimensions</span>
                                            <span className="qi-meta-cell-value">{currentDatasetMeta.total_samples} samples &bull; {currentDatasetMeta.features_count} features</span>
                                        </div>
                                    </div>

                                    {currentDatasetMeta.license && (
                                        <div className="qi-dataset-citation">
                                            <strong>Citation & Attribution:</strong> {currentDatasetMeta.source} ({currentDatasetMeta.license}). Used strictly for research benchmarking.
                                        </div>
                                    )}

                                    {/* Custom CSV Upload & Validation */}
                                    <div className="qi-upload-box" style={{ marginTop: '1.5rem' }}>
                                        <input
                                            type="file"
                                            accept=".csv"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleFileUpload}
                                        />
                                        <button
                                            type="button"
                                            className="qi-upload-btn"
                                            disabled={isValidatingCsv}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload size={15} />
                                            <span>{isValidatingCsv ? 'Validating schema...' : customDataset ? `Loaded: ${customDataset.name}.csv` : 'Upload Custom CSV'}</span>
                                        </button>
                                        {customDataset && (
                                            <button
                                                type="button"
                                                className="qi-reset-btn"
                                                onClick={() => {
                                                    setCustomDataset(null)
                                                    setValidationResult(null)
                                                }}
                                            >
                                                Reset to Verified Datasets
                                            </button>
                                        )}
                                    </div>

                                    {/* CSV Validation Failure Notice */}
                                    {validationResult && (
                                        <div className="qi-validation-card" role="alert">
                                            <div className="qi-validation-title">
                                                <AlertTriangle size={17} />
                                                <span>Cannot Run Analysis on Uploaded CSV ({validationResult.fileName})</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#991B1B' }}>
                                                Healthcare datasets must meet clinical validity constraints before quantum encoding:
                                            </p>
                                            <ul className="qi-validation-list">
                                                {validationResult.errors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="qi-pane-actions">
                                        <div />
                                        <button
                                            type="button"
                                            className="qi-btn-primary"
                                            onClick={() => setCurrentStep(2)}
                                        >
                                            Continue <ArrowRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: PREPROCESSING (ZERO LEAKAGE) */}
                            {currentStep === 2 && (
                                <div className="qi-pane">
                                    <div className="qi-pane-header">
                                        <h2>Domain-Specific Preprocessing</h2>
                                        <p>Configure feature transformation and dimensionality reduction. All learned transformers are fitted exclusively on the training split to guarantee zero data leakage.</p>
                                    </div>

                                    <div className="qi-form-grid">
                                        <div className="qi-form-group">
                                            <label className="qi-form-label">Feature Scaling</label>
                                            <p className="qi-form-subtext">Normalize feature ranges for classical and quantum feature maps.</p>
                                            <select
                                                className="qi-select"
                                                value={scaler}
                                                onChange={e => setScaler(e.target.value)}
                                            >
                                                <option value="standard">StandardScaler (Zero mean, unit variance)</option>
                                                <option value="minmax">MinMaxScaler [0, 1] (Optimal for rotation angles)</option>
                                            </select>
                                        </div>

                                        <div className="qi-form-group">
                                            <label className="qi-form-label">Missing Value Imputation</label>
                                            <p className="qi-form-subtext">Domain strategy fitted only on train partition.</p>
                                            <select
                                                className="qi-select"
                                                value={missingValues}
                                                onChange={e => setMissingValues(e.target.value)}
                                            >
                                                <option value="median">Median Imputation (Robust to clinical outliers)</option>
                                                <option value="mean">Mean Imputation</option>
                                            </select>
                                        </div>

                                        <div className="qi-form-group">
                                            <label className="qi-form-label">Dimensionality Reduction (PCA)</label>
                                            <p className="qi-form-subtext">Map high-dimensional medical features to qubit registers.</p>
                                            <select
                                                className="qi-select"
                                                value={pcaComponents}
                                                onChange={e => {
                                                    setPcaComponents(e.target.value)
                                                    if (e.target.value !== '0') setFeatureCount(e.target.value)
                                                }}
                                            >
                                                <option value="4">4 Principal Components (4 Qubits)</option>
                                                <option value="6">6 Principal Components (6 Qubits)</option>
                                                <option value="0">Disabled (Preserve raw clinical features)</option>
                                            </select>
                                        </div>

                                        <div className="qi-form-group">
                                            <label className="qi-form-label">Target Qubit Register Count</label>
                                            <p className="qi-form-subtext">Simulated Hilbert space dimensions: {Math.pow(2, Number(featureCount))}.</p>
                                            <select
                                                className="qi-select"
                                                value={featureCount}
                                                onChange={e => setFeatureCount(e.target.value)}
                                            >
                                                <option value="4">4 Qubits (16 Hilbert space dimensions)</option>
                                                <option value="6">6 Qubits (64 Hilbert space dimensions)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="qi-dataset-citation" style={{ marginTop: '1rem' }}>
                                        <ShieldAlert size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                        <strong>Data Leakage Prevention:</strong> Imputer, Scaler, and PCA matrices are fitted <em>strictly</em> on the training partition (`X_train`) and applied downstream to `X_test`. No evaluation data leaks into model training.
                                    </div>

                                    <div className="qi-pane-actions">
                                        <button
                                            type="button"
                                            className="qi-btn-text"
                                            onClick={() => setCurrentStep(1)}
                                        >
                                            <ArrowLeft size={15} /> Back
                                        </button>
                                        <button
                                            type="button"
                                            className="qi-btn-primary"
                                            onClick={() => setCurrentStep(3)}
                                        >
                                            Continue <ArrowRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: MODEL BENCHMARK SELECTION */}
                            {currentStep === 3 && (
                                <div className="qi-pane">
                                    <div className="qi-pane-header">
                                        <h2>Model Benchmark Architecture</h2>
                                        <p>Select both a classical baseline and a genuine quantum classifier to train and evaluate side-by-side on identical holdout samples.</p>
                                    </div>

                                    <div className="qi-model-columns">
                                        <div className="qi-model-box">
                                            <span className="qi-model-section-title">Classical Baseline</span>
                                            <div className="qi-model-radios">
                                                {[
                                                    { id: 'svm', name: 'Support Vector Machine (SVC)', desc: 'RBF kernel margin classification in Euclidean space' },
                                                    { id: 'random_forest', name: 'Random Forest', desc: 'Ensemble decision trees with bootstrap aggregation' },
                                                    { id: 'logistic_regression', name: 'Logistic Regression', desc: 'Standard clinical odds-ratio baseline' }
                                                ].map(m => (
                                                    <label key={m.id} className={`qi-model-radio-card ${classicalModel === m.id ? 'active' : ''}`}>
                                                        <input
                                                            type="radio"
                                                            name="classicalModel"
                                                            value={m.id}
                                                            checked={classicalModel === m.id}
                                                            onChange={() => setClassicalModel(m.id)}
                                                        />
                                                        <div>
                                                            <strong>{m.name}</strong>
                                                            <span>{m.desc}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="qi-model-box">
                                            <span className="qi-model-section-title">Quantum / Hybrid Model</span>
                                            <div className="qi-model-radios">
                                                {[
                                                    { id: 'qsvm', name: 'Quantum SVM (QSVC)', desc: 'Qiskit FidelityQuantumKernel statevector overlap in 2ⁿ Hilbert space' },
                                                    { id: 'vqc', name: 'Variational Quantum Classifier (VQC)', desc: 'Parameterized RealAmplitudes ansatz with COBYLA/SLSQP optimizer' }
                                                ].map(m => (
                                                    <label key={m.id} className={`qi-model-radio-card ${quantumModel === m.id ? 'active' : ''}`}>
                                                        <input
                                                            type="radio"
                                                            name="quantumModel"
                                                            value={m.id}
                                                            checked={quantumModel === m.id}
                                                            onChange={() => setQuantumModel(m.id)}
                                                        />
                                                        <div>
                                                            <strong>{m.name}</strong>
                                                            <span>{m.desc}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="qi-backend-notice" style={{ marginTop: '1.25rem' }}>
                                        <span className="qi-backend-label">Execution Environment</span>
                                        <span className="qi-backend-val">Qiskit Aer (Local Statevector Simulator) &bull; No simulated fake metrics &bull; Real Qiskit circuits</span>
                                    </div>

                                    <div className="qi-pane-actions">
                                        <button
                                            type="button"
                                            className="qi-btn-text"
                                            onClick={() => setCurrentStep(2)}
                                        >
                                            <ArrowLeft size={15} /> Back
                                        </button>
                                        <button
                                            type="button"
                                            className="qi-btn-primary"
                                            onClick={() => setCurrentStep(4)}
                                        >
                                            Continue <ArrowRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: QUANTUM CIRCUIT CONFIG & EXECUTION */}
                            {currentStep === 4 && (
                                <div className="qi-pane">
                                    <div className="qi-pane-header">
                                        <h2>Quantum Circuit Configuration</h2>
                                        <p>Configure the genuine Qiskit circuit hyperparameters for state preparation and entanglement.</p>
                                    </div>

                                    <div className="qi-form-grid">
                                        <div className="qi-form-group">
                                            <label className="qi-form-label">Quantum Feature Map</label>
                                            <select
                                                className="qi-select"
                                                value={featureMap}
                                                onChange={e => setFeatureMap(e.target.value)}
                                            >
                                                <option value="zz">ZZFeatureMap (Second-order Pauli expansion with linear entanglement)</option>
                                                <option value="pauli">PauliFeatureMap (H + RX + RZ)</option>
                                            </select>
                                        </div>

                                        <div className="qi-form-group">
                                            <label className="qi-form-label">Circuit Depth / Repetitions</label>
                                            <select
                                                className="qi-select"
                                                value={circuitDepth}
                                                onChange={e => setCircuitDepth(e.target.value)}
                                            >
                                                <option value="1">1 Repetition (Shallow ansatz)</option>
                                                <option value="2">2 Repetitions (Standard entanglement)</option>
                                                <option value="3">3 Repetitions (Deep parameterized ansatz)</option>
                                            </select>
                                        </div>

                                        <div className="qi-form-group">
                                            <label className="qi-form-label">Simulation Shots</label>
                                            <select
                                                className="qi-select"
                                                value={shots}
                                                onChange={e => setShots(e.target.value)}
                                            >
                                                <option value="512">512 Shots</option>
                                                <option value="1024">1024 Shots</option>
                                                <option value="2048">2048 Shots</option>
                                            </select>
                                        </div>

                                        <div className="qi-form-group">
                                            <label className="qi-form-label">Reproducible Random Seed</label>
                                            <input
                                                type="number"
                                                className="qi-input-field"
                                                value={randomSeed}
                                                onChange={e => setRandomSeed(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="qi-error-banner" role="alert">
                                            <ShieldAlert size={16} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Action Bar */}
                                    <div className="qi-run-banner">
                                        {isRunning ? (
                                            <div className="qi-running-state">
                                                <div className="qi-spinner" />
                                                <div className="qi-running-text">
                                                    <span className="qi-running-stage">{currentRunStage}</span>
                                                    <div className="qi-running-sequence">
                                                        <span>Validating</span> &rarr;
                                                        <span>Preprocessing</span> &rarr;
                                                        <span>Classical Baseline</span> &rarr;
                                                        <span>Qiskit Aer Execution</span> &rarr;
                                                        <span>Evaluation</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="qi-pane-actions" style={{ width: '100%', margin: 0 }}>
                                                <button
                                                    type="button"
                                                    className="qi-btn-text"
                                                    onClick={() => setCurrentStep(3)}
                                                >
                                                    <ArrowLeft size={15} /> Back
                                                </button>
                                                <button
                                                    type="button"
                                                    className="qi-btn-primary qi-btn-large"
                                                    onClick={handleRunAnalysis}
                                                >
                                                    <Play size={16} /> Run QML Pipeline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* 3. MODE: CLINICAL PREDICTION MODE */}
            {activeMode === 'prediction' && (
                <section className="qi-workflow-section" ref={workspaceRef}>
                    <div className="qi-container">
                        <div className="qi-workspace-card">
                            <div className="qi-pane">
                                <div className="qi-pane-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <Stethoscope size={20} color="#1565C0" />
                                        <h2>Patient Decision-Support & Clinical Risk Assessment</h2>
                                    </div>
                                    <p>Evaluate individual patient measurements against a validated, trained model pipeline. The input schema must strictly match the verified clinical dataset.</p>
                                </div>

                                {/* Model Target Selector */}
                                <div className="qi-form-group" style={{ maxWidth: '420px', marginBottom: '1.25rem' }}>
                                    <label className="qi-form-label">Disease Diagnostic Model</label>
                                    <select
                                        className="qi-select"
                                        value={predictDatasetKey}
                                        onChange={e => setPredictDatasetKey(e.target.value)}
                                    >
                                        <option value="diabetes">Pima Diabetes Risk Model</option>
                                        <option value="breast_cancer">Breast Cancer Biopsy Model</option>
                                        <option value="heart_disease">Cleveland Heart Disease Model</option>
                                        <option value="parkinsons">Parkinson's Phonetic Model</option>
                                    </select>
                                </div>

                                {/* Preset Clinical Examples */}
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="qi-view-btn"
                                        onClick={() => loadClinicalExample('elevated')}
                                    >
                                        <Activity size={14} color="#DC2626" /> Load Elevated-Risk Example
                                    </button>
                                    <button
                                        type="button"
                                        className="qi-view-btn"
                                        onClick={() => loadClinicalExample('low')}
                                    >
                                        <CheckCircle2 size={14} color="#16A34A" /> Load Low-Risk Example
                                    </button>
                                </div>

                                {/* Patient Input Form */}
                                <div className="qi-form-schema-grid">
                                    {Object.keys(patientInputs).map(feat => (
                                        <div key={feat} className="qi-schema-field">
                                            <div className="qi-schema-label-row">
                                                <span className="qi-schema-name">{feat}</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="any"
                                                className="qi-input-field"
                                                value={patientInputs[feat]}
                                                onChange={e => setPatientInputs({ ...patientInputs, [feat]: e.target.value })}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {predictionError && (
                                    <div className="qi-validation-card">
                                        <div className="qi-validation-title">
                                            <AlertTriangle size={16} />
                                            <span>Validation Error</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#991B1B' }}>{predictionError}</p>
                                    </div>
                                )}

                                {/* Prediction Output Banner */}
                                {predictionResult && (
                                    <div className={`qi-prediction-banner ${predictionResult.is_elevated_risk ? 'elevated' : 'low'}`}>
                                        <div className="qi-prediction-banner-header">
                                            <div>
                                                <span className={`qi-pred-badge ${predictionResult.is_elevated_risk ? 'elevated' : 'low'}`}>
                                                    {predictionResult.prediction_label}
                                                </span>
                                                <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.15rem' }}>
                                                    Calculated Outcome Probability: {(predictionResult.risk_probability * 100).toFixed(1)}%
                                                </h3>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748B' }}>
                                                <span>Model: <strong>{predictionResult.model_used}</strong></span>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0.5rem 0' }}>
                                            <strong>Key Cohort Deviations:</strong> Clinical measurements with significant variance from benchmark population median.
                                        </p>

                                        <div className="qi-deviations-grid">
                                            {(predictionResult.top_feature_deviations || []).map((dev, idx) => (
                                                <div key={idx} className="qi-dev-pill">
                                                    <span className="qi-dev-name">{dev.feature}</span>
                                                    <span className="qi-dev-val">{dev.patient_value} (med {dev.cohort_median})</span>
                                                    <span className={`qi-dev-tag ${dev.relative_impact}`}>
                                                        {dev.relative_impact === 'elevated' ? `+${dev.deviation} (High)` : dev.relative_impact === 'reduced' ? `${dev.deviation} (Low)` : 'Normal'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <ShieldAlert size={14} />
                                            <span>{predictionResult.disclaimer}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="qi-pane-actions" style={{ marginTop: '1.5rem' }}>
                                    <div />
                                    <button
                                        type="button"
                                        className="qi-btn-primary qi-btn-large"
                                        disabled={isPredicting}
                                        onClick={handlePredictPatient}
                                    >
                                        <Activity size={16} /> {isPredicting ? 'Evaluating Risk...' : 'Run Clinical Inference'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 4. REAL RESULTS SECTION */}
            {results && (
                <section className="qi-results-section" ref={resultsRef}>
                    <div className="qi-container">
                        <div className="qi-results-header">
                            <div>
                                <h2 className="qi-section-title">Analysis Results & Benchmark Comparison</h2>
                                <p className="qi-section-subtitle">
                                    Direct evaluation of classical and quantum model performance on identical holdout samples. No fabricated metrics.
                                </p>
                            </div>
                            <div className="qi-medical-disclaimer">
                                <ShieldAlert size={14} />
                                <span>Research / decision-support result. Not a medical diagnosis.</span>
                            </div>
                        </div>

                        {/* Top Metrics Cards */}
                        <div className="qi-results-metrics-grid">
                            <div className="qi-metric-card">
                                <span className="qi-metric-label">Classical Baseline Accuracy</span>
                                <span className="qi-metric-value-strong">
                                    {formatPercent(results.classical_evaluation?.metrics?.accuracy)}
                                </span>
                                <span className="qi-metric-sub">{results.classical_evaluation?.model_name}</span>
                            </div>

                            <div className="qi-metric-card">
                                <span className="qi-metric-label">Quantum / Hybrid Accuracy</span>
                                <span className="qi-metric-value-strong">
                                    {formatPercent(results.quantum_evaluation?.metrics?.accuracy)}
                                </span>
                                <span className="qi-metric-sub">{results.quantum_evaluation?.model_name}</span>
                            </div>

                            <div className="qi-metric-card">
                                <span className="qi-metric-label">Evaluation Holdout Split</span>
                                <span className="qi-metric-value-strong">
                                    {results.dataset_info?.test_samples} Samples
                                </span>
                                <span className="qi-metric-sub">Stratified Holdout</span>
                            </div>

                            <div className="qi-metric-card">
                                <span className="qi-metric-label">Execution Time</span>
                                <span className="qi-metric-value-strong">
                                    {formatMs(results.quantum_evaluation?.metrics?.training_time_ms)}
                                </span>
                                <span className="qi-metric-sub">Classical: {formatMs(results.classical_evaluation?.metrics?.training_time_ms)}</span>
                            </div>

                            <div className="qi-metric-card">
                                <span className="qi-metric-label">Qiskit Aer Backend</span>
                                <span className="qi-metric-value-strong" style={{ fontSize: '0.95rem' }}>
                                    {results.quantum_evaluation?.qubits || 4} Qubits
                                </span>
                                <span className="qi-metric-sub">{results.quantum_evaluation?.feature_map || 'ZZFeatureMap'}</span>
                            </div>
                        </div>

                        {/* Model Comparison Table */}
                        <div className="qi-table-card" style={{ marginBottom: '2rem' }}>
                            <h3 className="qi-table-title">Performance Benchmark (Classical vs Quantum)</h3>
                            <div className="qi-table-responsive">
                                <table className="qi-table">
                                    <thead>
                                        <tr>
                                            <th>Evaluation Metric</th>
                                            <th className="qi-th-num">Classical ({results.classical_evaluation?.model_name})</th>
                                            <th className="qi-th-num">Quantum ({results.quantum_evaluation?.model_name})</th>
                                            <th className="qi-th-num">Empirical Comparison</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { label: 'Accuracy', cls: results.classical_evaluation?.metrics?.accuracy, qm: results.quantum_evaluation?.metrics?.accuracy },
                                            { label: 'Balanced Accuracy', cls: results.classical_evaluation?.metrics?.balanced_accuracy, qm: results.quantum_evaluation?.metrics?.balanced_accuracy },
                                            { label: 'Precision', cls: results.classical_evaluation?.metrics?.precision, qm: results.quantum_evaluation?.metrics?.precision },
                                            { label: 'Recall (Sensitivity)', cls: results.classical_evaluation?.metrics?.recall, qm: results.quantum_evaluation?.metrics?.recall },
                                            { label: 'Specificity', cls: results.classical_evaluation?.metrics?.specificity, qm: results.quantum_evaluation?.metrics?.specificity },
                                            { label: 'F1 Score', cls: results.classical_evaluation?.metrics?.f1_score, qm: results.quantum_evaluation?.metrics?.f1_score },
                                            { label: 'ROC-AUC', cls: results.classical_evaluation?.metrics?.roc_auc, qm: results.quantum_evaluation?.metrics?.roc_auc }
                                        ].map((row, i) => {
                                            const diff = row.qm !== undefined && row.cls !== undefined ? (row.qm - row.cls) : null
                                            return (
                                                <tr key={i}>
                                                    <td><strong>{row.label}</strong></td>
                                                    <td className="qi-td-num">{formatPercent(row.cls)}</td>
                                                    <td className="qi-td-num">{formatPercent(row.qm)}</td>
                                                    <td className="qi-td-num" style={{ color: diff !== null ? (diff > 0.01 ? '#15803D' : diff < -0.01 ? '#64748B' : '#0F172A') : '#94A3B8' }}>
                                                        {diff !== null ? (diff > 0 ? `+${(diff * 100).toFixed(1)}%` : `${(diff * 100).toFixed(1)}%`) : '—'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quantum Circuit Visualization */}
                        {results.quantum_evaluation?.circuit?.gates_sequence && (
                            <div className="qi-circuit-section-wrapper">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <h3 className="qi-table-title" style={{ margin: 0 }}>Quantum Circuit Execution</h3>
                                    <button
                                        type="button"
                                        className="qi-view-btn"
                                        onClick={() => setShowAsciiCircuit(!showAsciiCircuit)}
                                    >
                                        <Terminal size={13} /> {showAsciiCircuit ? 'Hide Qiskit Diagram' : 'View Raw Qiskit Diagram'}
                                    </button>
                                </div>

                                <div className="qi-circuit-card">
                                    <QuantumCircuitViz
                                        circuitLog={results.quantum_evaluation.circuit.gates_sequence}
                                        numQubits={results.quantum_evaluation.qubits || 4}
                                        featureMap={results.quantum_evaluation.feature_map || 'ZZFeatureMap'}
                                        circuitDepth={results.quantum_evaluation.circuit.depth || 2}
                                        entanglement="Linear CNOT Entanglement"
                                        measurements="Computational Basis Z"
                                    />
                                </div>

                                {showAsciiCircuit && results.quantum_evaluation?.circuit?.ascii_diagram && (
                                    <pre className="qi-ascii-circuit">
                                        {results.quantum_evaluation.circuit.ascii_diagram}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Explainability & Feature Contribution */}
                        <div className="qi-explainability-wrapper">
                            <h3 className="qi-table-title">Explainability & Feature Contribution</h3>
                            <div className="qi-explain-grid">
                                {/* Permutation Feature Importance */}
                                <div className="qi-explain-card">
                                    <span className="qi-explain-card-title">Permutation Feature Importance</span>
                                    <p className="qi-explain-desc">
                                        Empirical feature contribution measured on the holdout evaluation set.
                                    </p>
                                    <div className="qi-feature-bars">
                                        {(results.classical_evaluation?.feature_importance || []).slice(0, 6).map((item, idx) => (
                                            <div key={idx} className="qi-feature-bar-row">
                                                <div className="qi-feature-label-row">
                                                    <span className="qi-feature-name">{item.feature}</span>
                                                    <span className="qi-feature-pct">{formatPercent(item.normalized_importance || item.importance)}</span>
                                                </div>
                                                <div className="qi-bar-track">
                                                    <div
                                                        className="qi-bar-fill"
                                                        style={{ width: `${Math.min(100, Math.max(6, (item.normalized_importance || item.importance) * 100))}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Measurement Probabilities on Qiskit Aer */}
                                <div className="qi-explain-card">
                                    <span className="qi-explain-card-title">Quantum Basis State Measurements</span>
                                    <p className="qi-explain-desc">
                                        Distribution of computational basis state occurrences on Qiskit Aer ({results.quantum_evaluation?.shots || 1024} shots).
                                    </p>
                                    <div className="qi-measurement-table">
                                        {results.quantum_evaluation?.measurement_counts ? (
                                            Object.entries(results.quantum_evaluation.measurement_counts)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 5)
                                                .map(([bitStr, count]) => {
                                                    const frac = count / (results.quantum_evaluation.shots || 1024)
                                                    return (
                                                        <div key={bitStr} className="qi-state-row">
                                                            <span className="qi-state-ket">|{bitStr}⟩</span>
                                                            <div className="qi-state-bar-track">
                                                                <div className="qi-state-bar-fill" style={{ width: `${frac * 100}%` }} />
                                                            </div>
                                                            <span className="qi-state-prob">{formatPercent(frac)}</span>
                                                        </div>
                                                    )
                                                })
                                        ) : (
                                            <p className="qi-state-empty">Measurement states calculated deterministically from simulator statevector.</p>
                                        )}
                                    </div>

                                    <div className="qi-config-summary-sub">
                                        <div className="qi-config-item">
                                            <span>Experiment ID:</span> <strong>{results.experiment_id || results.id}</strong>
                                        </div>
                                        <div className="qi-config-item">
                                            <span>Seed:</span> <strong>{results.random_seed}</strong>
                                        </div>
                                        <div className="qi-config-item">
                                            <span>Backend:</span> <strong>Qiskit Aer Simulator</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Explain with Kushi AI Button & Panel */}
                        <div style={{ marginTop: '2rem' }}>
                            {!aiExplanation && (
                                <button
                                    type="button"
                                    className="qi-btn-primary"
                                    disabled={isGeneratingAiExplanation}
                                    onClick={() => handleExplainWithKushiAi()}
                                >
                                    <Sparkles size={16} /> {isGeneratingAiExplanation ? 'Synthesizing with Real Clinical AI...' : 'Explain with Kushi AI'}
                                </button>
                            )}

                            {aiExplanation && (
                                <div className="qi-ai-panel">
                                    <div className="qi-ai-panel-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <div className="qi-ai-panel-title">
                                                <Sparkles size={18} color="#1565C0" />
                                                <span>Kushi AI Clinical Research Synthesis</span>
                                            </div>
                                            <span className="qi-ai-panel-badge">Powered by DeepSeek AI</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="qi-btn-text"
                                            onClick={() => setAiExplanation(null)}
                                        >
                                            Dismiss
                                        </button>
                                    </div>

                                    {/* Real AI Formatted Markdown */}
                                    <FormattedAiMarkdown text={aiExplanation} />

                                    {/* Follow-up Interactive Questions */}
                                    <div className="qi-ai-prompts">
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', width: '100%', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Ask Kushi AI follow-up questions:
                                        </span>
                                        {[
                                            'Why did Classical SVM beat QSVC on this data?',
                                            'Explain the biological significance of the top features',
                                            'How did the quantum feature map encode the Hilbert space?',
                                            'What clinical validation steps are recommended next?'
                                        ].map((promptText, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className="qi-ai-prompt-chip"
                                                disabled={isGeneratingAiExplanation}
                                                onClick={() => handleExplainWithKushiAi(promptText)}
                                            >
                                                <Sparkles size={12} color="#2563EB" /> {promptText}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Question Bar */}
                                    <div className="qi-ai-input-row">
                                        <input
                                            type="text"
                                            className="qi-ai-input"
                                            placeholder="Ask Kushi AI any clinical or quantum question about this experiment..."
                                            value={aiQuestion}
                                            onChange={e => setAiQuestion(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && aiQuestion.trim()) {
                                                    handleExplainWithKushiAi()
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="qi-btn-primary"
                                            disabled={isGeneratingAiExplanation || !aiQuestion.trim()}
                                            onClick={() => handleExplainWithKushiAi()}
                                        >
                                            {isGeneratingAiExplanation ? 'Thinking...' : 'Ask AI'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* 5. EXPERIMENTS HISTORY SECTION */}
            <section className="qi-experiments-section" ref={experimentsRef}>
                <div className="qi-container">
                    <div className="qi-experiments-header">
                        <h2 className="qi-section-title">Research Experiment History</h2>
                        <p className="qi-section-subtitle">
                            Persistent registry of reproducible healthcare ML/QML experiments executed on Qiskit Aer.
                        </p>
                    </div>

                    <div className="qi-table-card">
                        {history.length === 0 ? (
                            <div className="qi-empty-history">
                                <p>No completed experiments recorded yet. Launch a pipeline analysis above to save a reproducible experiment.</p>
                            </div>
                        ) : (
                            <div className="qi-table-responsive">
                                <table className="qi-table">
                                    <thead>
                                        <tr>
                                            <th>Experiment ID</th>
                                            <th>Dataset</th>
                                            <th>Classical Model</th>
                                            <th>Quantum Model</th>
                                            <th>Qubits</th>
                                            <th className="qi-th-num">Classical Acc</th>
                                            <th className="qi-th-num">Quantum Acc</th>
                                            <th>Date</th>
                                            <th className="qi-th-action">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h, i) => (
                                            <tr key={h.id || i}>
                                                <td><strong style={{ fontFamily: 'JetBrains Mono', fontSize: '0.82rem' }}>{h.id}</strong></td>
                                                <td>{h.dataset_name}</td>
                                                <td>{h.classical_model}</td>
                                                <td>{h.quantum_model}</td>
                                                <td>{h.qubits} Qubits</td>
                                                <td className="qi-td-num">{formatPercent(h.classical_accuracy)}</td>
                                                <td className="qi-td-num">{formatPercent(h.quantum_accuracy)}</td>
                                                <td style={{ fontSize: '0.82rem', color: '#64748B' }}>{h.timestamp}</td>
                                                <td className="qi-td-action">
                                                    <button
                                                        type="button"
                                                        className="qi-view-btn"
                                                        onClick={() => handleViewSavedExperiment(h.id)}
                                                    >
                                                        <Eye size={13} /> View Report
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
