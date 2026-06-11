from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core import dependencies
# Ganti Criteria dengan nama model yang tepat di all_models.py milikmu
from app.models.all_models import Criteria 

router = APIRouter()

@router.get("/")
def get_criteria(db: Session = Depends(dependencies.get_db)):
    criteria_list = db.query(Criteria).all()
    return criteria_list

@router.post("/")
def create_criteria(criteria_data: dict, db: Session = Depends(dependencies.get_db)):
    # Sesuaikan dengan field di database-mu (contoh: code, name, type, weight)
    new_criteria = Criteria(**criteria_data)
    db.add(new_criteria)
    db.commit()
    db.refresh(new_criteria)
    return new_criteria

@router.put("/{criteria_id}")
def update_criteria(criteria_id: int, criteria_data: dict, db: Session = Depends(dependencies.get_db)):
    criteria = db.query(Criteria).filter(Criteria.id == criteria_id).first()
    if not criteria:
        raise HTTPException(status_code=404, detail="Kriteria tidak ditemukan")
    
    # Update data sesuai yang dikirim frontend
    if "code" in criteria_data:
        criteria.code = criteria_data["code"]
    if "name" in criteria_data:
        criteria.name = criteria_data["name"]
    if "type" in criteria_data:
        criteria.type = criteria_data["type"]
    if "unit" in criteria_data:
        criteria.unit = criteria_data["unit"]
        
    db.commit()
    db.refresh(criteria)
    return criteria

@router.delete("/{criteria_id}")
def delete_criteria(criteria_id: int, db: Session = Depends(dependencies.get_db)):
    criteria = db.query(Criteria).filter(Criteria.id == criteria_id).first()
    if not criteria:
        raise HTTPException(status_code=404, detail="Kriteria tidak ditemukan")
    
    try:
        db.delete(criteria)
        db.commit()
        return {"message": "Kriteria berhasil dihapus"}
    except IntegrityError:
        # Batalkan transaksi jika kriteria ini sudah dipakai di tabel perhitungan
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Gagal menghapus! Kriteria ini sudah digunakan dalam perhitungan Matriks AHP/MARCOS."
        )