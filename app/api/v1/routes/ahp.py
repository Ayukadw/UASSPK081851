from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict
from pydantic import BaseModel
from app.core.dependencies import get_db, RoleChecker
from app.models.all_models import Criteria, SystemLog
from app.schemas.all_schemas import AHPMatrixInput
from app.algorithms.ahp import calculate_ahp


router = APIRouter()

# 1. BATASI AKSES: Hanya role Verificator (dan IT_Admin) yang boleh mengakses fitur ini
allow_verificator = RoleChecker(["Verificator", "IT_Admin"])

# Schema untuk Finalisasi Bobot
class AHPFinalizeInput(BaseModel):
    weights: Dict[int, float]

# ==========================================
# FITUR 1: Input Perbandingan & Validasi CR
# ==========================================
@router.post("/matrix")
def calculate_ahp_matrix(
    data: AHPMatrixInput, 
    db: Session = Depends(get_db), 
    current_user = Depends(allow_verificator)
):
    criteria = db.query(Criteria).order_by(Criteria.id).all()
    if not criteria:
        raise HTTPException(status_code=404, detail="Data kriteria kosong.")
    
    # Ambil ID dari database dan jadikan string
    criteria_ids = [str(c.id) for c in criteria]
    
    # Standardisasi payload Pydantic agar semua key mutlak menjadi string
    matrix_payload = {
        str(k1): {str(k2): float(v2) for k2, v2 in v1.items()} 
        for k1, v1 in data.matrix.items()
    }

    # 1. VALIDASI LAPIS 1: Kelengkapan Dimensi (N x N)
    for cid in criteria_ids:
        if cid not in matrix_payload:
            raise HTTPException(status_code=400, detail=f"Kriteria ID {cid} hilang dari baris matriks.")
        for cid_col in criteria_ids:
            if cid_col not in matrix_payload[cid]:
                raise HTTPException(status_code=400, detail=f"Kriteria ID {cid_col} hilang dari kolom matriks.")

    # 2. VALIDASI LAPIS 2: Integritas Matematis AHP (Diagonal & Reciprocal)
    for i in criteria_ids:
        for j in criteria_ids:
            val_ij = float(matrix_payload[i][j])
            val_ji = float(matrix_payload[j][i])
            
            # Cek Diagonal Utama
            if i == j and val_ij != 1.0:
                raise HTTPException(status_code=400, detail=f"Integritas gagal: Nilai {i} vs {i} harus 1.0")
            
            # Cek Konsistensi Timbal Balik dengan toleransi pembulatan (0.01)
            if i != j:
                expected_ji = 1.0 / val_ij
                if abs(val_ji - expected_ji) > 0.05:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Manipulasi terdeteksi pada {i} vs {j}. Diharapkan {expected_ji}, tapi menerima {val_ji}"
                    )
                
        db.add(SystemLog(
        user_id=current_user.id, 
        action=f"Verificator {current_user.username} melakukan kalkulasi matriks AHP"
        ))
        db.commit()

    # 3. PROSES ALGORITMA (Jika semua inspeksi keamanan lolos)
    try:
        result = calculate_ahp(matrix_payload, [int(c) for c in criteria_ids])
        return {
            "message": "Matriks lolos inspeksi keamanan matematis. Perhitungan AHP berhasil.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Kesalahan internal AHP: {str(e)}")


# ==========================================
# FITUR 2: Finalisasi (Lock) Bobot
# ==========================================
@router.post("/finalize")
def finalize_ahp(
    data: AHPFinalizeInput, 
    db: Session = Depends(get_db), 
    current_user = Depends(allow_verificator)
):
    try:
        # Loop hasil bobot dan Update ke tabel Criteria
        for crit_id, weight in data.weights.items():
            db.query(Criteria).filter(Criteria.id == crit_id).update({"weight": weight})
        
        # Catat aktivitas di System Log untuk audit trail
        db.add(SystemLog(
            user_id=current_user.id, 
            action="Finalized AHP weights (Locked)"
        ))
        db.commit()
        
        return {"message": "Bobot AHP berhasil dikunci dan siap digunakan oleh Petugas Data!"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal mengunci bobot: {str(e)}")