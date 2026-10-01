"""
Dataset Registry for Healthcare Quantum Machine Learning.
Defines verified biomedical datasets with documented clinical schemas,
sources, domain-specific preprocessing pipelines, and open-source research attribution.
"""

import os
import pandas as pd
import numpy as np
from sklearn.datasets import load_breast_cancer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'database', 'verified_datasets')

DATASET_REGISTRY = {
    'breast_cancer': {
        'id': 'breast_cancer',
        'name': 'Breast Cancer Wisconsin (Diagnostic)',
        'source': 'scikit-learn / UCI Machine Learning Repository (Wolberg, Street, Mangasarian)',
        'task': 'Binary Classification',
        'target_column': 'target',
        'classes': {0: 'Benign', 1: 'Malignant'},
        'samples': 569,
        'features_count': 30,
        'license': 'Open Access (CC BY 4.0)',
        'reference_repo': 'mswamyvvce/Quantum-Breast-Cancer-Detection-Using-Quantum-Classifiers',
        'reference_url': 'https://github.com/mswamyvvce/Quantum-Breast-Cancer-Detection-Using-Quantum-Classifiers',
        'description': 'Biopsies of breast masses with morphological measurements computed from digitized fine needle aspirate (FNA) images.',
        'missing_value_strategy': 'none',
        'scaling_strategy': 'minmax',
        'dimensionality_reduction': 'pca',
        'default_quantum_qubits': 4,
        'supported_models': ['logistic_regression', 'svm', 'random_forest', 'qsvm', 'vqc'],
        'file_path': os.path.join(DATA_DIR, 'breast_cancer.csv'),
        'feature_definitions': [
            {'name': 'mean_radius', 'unit': 'mm', 'type': 'numerical', 'desc': 'Mean distance from center to perimeter'},
            {'name': 'mean_texture', 'unit': 'grayscale', 'type': 'numerical', 'desc': 'Standard deviation of gray-scale values'},
            {'name': 'mean_perimeter', 'unit': 'mm', 'type': 'numerical', 'desc': 'Mean size of the core tumor perimeter'},
            {'name': 'mean_area', 'unit': 'mm²', 'type': 'numerical', 'desc': 'Mean area of the core tumor'},
            {'name': 'mean_smoothness', 'unit': 'ratio', 'type': 'numerical', 'desc': 'Local variation in radius lengths'},
            {'name': 'mean_compactness', 'unit': 'ratio', 'type': 'numerical', 'desc': 'perimeter² / area - 1.0'},
            {'name': 'mean_concavity', 'unit': 'ratio', 'type': 'numerical', 'desc': 'Severity of concave portions of contour'},
            {'name': 'mean_concave_points', 'unit': 'count', 'type': 'numerical', 'desc': 'Number of concave portions of contour'},
            {'name': 'mean_symmetry', 'unit': 'ratio', 'type': 'numerical', 'desc': 'Symmetry score of nuclei'},
            {'name': 'mean_fractal_dimension', 'unit': 'ratio', 'type': 'numerical', 'desc': 'Coastline approximation - 1'}
        ]
    },
    'diabetes': {
        'id': 'diabetes',
        'name': 'Pima Indians Diabetes',
        'source': 'UCI Machine Learning Repository / National Institute of Diabetes and Digestive and Kidney Diseases',
        'task': 'Binary Classification',
        'target_column': 'Outcome',
        'classes': {0: 'Negative (Non-diabetic)', 1: 'Positive (Diabetic)'},
        'samples': 768,
        'features_count': 8,
        'license': 'Open Access / Public Domain',
        'reference_repo': 'Anto4K/VQC_on_Pima_Indians_Diabetes_Dataset',
        'reference_url': 'https://github.com/Anto4K/VQC_on_Pima_Indians_Diabetes_Dataset',
        'description': 'Diagnostic metabolic measurements to predict diabetes onset in Pima Indian heritage females (age >= 21).',
        'missing_value_strategy': 'zero_as_missing_median',
        'zero_invalid_columns': ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI'],
        'scaling_strategy': 'standard',
        'dimensionality_reduction': 'select_k_best',
        'default_quantum_qubits': 4,
        'supported_models': ['logistic_regression', 'svm', 'random_forest', 'qsvm', 'vqc'],
        'file_path': os.path.join(DATA_DIR, 'diabetes.csv'),
        'feature_definitions': [
            {'name': 'Pregnancies', 'unit': 'count', 'type': 'numerical', 'desc': 'Number of times pregnant'},
            {'name': 'Glucose', 'unit': 'mg/dL', 'type': 'numerical', 'desc': 'Plasma glucose concentration (2 hours in oral glucose tolerance test)'},
            {'name': 'BloodPressure', 'unit': 'mm Hg', 'type': 'numerical', 'desc': 'Diastolic blood pressure'},
            {'name': 'SkinThickness', 'unit': 'mm', 'type': 'numerical', 'desc': 'Triceps skin fold thickness'},
            {'name': 'Insulin', 'unit': 'μU/mL', 'type': 'numerical', 'desc': '2-Hour serum insulin'},
            {'name': 'BMI', 'unit': 'kg/m²', 'type': 'numerical', 'desc': 'Body mass index (weight in kg/(height in m)²)'},
            {'name': 'DiabetesPedigreeFunction', 'unit': 'score', 'type': 'numerical', 'desc': 'Diabetes pedigree genetic score'},
            {'name': 'Age', 'unit': 'years', 'type': 'numerical', 'desc': 'Age in years'}
        ]
    },
    'heart_disease': {
        'id': 'heart_disease',
        'name': 'Cleveland Heart Disease',
        'source': 'UCI Machine Learning Repository / Cleveland Clinic Foundation (Detrano, M.D., Ph.D.)',
        'task': 'Binary Classification',
        'target_column': 'target',
        'classes': {0: 'No Disease Present', 1: 'Heart Disease Diagnosed'},
        'samples': 303,
        'features_count': 13,
        'license': 'Open Access / Creative Commons',
        'reference_repo': 'TirtheshJani/QML-Healthcare-Diagnostics',
        'reference_url': 'https://github.com/TirtheshJani/QML-Healthcare-Diagnostics',
        'description': 'Angiographic disease status evaluated across clinical exams, ECG waveforms, and treadmill exercise tests.',
        'missing_value_strategy': 'median',
        'scaling_strategy': 'standard',
        'dimensionality_reduction': 'select_k_best',
        'default_quantum_qubits': 4,
        'supported_models': ['logistic_regression', 'svm', 'random_forest', 'qsvm', 'vqc'],
        'file_path': os.path.join(DATA_DIR, 'heart_disease.csv'),
        'feature_definitions': [
            {'name': 'age', 'unit': 'years', 'type': 'numerical', 'desc': 'Patient age'},
            {'name': 'sex', 'unit': '0=F, 1=M', 'type': 'categorical', 'desc': 'Biological sex'},
            {'name': 'cp', 'unit': '1-4', 'type': 'categorical', 'desc': 'Chest pain type (1: typical angina, 2: atypical, 3: non-anginal, 4: asymptomatic)'},
            {'name': 'trestbps', 'unit': 'mm Hg', 'type': 'numerical', 'desc': 'Resting blood pressure on hospital admission'},
            {'name': 'chol', 'unit': 'mg/dL', 'type': 'numerical', 'desc': 'Serum cholesterol'},
            {'name': 'fbs', 'unit': '0=No, 1=Yes', 'type': 'categorical', 'desc': 'Fasting blood sugar > 120 mg/dL'},
            {'name': 'restecg', 'unit': '0-2', 'type': 'categorical', 'desc': 'Resting electrocardiographic results'},
            {'name': 'thalach', 'unit': 'bpm', 'type': 'numerical', 'desc': 'Maximum heart rate achieved'},
            {'name': 'exang', 'unit': '0=No, 1=Yes', 'type': 'categorical', 'desc': 'Exercise induced angina'},
            {'name': 'oldpeak', 'unit': 'depression', 'type': 'numerical', 'desc': 'ST depression induced by exercise relative to rest'},
            {'name': 'slope', 'unit': '1-3', 'type': 'categorical', 'desc': 'Slope of peak exercise ST segment'},
            {'name': 'ca', 'unit': '0-3', 'type': 'numerical', 'desc': 'Number of major vessels colored by flourosopy'},
            {'name': 'thal', 'unit': '3,6,7', 'type': 'categorical', 'desc': '3 = normal; 6 = fixed defect; 7 = reversable defect'}
        ]
    },
    'parkinsons': {
        'id': 'parkinsons',
        'name': "Oxford Parkinson's Disease",
        'source': 'UCI Machine Learning Repository / Little et al., Oxford University & National Centre for Voice and Speech',
        'task': 'Binary Classification',
        'target_column': 'status',
        'classes': {0: 'Healthy Control', 1: "Parkinson's Disease"},
        'samples': 195,
        'features_count': 22,
        'license': 'Open Access (CC BY 4.0)',
        'reference_repo': 'ranazsaad/QMedicine-Parkinson-Detection',
        'reference_url': 'https://github.com/ranazsaad/QMedicine-Parkinson-Detection',
        'description': 'Biomedical acoustic voice measurements from phonations to discriminate healthy individuals from patients with Parkinson’s disease.',
        'missing_value_strategy': 'none',
        'scaling_strategy': 'minmax',
        'dimensionality_reduction': 'pca',
        'default_quantum_qubits': 4,
        'supported_models': ['logistic_regression', 'svm', 'random_forest', 'qsvm', 'vqc'],
        'file_path': os.path.join(DATA_DIR, 'parkinsons.csv'),
        'feature_definitions': [
            {'name': 'MDVP:Fo(Hz)', 'unit': 'Hz', 'type': 'numerical', 'desc': 'Average vocal fundamental frequency'},
            {'name': 'MDVP:Fhi(Hz)', 'unit': 'Hz', 'type': 'numerical', 'desc': 'Maximum vocal fundamental frequency'},
            {'name': 'MDVP:Flo(Hz)', 'unit': 'Hz', 'type': 'numerical', 'desc': 'Minimum vocal fundamental frequency'},
            {'name': 'MDVP:Jitter(%)', 'unit': '%', 'type': 'numerical', 'desc': 'Multidimensional voice program jitter ratio'},
            {'name': 'HNR', 'unit': 'ratio', 'type': 'numerical', 'desc': 'Harmonics-to-noise ratio'},
            {'name': 'RPDE', 'unit': 'entropy', 'type': 'numerical', 'desc': 'Recurrence period density entropy measure'},
            {'name': 'DFA', 'unit': 'exponent', 'type': 'numerical', 'desc': 'Detrended fluctuation analysis'}
        ]
    }
}

def get_dataset(dataset_id):
    """Loads dataframe and metadata for a verified dataset."""
    if dataset_id not in DATASET_REGISTRY:
        raise ValueError(f"Unknown dataset '{dataset_id}'. Choose from: {list(DATASET_REGISTRY.keys())}")
    
    meta = DATASET_REGISTRY[dataset_id]
    csv_path = meta['file_path']
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Verified dataset file missing: {csv_path}")
    
    df = pd.read_csv(csv_path)
    return df, meta

def list_registered_datasets():
    """Returns clean serialization dictionary of all supported datasets."""
    result = []
    for k, v in DATASET_REGISTRY.items():
        result.append({
            'id': v['id'],
            'name': v['name'],
            'source': v['source'],
            'task': v['task'],
            'target_column': v['target_column'],
            'classes': v['classes'],
            'samples': v['samples'],
            'features_count': v['features_count'],
            'license': v['license'],
            'reference_repo': v['reference_repo'],
            'reference_url': v['reference_url'],
            'description': v['description'],
            'missing_value_strategy': v['missing_value_strategy'],
            'scaling_strategy': v['scaling_strategy'],
            'dimensionality_reduction': v['dimensionality_reduction'],
            'default_quantum_qubits': v['default_quantum_qubits'],
            'supported_models': v['supported_models'],
            'feature_definitions': v['feature_definitions']
        })
    return result
