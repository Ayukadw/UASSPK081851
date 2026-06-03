from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core import dependencies
# Ganti Alternative dengan nama model yang tepat
from app.models.all_models import Alternative 

router = APIRouter()

@router.get("/")
def get_alternatives(db: Session = Depends(dependencies.get_db)):
    alternatives = db.query(Alternative).all()
    return alternatives