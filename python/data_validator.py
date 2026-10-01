"""
Dataset Validation Module for Healthcare ML/QML.
Validates uploaded tabular CSV data against stringent medical and machine learning requirements
before any preprocessing, training, or inference is permitted.
"""

import io
import pandas as pd
import numpy as np

def validate_dataset(df, target_col=None):
    """
    Validates a pandas DataFrame for healthcare classification.
    Returns:
        is_valid: bool
        errors: list of error strings (blocking execution)
        warnings: list of warning strings
        stats: dict of dataset characteristics
    """
    errors = []
    warnings = []
    
    if df is None or not isinstance(df, pd.DataFrame):
        return False, ["Invalid data input: expected a tabular DataFrame."], [], {}
    
    row_count, col_count = df.shape
    
    # 1. Row count validation
    if row_count < 30:
        errors.append(f"Insufficient sample size: Dataset contains {row_count} rows. A minimum of 30 clinical observations is required for stratified evaluation.")
    
    # 2. Column count validation
    if col_count < 3:
        errors.append(f"Insufficient feature dimensionality: Dataset contains {col_count} columns. Requires at least 2 diagnostic features and 1 target column.")
    
    # 3. Target column detection and validation
    if target_col is None:
        # Check standard healthcare target column names
        candidates = ['target', 'outcome', 'diagnosis', 'class', 'status', 'label', 'condition', 'disease', 'mortality']
        found = [c for c in df.columns if str(c).lower().strip() in candidates]
        if found:
            target_col = found[0]
        else:
            # Fallback to the last column
            target_col = df.columns[-1]
            warnings.append(f"Target column not explicitly specified; inferred '{target_col}' as target.")
            
    if target_col not in df.columns:
        errors.append(f"Target column '{target_col}' not found in dataset columns: {list(df.columns)}")
        return False, errors, warnings, {'rows': row_count, 'columns': col_count}
    
    # 4. Target class distribution validation
    target_series = df[target_col].dropna()
    unique_classes = target_series.unique()
    
    if len(unique_classes) < 2:
        errors.append(f"Target column contains only one class ({unique_classes.tolist()}). Binary classification requires at least two distinct outcome classes.")
    elif len(unique_classes) > 2:
        # Multiclass or continuous target
        if np.issubdtype(target_series.dtype, np.number) and len(unique_classes) > 10:
            errors.append(f"Target column '{target_col}' appears continuous with {len(unique_classes)} distinct numeric values. Expected binary classification target (0/1).")
        else:
            warnings.append(f"Target column '{target_col}' contains {len(unique_classes)} classes. Multi-class will be mapped to one-vs-rest binary task.")

    # Check class imbalance
    class_counts = target_series.value_counts().to_dict()
    min_class_count = min(class_counts.values()) if class_counts else 0
    if min_class_count < 5:
        errors.append(f"Severe class scarcity: Minority class has only {min_class_count} instances. Minimum 5 samples per class required for train/test split.")
    elif min_class_count < 10:
        warnings.append(f"High class imbalance: Minority class has only {min_class_count} samples. Stratified evaluation and balanced sampling recommended.")

    # 5. Feature inspection (excluding target)
    feature_cols = [c for c in df.columns if c != target_col]
    
    # Check constant / zero-variance columns
    constant_cols = []
    for c in feature_cols:
        if df[c].nunique(dropna=False) <= 1:
            constant_cols.append(c)
    if constant_cols:
        errors.append(f"Constant columns detected (zero diagnostic variance): {constant_cols}. These features carry no predictive information.")

    # Check missing values
    missing_pct = df[feature_cols].isnull().mean()
    high_missing = missing_pct[missing_pct > 0.50].index.tolist()
    if high_missing:
        errors.append(f"Excessive missing values: Columns {high_missing} have over 50% missing data. Cannot reliably impute clinical features.")
    elif missing_pct.max() > 0.15:
        warnings.append("Elevated missing values (>15%) detected; domain-specific imputation will be required.")

    # Check duplicate rows
    dup_count = df.duplicated().sum()
    if dup_count > (row_count * 0.25):
        warnings.append(f"High duplicate observation rate: {dup_count} duplicate rows ({dup_count/row_count*100:.1f}%) detected.")

    # Check numeric compatibility
    non_numeric_cols = []
    for c in feature_cols:
        # Check if column is numeric or can be safely cast
        if not pd.api.types.is_numeric_dtype(df[c]):
            # Try to convert
            converted = pd.to_numeric(df[c], errors='coerce')
            if converted.isnull().sum() > (len(df) * 0.2):
                non_numeric_cols.append(c)
    
    if non_numeric_cols:
        errors.append(f"Non-numeric clinical features detected that cannot be converted to numeric coordinates: {non_numeric_cols}. Categorical variables must be encoded.")

    stats = {
        'rows': row_count,
        'columns': col_count,
        'features_count': len(feature_cols),
        'target_column': target_col,
        'classes': {str(k): int(v) for k, v in class_counts.items()},
        'missing_values_total': int(df.isnull().sum().sum()),
        'duplicate_rows': int(dup_count)
    }

    is_valid = len(errors) == 0
    return is_valid, errors, warnings, stats

def validate_csv_text(csv_text, target_col=None):
    """Parses raw CSV string and runs dataset validation."""
    try:
        df = pd.read_csv(io.StringIO(csv_text))
    except Exception as e:
        return False, [f"Failed to parse CSV: {str(e)}"], [], {}
    return validate_dataset(df, target_col)
