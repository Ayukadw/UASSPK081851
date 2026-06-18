from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.core.dependencies import get_db, RoleChecker
from app.models.all_models import Criteria, DecisionMatrix, MarcosResult, AHPStatus, SystemLog, Alternative

router = APIRouter()
allow_data_admin = RoleChecker(["Data_Admin", "IT_Admin"])

# ==========================================
# PYDANTIC SCHEMAS UNTUK SIMULATOR PUBLIK
# ==========================================
class CustomWeight(BaseModel):
    criteria_id: int
    value: float  # Nilai dari slider 1-9 di Frontend

class SimulatorPayload(BaseModel):
    custom_weights: List[CustomWeight]

# ==========================================
# FUNGSI PEMROSES INTERNAL (OTAK HITUNG STEP-BY-STEP)
# Ditambahkan parameter 'custom_weights_dict' khusus untuk Simulasi
# ==========================================
def _process_marcos_steps(db: Session, custom_weights_dict: dict = None):
    # Jika BUKAN mode simulasi, pastikan AHP sudah dikunci Admin
    if not custom_weights_dict:
        ahp_status = db.query(AHPStatus).first()
        if not ahp_status or not ahp_status.is_locked:
            raise HTTPException(status_code=400, detail="AHP weights are not finalized yet.")

    alternatives = db.query(Alternative).all()
    criteria = db.query(Criteria).all()
    matrix_items = db.query(DecisionMatrix).all()

    if not alternatives or not criteria or not matrix_items:
        raise HTTPException(status_code=400, detail="Data kriteria, alternatif, atau matriks keputusan masih kosong.")

    # Susun matriks keputusan mentah awal
    matrix = {a.id: {c.id: 0.0 for c in criteria} for a in alternatives}
    for item in matrix_items:
        if item.alternative_id in matrix and item.criteria_id in matrix[item.alternative_id]:
            matrix[item.alternative_id][item.criteria_id] = float(item.value)

    step1 = {
        "alternatives": [{"id": a.id, "name": a.name} for a in alternatives],
        "criteria": [{"id": c.id, "name": c.name, "type": c.type.value} for c in criteria],
        "matrix": matrix
    }

    # TAHAP 2: Solusi Ideal (AI) & Anti-Ideal (AAI)
    ideal = {}
    anti_ideal = {}
    for c in criteria:
        vals = [matrix[a.id][c.id] for a in alternatives]
        if c.type.value.lower() == 'benefit':
            ideal[c.id] = max(vals)
            anti_ideal[c.id] = min(vals)
        else: # Cost
            ideal[c.id] = min(vals)
            anti_ideal[c.id] = max(vals)
    step2 = {"ideal": ideal, "anti_ideal": anti_ideal}

    # TAHAP 3: Normalisasi Matriks Keputusan
    norm_matrix = {a.id: {} for a in alternatives}
    norm_ideal = {}
    norm_anti_ideal = {}
    for c in criteria:
        x_id = ideal[c.id]
        x_aa = anti_ideal[c.id]
        if c.type.value.lower() == 'benefit':
            for a in alternatives:
                norm_matrix[a.id][c.id] = matrix[a.id][c.id] / x_aa if x_aa != 0 else 0
            norm_ideal[c.id] = x_id / x_aa if x_aa != 0 else 0
            norm_anti_ideal[c.id] = x_aa / x_aa if x_aa != 0 else 0
        else: # Cost
            for a in alternatives:
                norm_matrix[a.id][c.id] = x_id / matrix[a.id][c.id] if matrix[a.id][c.id] != 0 else 0
            norm_ideal[c.id] = x_id / x_id if x_id != 0 else 0
            norm_anti_ideal[c.id] = x_id / x_aa if x_aa != 0 else 0
    step3 = {"matrix": norm_matrix, "ideal": norm_ideal, "anti_ideal": norm_anti_ideal}

    # TAHAP 4: Normalisasi Terbobot (DISESUAIKAN UNTUK SIMULATOR)
    weighted_matrix = {a.id: {} for a in alternatives}
    weighted_ideal = {}
    weighted_anti_ideal = {}
    for c in criteria:
        # PENTING: Gunakan bobot simulasi jika ada, jika tidak gunakan bobot asli DB
        if custom_weights_dict and c.id in custom_weights_dict:
            w = custom_weights_dict[c.id]
        else:
            w = float(c.weight) if c.weight is not None else 0.0
            
        for a in alternatives:
            weighted_matrix[a.id][c.id] = norm_matrix[a.id][c.id] * w
        weighted_ideal[c.id] = norm_ideal[c.id] * w
        weighted_anti_ideal[c.id] = norm_anti_ideal[c.id] * w
    step4 = {"matrix": weighted_matrix, "ideal": weighted_ideal, "anti_ideal": weighted_anti_ideal}

    # TAHAP 5: Tingkat Utilitas Alternatif (Ki- & Ki+)
    s_alt = {a.id: sum(weighted_matrix[a.id][c.id] for c in criteria) for a in alternatives}
    s_aa = sum(weighted_anti_ideal[c.id] for c in criteria)
    s_id = sum(weighted_ideal[c.id] for c in criteria)
    
    ki_minus = {a.id: s_alt[a.id] / s_aa if s_aa != 0 else 0 for a in alternatives}
    ki_plus = {a.id: s_alt[a.id] / s_id if s_id != 0 else 0 for a in alternatives}
    step5 = {"s_alternatives": s_alt, "s_anti_ideal": s_aa, "s_ideal": s_id, "ki_minus": ki_minus, "ki_plus": ki_plus}

    # TAHAP 6: Fungsi Utilitas f(Ki)
    f_ki = {}
    for a in alternatives:
        km = ki_minus[a.id]
        kp = ki_plus[a.id]
        denom = kp + km
        f_km = kp / denom if denom != 0 else 0
        f_kp = km / denom if denom != 0 else 0
        
        term_p = (1 - f_kp) / kp if kp != 0 else 0
        term_m = (1 - f_km) / km if km != 0 else 0
        denom_final = 1 + term_p + term_m
        
        f_ki[a.id] = {
            "f_k_minus": f_km,
            "f_k_plus": f_kp,
            "f_final": (kp + km) / denom_final if denom_final != 0 else 0
        }
    step6 = f_ki

    # TAHAP 7: Perankingan Alternatif
    ranking_list = []
    for a in alternatives:
        ranking_list.append({
            "alternative_id": a.id,
            "alternative_name": a.name,
            "score": f_ki[a.id]["f_final"],
            "utility_k_minus": ki_minus[a.id],
            "utility_k_plus": ki_plus[a.id]
        })
    ranking_list.sort(key=lambda x: x["score"], reverse=True)
    for idx, item in enumerate(ranking_list):
        item["ranking"] = idx + 1
    step7 = ranking_list

    return {
        "1": step1, "2": step2, "3": step3, 
        "4": step4, "5": step5, "6": step6, "7": step7
    }

# ==========================================
# 7 ENDPOINTS STEP-BY-STEP PUBLIK (TETAP SAMA)
# ==========================================
@router.get("/step1-decision-matrix")
def get_step1(db: Session = Depends(get_db)): return {"success": True, "step": 1, "data": _process_marcos_steps(db)["1"]}
@router.get("/step2-ideal-solutions")
def get_step2(db: Session = Depends(get_db)): return {"success": True, "step": 2, "data": _process_marcos_steps(db)["2"]}
@router.get("/step3-normalized-matrix")
def get_step3(db: Session = Depends(get_db)): return {"success": True, "step": 3, "data": _process_marcos_steps(db)["3"]}
@router.get("/step4-weighted-matrix")
def get_step4(db: Session = Depends(get_db)): return {"success": True, "step": 4, "data": _process_marcos_steps(db)["4"]}
@router.get("/step5-utility-degrees")
def get_step5(db: Session = Depends(get_db)): return {"success": True, "step": 5, "data": _process_marcos_steps(db)["5"]}
@router.get("/step6-utility-functions")
def get_step6(db: Session = Depends(get_db)): return {"success": True, "step": 6, "data": _process_marcos_steps(db)["6"]}
@router.get("/step7-ranking")
def get_step7(db: Session = Depends(get_db)): return {"success": True, "step": 7, "data": _process_marcos_steps(db)["7"]}


# ==========================================
# 🚀 ENDPOINT BARU: SIMULATOR PUBLIK (TANPA LOGIN, TANPA SAVE DB)
# ==========================================
@router.post("/simulate")
def simulate_marcos_public(payload: SimulatorPayload, db: Session = Depends(get_db)):
    # 1. Konversi skala 1-9 dari slider menjadi bobot persentase (Total = 1.0)
    total_slider = sum([item.value for item in payload.custom_weights])
    if total_slider == 0:
        raise HTTPException(status_code=400, detail="Total bobot kriteria tidak boleh nol.")
        
    custom_weights_dict = {
        item.criteria_id: (item.value / total_slider) 
        for item in payload.custom_weights
    }
    
    # 2. Kalkulasi MARCOS menggunakan bobot baru (hanya di memori)
    all_steps = _process_marcos_steps(db, custom_weights_dict=custom_weights_dict)
    
    # 3. Kembalikan data langsung ke bar chart UI tanpa menyentuh db.commit()
    return {
        "success": True, 
        "message": "Simulasi berhasil dihitung!", 
        "data": all_steps["7"]
    }


# ==========================================
# ENDPOINT TRIGGER UTAMA (TERKUNCI UNTUK ADMIN DATA - SAVE DB)
# ==========================================
@router.post("/calculate")
def calculate_marcos_route(db: Session = Depends(get_db), current_user = Depends(allow_data_admin)):
    all_steps = _process_marcos_steps(db)
    final_ranking = all_steps["7"]
    
    db.query(MarcosResult).delete()
    for res in final_ranking:
        db.add(MarcosResult(
            alternative_id=res["alternative_id"],
            utility_k_minus=res["utility_k_minus"],
            utility_k_plus=res["utility_k_plus"],
            utility_f=res["score"],
            ranking=res["ranking"]
        ))
        
    db.add(SystemLog(user_id=current_user.id, action="Calculated MARCOS (Full Steps Verified)"))
    db.commit()
    
    return {"message": "Kalkulasi seluruh tahapan MARCOS sukses dan disimpan ke database!", "data": final_ranking}