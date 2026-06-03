from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, RoleChecker
from app.models.all_models import Criteria, DecisionMatrix, MarcosResult, AHPStatus, SystemLog, Alternative
from app.algorithms.marcos import calculate_marcos

router = APIRouter()
allow_data_admin = RoleChecker(["Data_Admin", "IT_Admin"])


def _serialize_marcos_results(db: Session) -> list[dict]:
    rows = (
        db.query(MarcosResult)
        .join(Alternative, MarcosResult.alternative_id == Alternative.id)
        .order_by(MarcosResult.ranking.asc())
        .all()
    )
    return [
        {
            "alternative_id": row.alternative_id,
            "alternative_name": row.alternative.name,
            "score": row.utility_f,
            "rank": row.ranking,
            "k_i_plus": row.utility_k_plus,
            "k_i_minus": row.utility_k_minus,
            "f_i_plus": row.utility_k_plus,
            "f_i_minus": row.utility_k_minus,
        }
        for row in rows
    ]


@router.get("/ranking")
def get_marcos_ranking(db: Session = Depends(get_db)):
    return {"success": True, "data": _serialize_marcos_results(db)}


@router.get("/result")
def get_marcos_result(db: Session = Depends(get_db)):
    return {"success": True, "data": _serialize_marcos_results(db)}

@router.post("/calculate")
def calculate_marcos_route(db: Session = Depends(get_db), current_user = Depends(allow_data_admin)):
    ahp_status = db.query(AHPStatus).first()
    if not ahp_status or not ahp_status.is_locked:
        raise HTTPException(status_code=400, detail="AHP weights are not finalized yet.")
        
    c_data = db.query(Criteria).all()
    if not c_data: raise HTTPException(status_code=400, detail="No criteria found")
    crit_dict = {c.id: {'weight': c.weight, 'type': c.type.value} for c in c_data}
    
    d_data = db.query(DecisionMatrix).all()
    if not d_data: raise HTTPException(status_code=400, detail="Decision matrix is empty")
    dec_list = [{'alt_id': d.alternative_id, 'crit_id': d.criteria_id, 'value': d.value} for d in d_data]
    
    # Calculate
    results = calculate_marcos(dec_list, crit_dict)
    
    # Save to DB (Clear old results first)
    db.query(MarcosResult).delete()
    for res in results:
        db.add(MarcosResult(**res))
        
    db.add(SystemLog(user_id=current_user.id, action="Calculated MARCOS"))
    db.commit()
    
    return {"message": "MARCOS calculation successful", "data": results}