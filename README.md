# 🏥 Kushi Hygieia — Healthcare Platform

> **A Next-Generation AI & Quantum-Assisted Healthcare Ecosystem**  
> Connecting patients, doctors, and hospitals across urban and rural India with unified teleconsultation, multimodal vision OCR, emergency dispatch, and hybrid Quantum Machine Learning (QML) diagnostics.

🌐 **Live Platform**: [https://kushi-hygieia.vercel.app](https://kushi-hygieia.vercel.app)

---

## 🔑 Pre-Configured Demo Accounts

For rapid review without signing up, use these pre-seeded demo accounts.  
**Password for all accounts:** `Demo@1234`

| Role | Email | Access Scope |
| :--- | :--- | :--- |
| 🧑‍⚕️ **Patient** | `patient.demo@khushi.in` | Health Vault, Appointments, Teleconsultation, AI Assistant, Emergency SOS |
| 👨‍⚕️ **Doctor** | `doctor.demo@khushi.in` | Clinical Dashboard, Patient Queue, Video Consultations, Prescription Writer |
| 🛡️ **Admin** | `admin.demo@khushi.in` | System Oversight, Hospital Verification, Doctor Credentialing, Analytics |

---

## 🌟 Core Innovations & Key Features

### 1. 👁️ Single Dedicated Multimodal Prescription Scanner
- Zero-friction optical recognition powered by high-capacity multimodal vision AI (`dots-studio/dots-3-note-preview:free`).
- Parses handwritten doctor prescriptions and medical bills into structured medicines, dosages, frequencies, and precautions.
- Features resilient JSON salvaging, `<think>` reasoning tag sanitization, and fallback local Tesseract OCR.

### 2. ⚛️ Hybrid Quantum Machine Learning (QML) Diagnostics
- Built on **Qiskit Aer Simulator** and classical ML baselines (RandomForest, SVC).
- Trains Variational Quantum Classifiers (VQC) with 4-qubit parameterized quantum circuits (`ZZFeatureMap`, `RealAmplitudes`).
- Benchmarked against verified clinical datasets: *Oxford Parkinson's Disease*, *Wisconsin Breast Cancer*, *Pima Indians Diabetes*, and *Cleveland Heart Disease*.

### 3. 🚨 Emergency Dispatch & Real-Time Hospital Availability
- Immediate SOS trigger with GPS location broadcast.
- Live hospital directory tracking ICU beds, general beds, oxygen availability, and blood bank units.

### 4. 📹 Teleconsultation & Secure Health Vault
- PeerJS / WebRTC HD video consultations with real-time in-call messaging.
- Role-based encrypted health record storage protected by Supabase Row-Level Security (RLS).

### 5. 🌾 Rural Health Worker Mode
- Streamlined interface for ASHA and Anganwadi community health workers.
- Rapid vitals entry (BP, SpO2, Blood Glucose, BMI) with automatic color-coded clinical risk alerts.

---

## 📂 Repository Structure

```
.
├── api/                        # Vercel serverless / Vite dev API endpoints
│   ├── ai-chat.js              # Multi-turn clinical chat assistant
│   ├── analyze-prescription.js # Dedicated multimodal vision prescription OCR
│   ├── elevenlabs-tts.js       # Voice synthesis & accessibility audio
│   ├── openrouter-client.js    # Resilient OpenRouter LLM gateway
│   ├── quantum-pipeline.js     # Hybrid QML training & inference runner
│   ├── quantum-sim-engine.js   # Client-side quantum circuit statevector engine
│   └── translate-prescription.js # Multilingual medical translation
│
├── database/                   # Database architecture & datasets
│   ├── MASTER_SETUP.sql        # Comprehensive single-run database setup
│   ├── schema.sql              # Clean initial PostgreSQL relational schema
│   ├── migrations/             # Incremental database migrations
│   ├── patches/                # Historical hotfixes & schema patches
│   ├── seeds/                  # Seed scripts for demo doctors & real hospitals
│   ├── quantum_models/         # Serialized QML models & experiment registry
│   └── verified_datasets/      # Benchmark datasets (Parkinson's, Cancer, etc.)
│
├── docs/                       # Project documentation & presentation assets
│   ├── images/                 # Architecture diagrams & key feature charts
│   ├── REFERENCES.md           # Clinical, algorithmic & QML bibliography
│   ├── REFERENCES_DOCUMENTATION.html # Interactive technical documentation
│   ├── SoulReapers_Abstract.pdf # SIH Team research abstract & proposal
│   └── KUSHI_HYGIEIA_REFERENCES.pdf  # Comprehensive reference document
│
├── python/                     # Python QML training & evaluation backend
│   ├── dataset_registry.py     # Dataset loader, scaler & PCA dimensionality reducer
│   ├── pipeline.py             # Quantum circuit construction & VQC training
│   ├── model_registry.py       # Model serialization & artifact management
│   └── run_qml_pipeline.py     # CLI experiment runner
│
├── public/                     # Static web assets, icons & SEO metadata
├── scripts/                    # Admin setup & demo seeding scripts
├── src/                        # React 18 application source code
│   ├── components/             # Reusable UI components & layouts
│   ├── layouts/                # Role-specific layouts (Dashboard, Admin, Main)
│   ├── pages/                  # Route views (Services, Teleconsult, Vault, etc.)
│   ├── services/               # Supabase client, auth context & audit logging
│   └── styles/                 # Global CSS design system
│
├── vercel.json                 # Vercel deployment routes & serverless config
└── vite.config.js              # Vite bundler config with built-in /api middleware
```

---

## 🚀 Quick Start & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: 3.10+ *(optional, required only for local QML model training with Qiskit)*

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/EdlaAbhishek/Kushi-hyeieia.git
   cd Kushi-hyeieia
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Provide your Supabase URL, Anon Key, and OpenRouter API Key in `.env`.

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.  
   *(Vite includes built-in server middleware for `/api/*` endpoints during local development).*

5. **Run tests**:
   ```bash
   npm test
   ```

6. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, React Router 6, Framer Motion, Lucide React, Recharts |
| **Backend & API** | Node.js Serverless Functions, Vercel Serverless, OpenRouter API |
| **Database & Auth** | Supabase (PostgreSQL 16), Row-Level Security (RLS), Supabase Auth |
| **Vision & AI** | `dots-studio/dots-3-note-preview:free`, Tesseract.js, Google Gemini |
| **Quantum Computing** | Qiskit, Qiskit Aer, Statevector Simulator, Parameterized Quantum Circuits |
| **Realtime & Media** | PeerJS (WebRTC), Supabase Realtime Channels, HTML5 Canvas |
| **Testing** | Vitest, React Testing Library, JSDOM |

---

## 📄 License & References

- Technical architecture, clinical citations, and academic papers are documented in [`docs/REFERENCES.md`](docs/REFERENCES.md).
- Developed for the **Smart India Hackathon (SIH)** healthcare initiative.
