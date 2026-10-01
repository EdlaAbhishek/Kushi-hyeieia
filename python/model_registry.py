"""
Model Registry & Experiment Versioning for Healthcare QML.
Stores complete experiment parameters, seeds, dataset versions,
metrics, and circuit configurations to ensure 100% reproducibility.
"""

import os
import json
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY_DIR = os.path.join(BASE_DIR, 'database', 'quantum_models')
os.makedirs(REGISTRY_DIR, exist_ok=True)

INDEX_FILE = os.path.join(REGISTRY_DIR, 'experiments_index.json')

def save_experiment_record(exp_data):
    """Saves a completed experiment to the persistent model registry."""
    exp_id = exp_data.get('id') or f"exp_{int(time.time())}_{os.urandom(3).hex()}"
    exp_data['id'] = exp_id
    exp_data['timestamp'] = exp_data.get('timestamp') or time.strftime('%Y-%m-%d %H:%M:%S')
    exp_data['model_version'] = '1.0.0'

    file_path = os.path.join(REGISTRY_DIR, f"{exp_id}.json")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(exp_data, f, indent=2)

    # Update summary index
    index = get_all_experiments()
    summary_entry = {
        'id': exp_id,
        'timestamp': exp_data['timestamp'],
        'dataset_id': exp_data.get('dataset_id', 'custom'),
        'dataset_name': exp_data.get('dataset_name', 'Dataset'),
        'classical_model': exp_data.get('classical_evaluation', {}).get('model_name', 'Classical'),
        'quantum_model': exp_data.get('quantum_evaluation', {}).get('model_name', 'QSVC'),
        'qubits': exp_data.get('dataset_info', {}).get('quantum_qubits', 4),
        'classical_accuracy': exp_data.get('classical_evaluation', {}).get('metrics', {}).get('accuracy'),
        'quantum_accuracy': exp_data.get('quantum_evaluation', {}).get('metrics', {}).get('accuracy'),
        'backend': exp_data.get('backend', 'Qiskit Aer'),
        'status': 'completed'
    }
    
    # Prepend
    index = [summary_entry] + [item for item in index if item.get('id') != exp_id]
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index[:50], f, indent=2)

    return exp_id

def get_all_experiments():
    """Returns the index list of saved experiments."""
    if not os.path.exists(INDEX_FILE):
        return []
    try:
        with open(INDEX_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def get_experiment_by_id(exp_id):
    """Retrieves full experiment configuration and evaluation results."""
    file_path = os.path.join(REGISTRY_DIR, f"{exp_id}.json")
    if not os.path.exists(file_path):
        return None
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)
