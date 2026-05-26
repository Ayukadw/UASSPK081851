from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.core import security, dependencies
from app.models.all_models import User, SystemLog

router = APIRouter()

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(dependencies.get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password):
        # Migrasi pass plain ke hash (sesuai catatan Anda)
        if user and user.password == form_data.password:
            user.password = security.get_password_hash(form_data.password)
            db.commit()
        else:
            raise HTTPException(status_code=400, detail="Incorrect username or password")
            
    token = security.create_access_token({"sub": str(user.id), "role": user.role.value})
    
    db.add(SystemLog(user_id=user.id, action="Logged in"))
    db.commit()
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: User = Depends(dependencies.get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "role": current_user.role}