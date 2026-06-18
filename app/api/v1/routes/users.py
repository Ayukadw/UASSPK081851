from fastapi import APIRouter, Depends, HTTPException
from app.core import security
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core import dependencies

# Import tambahan untuk Keamanan RBAC dan Pencatatan Log
from app.core.dependencies import RoleChecker
from app.models.all_models import User, SystemLog
from typing import Optional

router = APIRouter()

# Pembatasan Hak Akses: Manajemen User SANGAT KETAT HANYA untuk IT Admin
allow_it_admin = RoleChecker(["IT_Admin"])

@router.get("/")
def get_users(
    db: Session = Depends(dependencies.get_db), 
    current_user = Depends(allow_it_admin) # <-- Ditambahkan proteksi
):
    users = db.query(User).all()
    return users

@router.delete("/{user_id}")
def delete_user(
    user_id: int, 
    db: Session = Depends(dependencies.get_db),
    current_user = Depends(allow_it_admin) 
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # PROTEKSI: Cegah IT Admin menghapus akunnya sendiri
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="Tindakan ditolak: Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif."
        )
        
    username_deleted = user.username
    
    try:
        # ==========================================
        # SOLUSI: Bersihkan jejak relasi data (Cascade Delete)
        # Hapus semua log aktivitas yang pernah dilakukan oleh user ini
        # ==========================================
        db.query(SystemLog).filter(SystemLog.user_id == user_id).delete()
        
        # Setelah jejaknya bersih, baru hapus akun User-nya
        db.delete(user)
        
        # Catat ke log sistem siapa yang menghapus siapa
        db.add(SystemLog(
            user_id=current_user.id, 
            action=f"Deleted user account: {username_deleted} (ID: {user_id})"
        ))
        
        db.commit()
        return {"success": True, "message": f"Akun pengguna '{username_deleted}' berhasil dihapus permanen dari sistem."}
        
    except IntegrityError:
        # Jika masih ada relasi di tabel lain yang terlewat
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Gagal menghapus! User ini tidak bisa dihapus karena masih terhubung dengan data lain."
        )

@router.post("/")
def create_user(
    user_in: dict, 
    db: Session = Depends(dependencies.get_db),
    current_user = Depends(allow_it_admin) # <-- Ditambahkan proteksi
):
    # Hash password sebelum disimpan ke database
    hashed_password = security.get_password_hash(user_in["password"])
    
    new_user = User(
        username=user_in["username"],
        password=hashed_password,
        role=user_in["role"],
    )
    db.add(new_user)
    
    # Catat log aktivitas sistem
    db.add(SystemLog(user_id=current_user.id, action=f"Created user: {new_user.username} with role {new_user.role}"))
    
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}")
def update_user(
    user_id: int, 
    user_in: dict, 
    db: Session = Depends(dependencies.get_db),
    current_user = Depends(allow_it_admin) # <-- Ditambahkan proteksi
):
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
        
    # Catat log aktivitas
    db.add(SystemLog(user_id=current_user.id, action=f"Updated user ID {user_id}"))
    
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int, 
    payload: Optional[dict] = None, 
    db: Session = Depends(dependencies.get_db),
    current_user = Depends(allow_it_admin) # <-- Ditambahkan proteksi
):
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
    
    # Catat log aktivitas
    db.add(SystemLog(user_id=current_user.id, action=f"Reset password for user ID {user_id}"))
    
    db.commit()
    
    return {"message": "Password berhasil di-reset", "default_password": new_password}