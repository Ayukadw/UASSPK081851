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
    
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    is_valid_password = False
    
    # 1. Coba verifikasi dengan Bcrypt (Akan error jika masih teks biasa)
    try:
        is_valid_password = security.verify_password(form_data.password, user.password)
    except ValueError:
        # passlib melempar ValueError jika mendeteksi password bukan hash
        pass
        
    # 2. Jika verifikasi Bcrypt gagal, cek apakah ini dummy data (teks biasa)
    if not is_valid_password:
        if user.password == form_data.password:
            # Lakukan migrasi secara diam-diam (Silent Migration)
            user.password = security.get_password_hash(form_data.password)
            db.commit()
            is_valid_password = True # Beri izin masuk
        else:
            raise HTTPException(status_code=400, detail="Incorrect username or password")
            
    # 3. Buat token JWT
    token = security.create_access_token({"sub": str(user.id), "role": user.role.value})
    
    # 4. Catat ke SystemLog
    db.add(SystemLog(user_id=user.id, action="Logged in"))
    db.commit()
    
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user: User = Depends(dependencies.get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "role": current_user.role}