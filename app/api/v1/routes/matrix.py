from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict
from app.core.dependencies import get_db, RoleChecker
from app.models.all_models import DecisionMatrix, SystemLog

router = APIRouter()

# Hak akses hanya untuk pengelola data
allow_data_admin = RoleChecker(["Data_Admin", "IT_Admin"])

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================
class MatrixValueInput(BaseModel):
    alternative_id: int
    criteria_id: int
    value: float

class BulkMatrixUpdate(BaseModel):
    matrix_data: List[MatrixValueInput]


# ==========================================
# ENDPOINTS MATRIKS KEPUTUSAN
# ==========================================

# 1. READ (Ambil Data Matriks Keputusan untuk ditampilkan di Tabel UI)
@router.get("/")
def get_decision_matrix(db: Session = Depends(get_db)):
    """
    Endpoint ini mengambil seluruh nilai matriks yang ada di database.
    Frontend bisa menggunakan data ini untuk mengisi nilai awal (default 0) di tabel.
    """
    matrix_items = db.query(DecisionMatrix).all()
    
    # Format respon yang ramah untuk Frontend
    result = []
    for item in matrix_items:
        result.append({
            "alternative_id": item.alternative_id,
            "criteria_id": item.criteria_id,
            "value": item.value
        })
        
    return {"success": True, "data": result}


# 2. UPDATE (Simpan Nilai dari Tombol "Simpan Nilai")
@router.put("/bulk-update")
def update_decision_matrix_bulk(
    payload: BulkMatrixUpdate, 
    db: Session = Depends(get_db), 
    current_user = Depends(allow_data_admin)
):
    """
    Endpoint ini menerima Array berisi kumpulan nilai dari tabel UI 
    lalu memperbaruinya ke database sekaligus (Bulk Update).
    """
    updated_count = 0
    
    for item in payload.matrix_data:
        # Cari sel tabel (pertemuan alternatif dan kriteria) yang mau diupdate
        db_cell = db.query(DecisionMatrix).filter(
            DecisionMatrix.alternative_id == item.alternative_id,
            DecisionMatrix.criteria_id == item.criteria_id
        ).first()
        
        if db_cell:
            db_cell.value = item.value
            updated_count += 1
        else:
            # Jika sel belum ada, buat baru (sebagai backup pengaman)
            new_cell = DecisionMatrix(
                alternative_id=item.alternative_id,
                criteria_id=item.criteria_id,
                value=item.value
            )
            db.add(new_cell)
            updated_count += 1
            
    # Catat log aktivitas
    db.add(SystemLog(
        user_id=current_user.id, 
        action=f"Bulk updated {updated_count} matrix values."
    ))
    
    db.commit()
    
    return {
        "success": True, 
        "message": f"Berhasil menyimpan {updated_count} nilai matriks keputusan."
    }