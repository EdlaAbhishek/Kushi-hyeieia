import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { callOpenRouter } from './openrouter-client.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

function runPythonCommand(args, timeoutMs = 180000) {
    return new Promise((resolve, reject) => {
        const proc = spawn('py', ['-3.11', 'python/run_qml_pipeline.py', ...args], {
            cwd: process.cwd(),
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        })

        let stdout = ''
        let stderr = ''

        proc.stdout.on('data', data => {
            stdout += data.toString('utf-8')
        })

        proc.stderr.on('data', data => {
            stderr += data.toString('utf-8')
        })

        const timer = setTimeout(() => {
            proc.kill()
            reject(new Error(`Python process timed out after ${timeoutMs / 1000}s`))
        }, timeoutMs)

        proc.on('close', code => {
            clearTimeout(timer)
            if (code !== 0 && !stdout.trim()) {
                reject(new Error(stderr || `Python process exited with code ${code}`))
                return
            }

            try {
                // Find first '{' or '[' in stdout in case of any warning prefix
                const jsonStart = stdout.indexOf('{')
                if (jsonStart === -1) {
                    throw new Error('No JSON object found in output: ' + stdout)
                }
                const jsonStr = stdout.slice(jsonStart)
                const parsed = JSON.parse(jsonStr)
                resolve(parsed)
            } catch (err) {
                console.error('[Quantum API] Failed to parse JSON from Python output:', stdout, stderr)
                reject(new Error(`Output parse error: ${err.message}. Raw: ${stdout.slice(0, 300)}`))
            }
        })

        proc.on('error', err => {
            clearTimeout(timer)
            reject(err)
        })
    })
}

export default async function handler(req, res) {
    const action = req.query.action || req.body?.action || 'get_datasets'

    try {
        if (action === 'get_datasets') {
            const result = await runPythonCommand(['get_datasets'])
            return res.status(200).json(result)
        }

        if (action === 'validate_csv') {
            const { csv_content, target_column } = req.body || {}
            if (!csv_content || typeof csv_content !== 'string') {
                return res.status(400).json({ is_valid: false, errors: ['csv_content string is required'] })
            }

            const tmpFile = path.join(os.tmpdir(), `qml_val_${Date.now()}_${Math.random().toString(36).substring(7)}.json`)
            fs.writeFileSync(tmpFile, JSON.stringify({ csv_text: csv_content, target_col: target_column }), 'utf-8')

            try {
                const result = await runPythonCommand(['validate_csv', `--file=${tmpFile}`])
                return res.status(200).json(result)
            } finally {
                try { fs.unlinkSync(tmpFile) } catch (_) {}
            }
        }

        if (action === 'train') {
            const config = req.body || {}
            if (!config.dataset_id && !config.custom_csv && !config.custom_csv_content) {
                return res.status(400).json({ error: 'dataset_id or custom_csv is required' })
            }

            if (config.custom_csv_content) {
                config.custom_csv = config.custom_csv_content
                delete config.custom_csv_content
            }

            const tmpConfigFile = path.join(os.tmpdir(), `qml_config_${Date.now()}_${Math.random().toString(36).substring(7)}.json`)
            fs.writeFileSync(tmpConfigFile, JSON.stringify(config, null, 2), 'utf-8')

            try {
                const result = await runPythonCommand(['train', `--file=${tmpConfigFile}`], 240000)
                return res.status(200).json(result)
            } finally {
                try { fs.unlinkSync(tmpConfigFile) } catch (_) {}
            }
        }

        if (action === 'predict') {
            const config = req.body || {}
            if (!config.dataset_id && !config.model_id) {
                return res.status(400).json({ error: 'dataset_id or model_id is required' })
            }

            const tmpConfigFile = path.join(os.tmpdir(), `qml_predict_${Date.now()}_${Math.random().toString(36).substring(7)}.json`)
            fs.writeFileSync(tmpConfigFile, JSON.stringify(config, null, 2), 'utf-8')

            try {
                const result = await runPythonCommand(['predict', `--file=${tmpConfigFile}`], 60000)
                return res.status(200).json(result)
            } finally {
                try { fs.unlinkSync(tmpConfigFile) } catch (_) {}
            }
        }

        if (action === 'history') {
            const result = await runPythonCommand(['history'])
            return res.status(200).json(result)
        }

        if (action === 'get_experiment') {
            const expId = req.query.experiment_id || req.body?.experiment_id || req.body?.exp_id
            if (!expId) {
                return res.status(400).json({ error: 'experiment_id is required' })
            }
            const tmpConfigFile = path.join(os.tmpdir(), `qml_exp_${Date.now()}_${Math.random().toString(36).substring(7)}.json`)
            fs.writeFileSync(tmpConfigFile, JSON.stringify({ exp_id: expId }, null, 2), 'utf-8')

            try {
                const result = await runPythonCommand(['get_experiment', `--file=${tmpConfigFile}`])
                return res.status(200).json(result)
            } finally {
                try { fs.unlinkSync(tmpConfigFile) } catch (_) {}
            }
        }

        if (action === 'explain_ai') {
            const { experiment, user_question, language = 'en' } = req.body || {}
            if (!experiment) {
                return res.status(400).json({ error: 'Experiment data is required for explanation.' })
            }

            const clsEval = experiment.classical_evaluation || experiment.classical || {}
            const qmEval = experiment.quantum_evaluation || experiment.quantum || {}
            const dsInfo = experiment.dataset_info || {}

            const clsName = clsEval.model_name || clsEval.model || 'Classical Model'
            const qmName = qmEval.model_name || qmEval.model || 'Quantum Model'

            const clsAcc = clsEval.metrics?.accuracy !== undefined ? (clsEval.metrics.accuracy * 100).toFixed(1) : 'N/A'
            const clsF1 = clsEval.metrics?.f1_score !== undefined ? (clsEval.metrics.f1_score * 100).toFixed(1) : (clsEval.metrics?.f1 ? (clsEval.metrics.f1 * 100).toFixed(1) : 'N/A')
            const clsAuc = clsEval.metrics?.roc_auc ? (clsEval.metrics.roc_auc * 100).toFixed(1) + '%' : 'N/A'

            const qmAcc = qmEval.metrics?.accuracy !== undefined ? (qmEval.metrics.accuracy * 100).toFixed(1) : 'N/A'
            const qmF1 = qmEval.metrics?.f1_score !== undefined ? (qmEval.metrics.f1_score * 100).toFixed(1) : (qmEval.metrics?.f1 ? (qmEval.metrics.f1 * 100).toFixed(1) : 'N/A')
            const qmAuc = qmEval.metrics?.roc_auc ? (qmEval.metrics.roc_auc * 100).toFixed(1) + '%' : 'N/A'

            const systemPrompt = `You are Kushi AI, an expert biomedical research assistant and clinical AI advisor for the Kushi-Hygieia healthcare platform.

COMMUNICATION & CLINICAL GUIDELINES:
- Write in clear, natural, highly articulate scientific prose that a practicing doctor, oncologist, or biomedical researcher will find genuinely insightful and easy to understand.
- NEVER use generic, repetitive robotic placeholder text.
- Ground all numbers, feature names, accuracies, and percentages strictly in the evaluated experiment.
- Explain the clinical and pathological significance of the specific medical features (e.g., nuclear pleomorphism for breast cancer; insulin resistance for diabetes; vascular occlusion for heart disease).
- Address why the classical model and quantum model performed the way they did on this dataset without false claims of quantum advantage.
- Conclude with a clear statement that this is research decision-support and not a medical diagnosis.`

            const promptText = `Please analyze and explain the following real experiment from the Kushi-Hygieia QML pipeline:

Dataset Evaluated: ${dsInfo.name || experiment.dataset_name || 'Biomedical Dataset'} (${dsInfo.test_samples || 'held-out'} test samples)

Empirical Model Performance:
- Classical Baseline (${clsName}):
  * Accuracy: ${clsAcc}%
  * F1 Score: ${clsF1}%
  * ROC-AUC: ${clsAuc}
  * Training Time: ${clsEval.metrics?.training_time_ms ? (clsEval.metrics.training_time_ms).toFixed(1) + ' ms' : 'N/A'}

- Quantum Classifier (${qmName}):
  * Accuracy: ${qmAcc}%
  * F1 Score: ${qmF1}%
  * ROC-AUC: ${qmAuc}
  * Simulator Backend: ${experiment.backend || qmEval.backend || 'Qiskit Aer Simulator (Local Statevector)'}
  * Circuit Architecture: ${qmEval.qubits || dsInfo.quantum_qubits || 4} Qubits with ${qmEval.feature_map || 'ZZFeatureMap'} (Depth: ${qmEval.circuit?.depth || 2}, Shots: ${qmEval.shots || 1024})
  * Training Time: ${qmEval.metrics?.training_time_ms ? (qmEval.metrics.training_time_ms).toFixed(1) + ' ms' : 'N/A'}

Top Biological Features by Permutation Importance on Held-out Data:
${(clsEval.feature_importance || []).slice(0, 5).map(f => `- ${f.feature}: ${(f.importance * 100).toFixed(1)}% empirical contribution`).join('\n')}

User Context / Question: ${user_question || 'Explain how the classical and quantum models performed, the clinical meaning of the top features, what the quantum circuit did, and how to interpret these findings in healthcare practice.'}

Please structure your response into clear, beautifully formatted sections:
1. **Clinical & Empirical Summary** (High-level takeaway of the findings)
2. **Classical vs. Quantum Performance Dynamics** (Why the classical baseline performed as it did relative to the quantum classifier on this structured dataset)
3. **Biological & Biomarker Interpretation** (What the top diagnostic features mean pathologically/physiologically)
4. **Quantum Encoding & Circuit Behavior** (How the ${qmEval.qubits || 4}-qubit ${qmEval.feature_map || 'ZZFeatureMap'} maps biomedical features into Hilbert space)
5. **Research & Decision-Support Takeaway** (Practical guidance, noting this is research support and not a diagnosis)`

            // Call OpenRouter
            const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY
            if (openRouterKey) {
                try {
                    const reply = await callOpenRouter({
                        model: 'deepseek/deepseek-chat',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: promptText }
                        ],
                        temperature: 0.4,
                        maxTokens: 1200
                    })
                    if (reply) {
                        return res.status(200).json({ explanation: reply })
                    }
                } catch (e) {
                    console.warn('[Quantum API] OpenRouter call failed:', e.message)
                }
            }

            const GEMINI_API_KEY = process.env.GEMINI_API_KEY
            if (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('AIzaSyC-whB7z9x')) {
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
                const model = genAI.getGenerativeModel({
                    model: 'gemini-1.5-flash',
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
                const result = await model.generateContent(promptText)
                return res.status(200).json({ explanation: result.response.text() })
            }

            // Fallback deterministic synthesis if no AI key configured
            const diff = (!isNaN(parseFloat(qmAcc)) && !isNaN(parseFloat(clsAcc)))
                ? (parseFloat(qmAcc) - parseFloat(clsAcc)).toFixed(1)
                : '0.0'
            const compText = parseFloat(diff) > 0
                ? `The quantum classifier achieved ${diff}% higher accuracy (${qmAcc}% vs ${clsAcc}%) on this hold-out test set.`
                : parseFloat(diff) < 0
                ? `The classical baseline achieved ${Math.abs(parseFloat(diff)).toFixed(1)}% higher accuracy (${clsAcc}% vs ${qmAcc}%), which is typical on small, structured clinical datasets.`
                : `Both classical and quantum models achieved comparable accuracy (${clsAcc}%) on this evaluation set.`

            return res.status(200).json({
                explanation: `### Objective Clinical & Quantum Synthesis\n\n**Research / decision-support result. This is NOT a medical diagnosis.**\n\n${compText}\n\n**Model Architecture:**\n- **Classical Baseline:** ${clsName} evaluated with stratified cross-validation on ${dsInfo.name || experiment.dataset_name}.\n- **Quantum Classifier:** ${qmName} executed on the **${experiment.backend || qmEval.backend || 'Qiskit Aer Simulator'}** using ${qmEval.qubits || dsInfo.quantum_qubits || 4} qubits and a **${qmEval.feature_map || 'ZZFeatureMap'}** to map non-linear feature interactions into higher-dimensional Hilbert space.\n\n**Key Feature Drivers:**\n${(clsEval.feature_importance || []).slice(0, 4).map(f => `- **${f.feature}**: Feature contribution of ${(f.importance * 100).toFixed(1)}%`).join('\n')}\n\n**Reproducibility Note:** Experiment ID \`${experiment.id || 'N/A'}\` with random seed \`${experiment.random_seed || experiment.reproducibility?.random_seed || 42}\` can be reproduced identically.`
            })
        }

        return res.status(400).json({ error: `Unknown action: ${action}` })
    } catch (err) {
        console.error(`[Quantum API] Error in action [${action}]:`, err)
        return res.status(500).json({ error: err.message || 'Internal server error' })
    }
}
