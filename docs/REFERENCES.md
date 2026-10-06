# Kushi Hygieia — Comprehensive References & Bibliography

> **Project:** Kushi Hygieia Healthcare Platform  
> **Repository:** EdlaAbhishek/Kushi-hyeieia  
> **Deployment:** [kushi-hygieia.vercel.app](https://kushi-hygieia.vercel.app)  
> **Documentation Version:** 1.0.0  
> **Last Updated:** March 2026  

---

## Table of Contents
1. [Overview & Concept](#1-overview--concept)
2. [Biomedical Datasets & Clinical Benchmarks](#2-biomedical-datasets--clinical-benchmarks)
3. [Quantum Machine Learning (QML) & Computing References](#3-quantum-machine-learning-qml--computing-references)
4. [Artificial Intelligence & Large Language Model (LLM) APIs](#4-artificial-intelligence--large-language-model-llm-apis)
5. [Frontend Frameworks, Libraries & Design System](#5-frontend-frameworks-libraries--design-system)
6. [Telehealth, Document OCR & Client-side Utilities](#6-telehealth-document-ocr--client-side-utilities)
7. [Backend, Database & Cloud Infrastructure](#7-backend-database--cloud-infrastructure)
8. [Healthcare Regulations, Ethics & Compliance Standards](#8-healthcare-regulations-ethics--compliance-standards)
9. [Academic Literature & Seminal Papers](#9-academic-literature--seminal-papers)

---

## 1. Overview & Concept

* **Name Origin:**
  * **Kushi / Khushi:** Sanskrit/Hindi for *happiness, wellness, and joy*.
  * **Hygieia (Ὑγίεια):** Ancient Greek goddess of health, cleanliness, and the prevention of disease.
* **Mission:** An intelligent healthcare platform that transforms complex health information into personalized AI-powered insights, connects individuals with the right medical support, and makes healthcare more accessible, informed, and connected.

---

## 2. Biomedical Datasets & Clinical Benchmarks

The platform's **Quantum Disease Intelligence** and diagnostic screening pipeline benchmark against verified, open-access medical databases:

### 2.1 Breast Cancer Wisconsin (Diagnostic)
* **Dataset ID:** `breast_cancer`
* **Clinical Origin:** University of Wisconsin Hospitals, Madison (Dr. William H. Wolberg, W. Nick Street, Olvi L. Mangasarian)
* **Repository / Source:** [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic) / `scikit-learn.datasets.load_breast_cancer`
* **Task:** Binary Classification (Benign vs. Malignant)
* **Dimensions:** 569 instances, 30 continuous features extracted from digitized Fine Needle Aspirate (FNA) images of breast masses
* **Open-Source QML Implementation Reference:** [mswamyvvce/Quantum-Breast-Cancer-Detection-Using-Quantum-Classifiers](https://github.com/mswamyvvce/Quantum-Breast-Cancer-Detection-Using-Quantum-Classifiers)
* **Licensing:** Open Access (Creative Commons Attribution 4.0 International - CC BY 4.0)

### 2.2 Pima Indians Diabetes
* **Dataset ID:** `diabetes`
* **Clinical Origin:** National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK)
* **Repository / Source:** [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/34/diabetes)
* **Task:** Binary Classification (Diabetic Outcome: 0 vs. 1)
* **Dimensions:** 768 female patients of Pima Indian heritage (age ≥ 21), 8 medical predictor features (Glucose, Blood Pressure, Insulin, BMI, Triceps Skinfold Thickness, Age, Pregnancies, Pedigree Function)
* **Open-Source QML Implementation Reference:** [Anto4K/VQC_on_Pima_Indians_Diabetes_Dataset](https://github.com/Anto4K/VQC_on_Pima_Indians_Diabetes_Dataset)
* **Licensing:** Public Domain / Open Access

### 2.3 Cleveland Heart Disease
* **Dataset ID:** `heart_disease`
* **Clinical Origin:** Cleveland Clinic Foundation (Dr. Robert Detrano, M.D., Ph.D.)
* **Repository / Source:** [UCI Machine Learning Repository - Heart Disease](https://archive.ics.uci.edu/dataset/45/heart+disease)
* **Task:** Binary Classification (Absence [0] vs. Presence [1] of Coronary Artery Disease)
* **Dimensions:** 303 clinical records, 13 diagnostic attributes (Resting blood pressure, serum cholesterol, ECG results, thalach, ST depression, fluoroscopy vessels)
* **Open-Source QML Implementation Reference:** [TirtheshJani/QML-Healthcare-Diagnostics](https://github.com/TirtheshJani/QML-Healthcare-Diagnostics)
* **Licensing:** Creative Commons Attribution 4.0 International (CC BY 4.0)

### 2.4 Oxford Parkinson’s Disease
* **Dataset ID:** `parkinsons`
* **Clinical Origin:** University of Oxford & National Centre for Voice and Speech (Dr. Max A. Little, Patrick E. McSharry, Eric J. Hunter, Lorraine O. Ramig)
* **Repository / Source:** [UCI Machine Learning Repository - Parkinsons](https://archive.ics.uci.edu/dataset/174/parkinsons)
* **Task:** Binary Classification (Healthy Control [0] vs. Parkinson's Diagnosis [1])
* **Dimensions:** 195 biomedical voice recordings across 31 individuals, 22 continuous acoustic attributes (Jitter, Shimmer, HNR, RPDE, DFA, fundamental pitch measures)
* **Open-Source QML Implementation Reference:** [ranazsaad/QMedicine-Parkinson-Detection](https://github.com/ranazsaad/QMedicine-Parkinson-Detection)
* **Licensing:** Creative Commons Attribution 4.0 International (CC BY 4.0)

---

## 3. Quantum Machine Learning (QML) & Computing References

* **IBM Qiskit SDK:**
  * Framework: [Qiskit](https://qiskit.org/) (`qiskit >= 1.0.0`)
  * Documentation: [https://docs.quantum.ibm.com/](https://docs.quantum.ibm.com/)
* **Qiskit Machine Learning:**
  * Package: `qiskit-machine-learning`
  * Algorithms:
    * `ZZFeatureMap` (Second-order Pauli expansion circuit for nonlinear quantum feature state preparation)
    * `QuantumKernel` & `QSVC` (Quantum Support Vector Classifier)
    * `VQC` (Variational Quantum Classifier with parameterized ansatz circuits and classical COBYLA/SPSA optimizers)
* **Quantum Simulation Backend:**
  * `Qiskit Aer Simulator` (`qiskit-aer`): High-fidelity statevector and shot-based quantum circuit simulation (1,024 shots per circuit execution).
  * In-process Node.js Quantum Simulation Engine (`api/quantum-sim-engine.js`): High-performance pure JavaScript linear algebra simulator implementing statevector evolution and fidelity inner products for cloud serverless environments without Python dependencies.
* **Classical ML & Statistics:**
  * [Scikit-Learn](https://scikit-learn.org/): Data preprocessing pipelines (`StandardScaler`, `MinMaxScaler`, `PCA`, `SelectKBest`, `SimpleImputer`), reference baselines (`SVC`, `RandomForestClassifier`, `LogisticRegression`), and evaluation metrics (`accuracy_score`, `roc_auc_score`, `confusion_matrix`).
  * [NumPy](https://numpy.org/) & [Pandas](https://pandas.pydata.org/): Matrix operations and tabular clinical data processing.

---

## 4. Artificial Intelligence & Large Language Model (LLM) APIs

* **Google Gemini API (`@google/generative-ai`):**
  * Provider: Google DeepMind
  * Documentation: [https://ai.google.dev/docs](https://ai.google.dev/docs)
  * Utilization:
    * **Kushi Care AI:** 24/7 conversational medical triage and empathetic symptom inquiry.
    * **Prescription Simplification:** Translating illegible clinical notes, medical jargon, and dosages into plain language and structured medication schedules.
* **OpenRouter API (`@openrouter/sdk`):**
  * Provider: OpenRouter
  * Documentation: [https://openrouter.ai/docs](https://openrouter.ai/docs)
  * Utilization: Resilient multi-provider routing and fallback model orchestration ensuring zero downtime for clinical chat services.
* **Clinical System Instructions:**
  * Formulated with strict safety bounds, non-diagnostic disclaimers, triage escalation triggers (emergency red flags), and privacy-preserving context windows.

---

## 5. Frontend Frameworks, Libraries & Design System

* **Core Runtime & Build System:**
  * [React 18](https://react.dev/): Component architecture, state management, and custom hooks.
  * [Vite 6](https://vitejs.dev/): Modern ES module development server and optimized rollup bundler.
  * [React Router DOM v6](https://reactrouter.com/): Declarative client-side routing, protected auth guards, and multi-portal layout nesting.
* **Styling & Design Tokens:**
  * [Tailwind CSS v4](https://tailwindcss.com/): Responsive utility engine.
  * `clsx` & `tailwind-merge`: Conditional class composition and deduplication.
  * Custom Vanilla CSS Design System: HSL-calibrated medical tokens (Teal `#0D9488`, Royal Blue `#1565C0`, Slate `#0F172A`), dark mode support, and glassmorphism.
* **Interactive UI & Motion:**
  * [Framer Motion](https://www.framer.com/motion/): Hardware-accelerated transitions, modal entrances, and staggered list animations.
  * [Lucide React](https://lucide.dev/): Scalable SVG medical and platform iconography.
  * [21st.dev](https://21st.dev/) & [Magic UI](https://magicui.design/): Design inspiration for the multi-layered fluid wave canvas (`gradient-wave.jsx`) and infinite marquee ticker (`marquee.jsx`).
* **Medical Data Visualization:**
  * [Recharts](https://recharts.org/): React-native charting for quantum state probabilities, feature importance graphs, vital sign historical trends, and queue wait times.
* **Search Engine:**
  * [Fuse.js](https://www.fusejs.io/): Zero-dependency client-side fuzzy search for doctor directories, hospital bed inventory, and prescription drugs.
* **Notifications:**
  * [React Hot Toast](https://react-hot-toast.com/): Accessible toast alerts for user feedback, booking confirmations, and queue status changes.

---

## 6. Telehealth, Document OCR & Client-side Utilities

* **Teleconsultation (WebRTC):**
  * [PeerJS](https://peerjs.com/): WebRTC peer-to-peer data, audio, and video streaming between patients and verified physicians with automatic STUN server configuration.
* **Document Parsing & Health Vault:**
  * [PDF.js (`pdfjs-dist`)](https://mozilla.github.io/pdf.js/): Mozilla’s PDF extraction library executing locally in the browser to read blood tests, imaging reports, and medical discharge summaries without exposing unencrypted files to third parties.
  * [Mammoth.js](https://github.com/mwilliamson/mammoth.js): Conversion of `.docx` medical reports into clean HTML/plain text.
* **React Hooks:**
  * [usehooks-ts](https://usehooks-ts.com/): Type-safe React utility hooks (`useLocalStorage`, `useMediaQuery`, `useDebounceCallback`).

---

## 7. Backend, Database & Cloud Infrastructure

* **Database & BaaS:**
  * [Supabase](https://supabase.com/): Managed PostgreSQL 16 database, Row-Level Security (RLS) policies, JSON Web Token (JWT) session validation, and encrypted object storage for health reports.
* **Serverless / Node.js Engine:**
  * Express v4 / Node.js HTTP runtime with Vercel Serverless Functions (`api/`).
  * Process Isolation: Controlled child-process execution (`child_process.spawn`) for Python QML pipelines with fallback to native Node.js simulation.
* **Hosting & Deployment:**
  * [Vercel](https://vercel.com/): Global edge network deployment with automated CI/CD and custom security headers.

---

## 8. Healthcare Regulations, Ethics & Compliance Standards

* **DISHA (Digital Information Security in Healthcare Act - India):**
  * Guiding framework for electronic health data ownership, explicit patient consent mechanisms, and legal protections against unauthorized data sharing.
* **ABDM (Ayushman Bharat Digital Mission):**
  * Alignment with India's national digital health infrastructure: unified health identifier patterns, digital OPD tokenization, and standardized electronic health records (EHR).
* **HIPAA Security & Privacy Rules (USA Reference Standard):**
  * AES-256 data encryption at rest.
  * TLS 1.3 protocol encryption for all web and API transmissions.
  * Role-Based Access Control (RBAC) strictly compartmentalizing Patient, Doctor, and Hospital Administrator scopes.
* **Medical Disclaimer & Ethical AI:**
  * Strict adherence to preliminary triage boundaries: Kushi Hygieia AI and QML evaluations explicitly state that outputs are educational/assistive and do not constitute clinical diagnosis or replace licensed physician judgment.

---

## 9. Academic Literature & Seminal Papers

1. **Wolberg, W. H., Street, W. N., & Mangasarian, O. L. (1995).**  
   *Machine learning techniques to diagnose breast cancers from fine-needle aspirates.* Cancer Letters, 77(2-3), 163-171.
2. **Smith, J. W., Everhart, J. E., Dickson, W. C., Knowler, W. C., & Johannes, R. S. (1988).**  
   *Using the ADAP learning algorithm to forecast the onset of diabetes mellitus.* In Proceedings of the Annual Symposium on Computer Application in Medical Care (p. 261). American Medical Informatics Association.
3. **Detrano, R., Janosi, A., Steinbrunn, W., Pfisterer, M., Schmid, J., Sandhu, S., ... & Froelicher, V. (1989).**  
   *International application of a new probability algorithm for the diagnosis of coronary artery disease.* The American Journal of Cardiology, 64(5), 304-310.
4. **Little, M. A., McSharry, P. E., Hunter, E. J., & Ramig, L. O. (2009).**  
   *Suitability of dysphonia measurements for telemonitoring of Parkinson’s disease.* IEEE Transactions on Biomedical Engineering, 56(4), 1015-1022.
5. **Havlíček, V., Córcoles, A. D., Temme, K., Harrow, A. W., Kandala, A., Chow, J. M., & Gambetta, J. M. (2019).**  
   *Supervised learning with quantum-enhanced feature spaces.* Nature, 567(7747), 209-212.
6. **Schuld, M., & Killoran, N. (2019).**  
   *Quantum machine learning in feature Hilbert spaces.* Physical Review Letters, 122(4), 040504.
7. **Biamonte, J., Wittek, P., Pancotti, N., Rebentrost, P., Wiebe, N., & Lloyd, S. (2017).**  
   *Quantum machine learning.* Nature, 549(7671), 195-202.

---
*Generated for the Kushi Hygieia Project Repository.*
