import numpy as np

def calculate_ahp(matrix_data: dict, criteria_ids: list):
    """
    matrix_data: { crit_id_1: { crit_id_2: value, ... }, ... }
    Returns: dict of weights, CI, CR, is_valid
    """
    n = len(criteria_ids)
    matrix = np.ones((n, n))
    
    # Fill matrix
    for i, cid_row in enumerate(criteria_ids):
        for j, cid_col in enumerate(criteria_ids):
            if cid_row in matrix_data and str(cid_col) in matrix_data[str(cid_row)]:
                matrix[i, j] = matrix_data[str(cid_row)][str(cid_col)]
                matrix[j, i] = 1.0 / matrix[i, j] # Reciprocal

    # Normalize column
    col_sums = matrix.sum(axis=0)
    norm_matrix = matrix / col_sums
    
    # Calculate Weights (Row average)
    weights = norm_matrix.mean(axis=1)
    
    # Eigenvalue & CI & CR
    aw = np.dot(matrix, weights)
    lambda_max = (aw / weights).mean()
    ci = (lambda_max - n) / (n - 1) if n > 1 else 0
    
    ri_array = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49]
    ri = ri_array[n-1] if n <= 10 else 1.49
    cr = ci / ri if ri != 0 else 0
    
    weight_dict = {criteria_ids[i]: float(weights[i]) for i in range(n)}
    
    return {
        "weights": weight_dict,
        "ci": float(ci),
        "cr": float(cr),
        "is_valid": cr < 0.1
    }