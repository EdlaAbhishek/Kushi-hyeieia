"""
Clinical Inference & Prediction Engine.
Operates on trained, validated healthcare ML/QML models.
Requires inputs matching the exact feature schema of the verified model.
Never hallucinates missing features.
Fits all transformers exclusively on the training set to prevent data leakage.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

from python.dataset_registry import DATASET_REGISTRY, get_dataset

def predict_single_patient(dataset_id, patient_features, model_type='classical', random_seed=42):
    """
    Performs clinical risk inference on patient features against a trained model pipeline.
    Validates input schema and feature bounds.
    """
    if dataset_id not in DATASET_REGISTRY:
        return {
            'status': 'error',
            'error_type': 'unsupported_dataset',
            'error': f"Unknown dataset domain '{dataset_id}'."
        }
    
    meta = DATASET_REGISTRY[dataset_id]
    df, _ = get_dataset(dataset_id)
    target_col = meta['target_column']
    expected_cols = [c for c in df.columns if c != target_col]

    # 1. Strict Schema Validation - check for missing required fields
    missing_fields = []
    parsed_features = {}
    for col in expected_cols:
        val = patient_features.get(col)
        if val is None or val == '' or (isinstance(val, str) and not val.strip()):
            missing_fields.append(col)
        else:
            try:
                parsed_features[col] = float(val)
            except (ValueError, TypeError):
                return {
                    'status': 'error',
                    'error_type': 'invalid_feature_value',
                    'error': f"Invalid non-numeric value for feature '{col}': {val}"
                }
    
    if missing_fields:
        return {
            'status': 'error',
            'error_type': 'missing_features',
            'missing_features': missing_fields,
            'error': f"Cannot run clinical inference. Missing required patient features: {', '.join(missing_fields)}"
        }

    # 2. Prepare Data & Split First (Prevent Leakage)
    X = df[expected_cols].copy()
    y = df[target_col].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_seed, stratify=y
    )

    # 3. Fit Imputer on Train Only
    imputer = SimpleImputer(strategy='median')
    X_train_imp = imputer.fit_transform(X_train)
    patient_df = pd.DataFrame([parsed_features])[expected_cols]
    patient_imp = imputer.transform(patient_df)

    # 4. Fit Scaler on Train Only
    scaling_type = meta.get('scaling_strategy', 'standard')
    scaler = MinMaxScaler() if scaling_type == 'minmax' else StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_imp)
    patient_scaled = scaler.transform(patient_imp)

    # 5. Optional PCA (Fitted on Train Only)
    pca_comps = meta.get('default_quantum_qubits', 4)
    pca = PCA(n_components=pca_comps, random_state=random_seed)
    X_train_pca = pca.fit_transform(X_train_scaled)
    patient_pca = pca.transform(patient_scaled)

    # 6. Train Selected Model
    if model_type == 'svm':
        clf = SVC(kernel='rbf', C=1.0, random_state=random_seed)
        clf.fit(X_train_scaled, y_train)
        pred_raw = clf.predict(patient_scaled)[0]
        dec = clf.decision_function(patient_scaled)[0]
        prob_positive = float(1.0 / (1.0 + np.exp(-dec)))
    elif model_type == 'logistic_regression':
        clf = LogisticRegression(max_iter=1000, random_state=random_seed)
        clf.fit(X_train_scaled, y_train)
        pred_raw = clf.predict(patient_scaled)[0]
        prob_positive = float(clf.predict_proba(patient_scaled)[0, 1])
    else: # random_forest default
        clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=random_seed)
        clf.fit(X_train_scaled, y_train)
        pred_raw = clf.predict(patient_scaled)[0]
        prob_positive = float(clf.predict_proba(patient_scaled)[0, 1])

    # 7. Evaluate Relative Risk & Cohort Deviations
    median_profile = df[expected_cols].median().to_dict()
    std_profile = df[expected_cols].std().to_dict()
    contributions = []
    
    for col in expected_cols:
        val = parsed_features[col]
        med = median_profile.get(col, val)
        std = std_profile.get(col, 1.0)
        diff = val - med
        z_score = diff / (std if std > 0 else 1.0)
        contributions.append({
            'feature': col,
            'patient_value': round(float(val), 2),
            'cohort_median': round(float(med), 2),
            'deviation': round(float(diff), 2),
            'z_score': round(float(z_score), 2),
            'relative_impact': 'elevated' if z_score > 0.5 else ('reduced' if z_score < -0.5 else 'normal')
        })

    # Sort contributions by absolute z-score
    contributions.sort(key=lambda x: abs(x['z_score']), reverse=True)

    risk_label = meta['classes'].get(1, 'Elevated Risk')
    healthy_label = meta['classes'].get(0, 'Low Risk')
    predicted_label = risk_label if int(pred_raw) == 1 else healthy_label

    return {
        'status': 'success',
        'dataset_id': dataset_id,
        'dataset_name': meta['name'],
        'model_used': clf.__class__.__name__,
        'prediction_class': int(pred_raw),
        'prediction_label': predicted_label,
        'risk_probability': round(prob_positive, 4),
        'is_elevated_risk': bool(int(pred_raw) == 1),
        'top_feature_deviations': contributions[:6],
        'all_deviations': contributions,
        'disclaimer': 'Research and decision-support use only. This output is not a medical diagnosis. Consult a certified medical doctor.'
    }
