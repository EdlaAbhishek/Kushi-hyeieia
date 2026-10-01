"""
Command-line Interface for the Healthcare QML System.
Invoked by Node.js API handlers or standalone terminal commands.
Communicates via standard JSON input and output.
"""

import sys
import json
import io
import os
import pandas as pd

# Add workspace directory to path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from python.dataset_registry import list_registered_datasets, get_dataset, DATASET_REGISTRY
from python.data_validator import validate_csv_text, validate_dataset
from python.pipeline import run_full_qml_pipeline
from python.model_registry import save_experiment_record, get_all_experiments, get_experiment_by_id
from python.inference import predict_single_patient

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Action argument required. Example: get_datasets, validate_csv, train, predict, history'}))
        sys.exit(1)
        
    action = sys.argv[1]
    
    # Read payload from 2nd argument (string JSON), or --payload-file
    payload = {}
    if len(sys.argv) >= 3:
        arg2 = sys.argv[2]
        if arg2.startswith('--file='):
            filepath = arg2.split('=', 1)[1]
            with open(filepath, 'r', encoding='utf-8') as f:
                payload = json.load(f)
        else:
            try:
                payload = json.loads(arg2)
            except Exception:
                payload = {}
    elif '--stdin' in sys.argv:
        try:
            raw_input = sys.stdin.read().strip()
            if raw_input:
                payload = json.loads(raw_input)
        except Exception as e:
            print(json.dumps({'error': f"Failed to parse JSON input: {str(e)}"}))
            sys.exit(1)

    try:
        if action == 'get_datasets':
            datasets = list_registered_datasets()
            print(json.dumps({'status': 'success', 'datasets': datasets}))

        elif action == 'validate_csv':
            csv_text = payload.get('csv_text', '')
            target_col = payload.get('target_col', None)
            is_valid, errors, warnings, stats = validate_csv_text(csv_text, target_col)
            print(json.dumps({
                'status': 'success' if is_valid else 'invalid',
                'is_valid': is_valid,
                'errors': errors,
                'warnings': warnings,
                'stats': stats
            }))

        elif action == 'train':
            dataset_id = payload.get('dataset_id', 'breast_cancer')
            custom_csv = payload.get('custom_csv', None)
            target_column = payload.get('target_column', None)

            if custom_csv:
                # Custom dataset path
                df = pd.read_csv(io.StringIO(custom_csv))
                is_valid, errors, _, _ = validate_dataset(df, target_column)
                if not is_valid:
                    print(json.dumps({'status': 'error', 'error': 'Dataset validation failed: ' + '; '.join(errors)}))
                    return
                target_col = target_column or df.columns[-1]
                meta = {'id': 'custom', 'name': payload.get('dataset_name', 'Custom Dataset')}
            else:
                # Verified dataset
                df, meta = get_dataset(dataset_id)
                target_col = meta['target_column']

            classical_model = payload.get('classical_model', 'logistic_regression')
            quantum_model = payload.get('quantum_model', 'qsvm')
            num_qubits = payload.get('num_qubits', meta.get('default_quantum_qubits', 4) if not custom_csv else 4)
            scaling = payload.get('scaling', meta.get('scaling_strategy', 'standard') if not custom_csv else 'standard')
            dim_reduction = payload.get('dim_reduction', meta.get('dimensionality_reduction', 'pca') if not custom_csv else 'pca')
            seed = payload.get('random_seed', 42)
            shots = payload.get('shots', 1024)

            result = run_full_qml_pipeline(
                df=df,
                target_column=target_col,
                dataset_metadata=meta if not custom_csv else None,
                classical_model_type=classical_model,
                quantum_model_type=quantum_model,
                num_qubits=num_qubits,
                dim_reduction_method=dim_reduction,
                scaling_method=scaling,
                feature_map_type=payload.get('feature_map', 'zz'),
                circuit_depth=payload.get('circuit_depth', 1),
                shots=shots,
                random_seed=seed
            )

            result['dataset_id'] = meta['id']
            result['dataset_name'] = meta.get('name', 'Dataset')

            # Save to model registry
            exp_id = save_experiment_record(result)
            result['experiment_id'] = exp_id
            print(json.dumps(result))

        elif action == 'predict':
            dataset_id = payload.get('dataset_id', 'breast_cancer')
            patient_features = payload.get('patient_features', {})
            model_type = payload.get('model_type', 'classical')
            res = predict_single_patient(dataset_id, patient_features, model_type)
            print(json.dumps(res))

        elif action == 'history':
            history = get_all_experiments()
            print(json.dumps({'status': 'success', 'history': history}))

        elif action == 'get_experiment':
            exp_id = payload.get('exp_id', '')
            exp = get_experiment_by_id(exp_id)
            if not exp:
                print(json.dumps({'status': 'error', 'error': f"Experiment '{exp_id}' not found."}))
            else:
                print(json.dumps({'status': 'success', 'experiment': exp}))

        else:
            print(json.dumps({'status': 'error', 'error': f"Unknown action: {action}"}))

    except Exception as e:
        import traceback
        print(json.dumps({'status': 'error', 'error': str(e), 'traceback': traceback.format_exc()}))
        sys.exit(1)

if __name__ == '__main__':
    main()
