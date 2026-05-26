from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, RoleChecker
from app.models.all_models import Criteria, AHPStatus, SystemLog
from app.schemas.all_schemas import AHPMatrixInput
from app.algorithms.ahp import calculate_ahp
from datetime import datetime

router = APIRouter()
allow_verificator = RoleChecker(["Verificator", "IT_Admin"])

@router.post("/matrix")
def input_ahp_matrix(data: AHPMatrixInput, db: Session = Depends(get_db), current_user = Depends(allow_verificator)):
    status = db.query(AHPStatus).first()
    if status and status.is_locked:
        raise HTTPException(status_code=400, detail="AHP is locked. Cannot modify matrix.")
        
    criteria_ids = [c.id for c in db.query(Criteria).order_by(Criteria.id).all()]
    result = calculate_ahp(data.matrix, criteria_ids)
    
    if not status:
        status = AHPStatus()
        db.add(status)
        
    status.matrix_data = data.matrix
    status.cr_value = result['cr']
    db.commit()
    
    return result

@router.post("/finalize")
def finalize_ahp(db: Session = Depends(get_db), current_user = Depends(allow_verificator)):
    status = db.query(AHPStatus).first()
    if not status or status.cr_value is None:
        raise HTTPException(status_code=400, detail="No AHP data found")
    if status.cr_value >= 0.1:
        raise HTTPException(status_code=400, detail="CR is >= 0.1. Cannot finalize.")
        
    # Re-calculate to save weights to DB
    criteria_ids = [c.id for c in db.query(Criteria).order_by(Criteria.id).all()]
    result = calculate_ahp(status.matrix_data, criteria_ids)
    
    for c_id, weight in result['weights'].items():
        db.query(Criteria).filter(Criteria.id == c_id).update({"weight": weight})
        
    status.is_locked = True
    status.locked_by = current_user.id
    status.locked_at = datetime.utcnow()
    
    db.add(SystemLog(user_id=current_user.id, action="Finalized AHP Weights"))
    db.commit()
    return {"message": "AHP weights locked successfully"}