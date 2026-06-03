from fastapi import APIRouter, Depends, HTTPException
from app.core import security
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core import dependencies
from app.models.all_models import User
from typing import Optional
# from app.schemas import UserResponse, UserCreate (Aktifkan jika temanmu memisah schema ke file terpisah)

router = APIRouter()

@router.get("/")
def get_users(db: Session = Depends(dependencies.get_db)):
    users = db.query(User).all()
    return users

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(dependencies.get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}
    except IntegrityError:
        # Batalkan transaksi jika terjadi error relasi database
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Gagal menghapus! User ini tidak bisa dihapus karena masih terhubung dengan data lain (misalnya data Log aktivitas)."
        )

@router.post("/")
def create_user(user_in: dict, db: Session = Depends(dependencies.get_db)):
    # Hash password sebelum disimpan ke database
    hashed_password = security.get_password_hash(user_in["password"])
    
    new_user = User(
        username=user_in["username"],
        password=hashed_password,
        role=user_in["role"],
        # full_name=user_in.get("full_name", "") # Buka komentar ini jika ada field full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}")
def update_user(user_id: int, user_in: dict, db: Session = Depends(dependencies.get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update field yang dikirim dari frontend
    if "username" in user_in:
        user.username = user_in["username"]
    if "role" in user_in:
        user.role = user_in["role"]
    if "password" in user_in and user_in["password"]:
        # Jika admin mengganti password, hash ulang password barunya
        user.password = security.get_password_hash(user_in["password"])
        
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/reset-password")
def reset_password(user_id: int, payload: Optional[dict] = None, db: Session = Depends(dependencies.get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cek apakah frontend mengirimkan password spesifik di payload. 
    # Jika tidak ada (kosong), kita set password ke default (misal: "password123")
    new_password = "password123"
    if payload and "password" in payload:
        new_password = payload["password"]
        
    # Hash password baru dan simpan
    user.password = security.get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password berhasil di-reset", "default_password": new_password}