import pandas as pd
import numpy as np

def calculate_marcos(decision_data, criteria_data):
    """
    decision_data: list of dicts [{'alt_id': X, 'crit_id': Y, 'value': Z}]
    criteria_data: dict { crit_id: {'weight': W, 'type': 'Cost'/'Benefit'} }
    """
    df = pd.DataFrame(decision_data)
    matrix = df.pivot(index='alt_id', columns='crit_id', values='value')
    
    # 1. Extended Initial Matrix (Ideal AI, Anti-Ideal AAI)
    ai = {}
    aai = {}
    for c_id in matrix.columns:
        c_type = criteria_data[c_id]['type']
        if c_type == 'Benefit':
            ai[c_id] = matrix[c_id].max()
            aai[c_id] = matrix[c_id].min()
        else: # Cost
            ai[c_id] = matrix[c_id].min()
            aai[c_id] = matrix[c_id].max()
            
    matrix.loc['AI'] = pd.Series(ai)
    matrix.loc['AAI'] = pd.Series(aai)
    
    # 2. Normalization
    norm_matrix = pd.DataFrame(index=matrix.index, columns=matrix.columns)
    for c_id in matrix.columns:
        c_type = criteria_data[c_id]['type']
        if c_type == 'Benefit':
            norm_matrix[c_id] = matrix[c_id] / matrix.loc['AI', c_id]
        else:
            norm_matrix[c_id] = matrix.loc['AI', c_id] / matrix[c_id]
            
    # 3. Weighted Matrix
    weights = pd.Series({c_id: criteria_data[c_id]['weight'] for c_id in matrix.columns})
    weighted_matrix = norm_matrix * weights
    
    # 4. Utility degrees
    S = weighted_matrix.sum(axis=1)
    K_minus = S / S['AAI']
    K_plus = S / S['AI']
    
    # 5. Utility functions
    # f(K-) = K+ / (K+ + K-)
    f_K_minus = K_plus / (K_plus + K_minus)
    # f(K+) = K- / (K+ + K-)
    f_K_plus = K_minus / (K_plus + K_minus)
    
    # 6. Overall Utility f(K)
    # Formula: (K+ + K-) / (1 + (1-f(K+))/f(K+) + (1-f(K-))/f(K-))
    # Simplified: (K+ + K-) / (1 + K-/K+ + K+/K-)
    denom = 1 + (K_minus / K_plus) + (K_plus / K_minus)
    f_K = (K_plus + K_minus) / denom
    
    # Format result (exclude AI and AAI)
    results = []
    alt_ids = [idx for idx in f_K.index if idx not in ['AI', 'AAI']]
    for alt_id in alt_ids:
        results.append({
            "alternative_id": alt_id,
            "utility_k_minus": float(K_minus[alt_id]),
            "utility_k_plus": float(K_plus[alt_id]),
            "utility_f": float(f_K[alt_id])
        })
        
    # Sort and rank
    results.sort(key=lambda x: x['utility_f'], reverse=True)
    for i, res in enumerate(results):
        res['ranking'] = i + 1
        
    return results