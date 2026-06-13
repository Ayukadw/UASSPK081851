from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.core.dependencies import get_db, RoleChecker
from app.models.all_models import Alternative, DecisionMatrix, Criteria, SystemLog

router = APIRouter()

# Pembatasan Hak Akses (RBAC)
# Hanya Data Admin dan IT Admin yang boleh memanipulasi data alternatif
allow_data_admin = RoleChecker(["Data_Admin", "IT_Admin"])
allow_all_authenticated = RoleChecker(["Data_Admin", "IT_Admin", "Verifikator", "Manager"])

# ==========================================
# PYDANTIC SCHEMAS (VALIDASI INPUT FRONTEND)
# ==========================================
class AlternativeCreate(BaseModel):
    code: str  # <-- TAMBAHAN BARU: Wajib diisi (Contoh: "A1")
    name: str
    description: str | None = None

class AlternativeResponse(BaseModel):
    id: int
    code: str  # <-- TAMBAHAN BARU
    name: str
    description: str | None

    class Config:
        from_attributes = True


# ==========================================
# ENDPOINTS CRUD ALTERNATIF
# ==========================================

# 1. READ ALL (Ambil Semua Data Alternatif)
@router.get("/", response_model=List[AlternativeResponse])
def get_all_alternatives(db: Session = Depends(get_db)):
    return db.query(Alternative).order_by(Alternative.id.asc()).all()


# 2. READ SINGLE (Ambil 1 Data Alternatif Berdasarkan ID)
@router.get("/{alt_id}", response_model=AlternativeResponse)
def get_alternative_by_id(alt_id: int, db: Session = Depends(get_db)):
    alt = db.query(Alternative).filter(Alternative.id == alt_id).first()
    if not alt:
        raise HTTPException(status_code=404, detail="Data alternatif tidak ditemukan.")
    return alt


# 3. CREATE (Tambah Alternatif Baru)
@router.post("/", response_model=AlternativeResponse, status_code=status.HTTP_201_CREATED)
def create_alternative(
    payload: AlternativeCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(allow_data_admin)
):
    # Cek apakah kode alternatif sudah ada
    existing_code = db.query(Alternative).filter(Alternative.code == payload.code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail=f"Kode alternatif '{payload.code}' sudah terdaftar.")

    # Cek apakah nama alternatif sudah ada
    existing_name = db.query(Alternative).filter(Alternative.name == payload.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail=f"Alternatif '{payload.name}' sudah terdaftar.")
    
    # 1. Tambah Alternatif Baru DENGAN CODE
    new_alt = Alternative(
        code=payload.code, 
        name=payload.name, 
        description=payload.description
    )
    db.add(new_alt)
    db.commit()
    db.refresh(new_alt)

    # 2. OTOMATISASI MATRIKS KEPUTUSAN:
    all_criteria = db.query(Criteria).all()
    for item_criteria in all_criteria:
        db.add(DecisionMatrix(
            alternative_id=new_alt.id,
            criteria_id=item_criteria.id,
            value=0.0
        ))
    
    db.add(SystemLog(user_id=current_user.id, action=f"Created Alternative: [{new_alt.code}] {new_alt.name}"))
    db.commit()
    
    return new_alt

# 4. UPDATE (Ubah Data Alternatif)
@router.put("/{alt_id}", response_model=AlternativeResponse)
def update_alternative(
    alt_id: int, 
    payload: AlternativeCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(allow_data_admin)
):
    alt = db.query(Alternative).filter(Alternative.id == alt_id).first()
    if not alt:
        raise HTTPException(status_code=404, detail="Data alternatif tidak ditemukan.")
    
    alt.code = payload.code # <-- Update kode juga
    alt.name = payload.name
    alt.description = payload.description
    
    db.add(SystemLog(user_id=current_user.id, action=f"Updated Alternative ID {alt_id}"))
    db.commit()
    db.refresh(alt)
    return alt


# 5. DELETE (Hapus Data Alternatif)
@router.delete("/{alt_id}")
def delete_alternative(
    alt_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(allow_data_admin)
):
    alt = db.query(Alternative).filter(Alternative.id == alt_id).first()
    if not alt:
        raise HTTPException(status_code=404, detail="Data alternatif tidak ditemukan.")
    
    # Hapus data ketergantungan (Cascade manual) pada matriks keputusan agar database tidak error
    db.query(DecisionMatrix).filter(DecisionMatrix.alternative_id == alt_id).delete()
    
    db.delete(alt)
    db.add(SystemLog(user_id=current_user.id, action=f"Deleted Alternative: {alt.name}"))
    db.commit()
    
    return {"success": True, "message": f"Alternatif '{alt.name}' beserta data matriksnya berhasil dihapus."}