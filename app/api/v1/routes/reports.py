from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.dependencies import get_db
from app.reports.exporter import generate_excel_report, generate_pdf_report

# Import model dan fungsi otak hitung dari marcos.py
from app.models.all_models import MarcosResult, Alternative
from app.api.v1.routes.marcos import _process_marcos_steps

router = APIRouter()

# Schema untuk menangkap payload nilai slider dari Frontend
class CustomWeightReport(BaseModel):
    criteria_id: int
    value: float

class ReportPayload(BaseModel):
    custom_weights: Optional[List[CustomWeightReport]] = None


def _get_report_data(db: Session, payload: Optional[ReportPayload] = None):
    # KONDISI A: Jika diakses oleh user publik (Mengirimkan payload slider)
    if payload and payload.custom_weights:
        total_slider = sum([item.value for item in payload.custom_weights])
        if total_slider == 0:
            raise HTTPException(status_code=400, detail="Total bobot kriteria tidak boleh nol.")
            
        custom_weights_dict = {
            item.criteria_id: (item.value / total_slider) 
            for item in payload.custom_weights
        }
        
        # Hitung MARCOS secara langsung di memori untuk dicetak
        all_steps = _process_marcos_steps(db, custom_weights_dict=custom_weights_dict)
        ranking_list = all_steps["7"]
        
        return [
            {
                "rank": res["ranking"],
                "alternative_name": res["alternative_name"],
                "score": res["score"],
                "k_i_minus": res["utility_k_minus"],
                "k_i_plus": res["utility_k_plus"]
            }
            for res in ranking_list
        ]
    
    # KONDISI B: Jika tanpa payload (Ambil data peringkat resmi dari Database)
    else:
        rows = (
            db.query(MarcosResult)
            .join(Alternative, MarcosResult.alternative_id == Alternative.id)
            .order_by(MarcosResult.ranking.asc())
            .all()
        )
        return [
            {
                "rank": row.ranking,
                "alternative_name": row.alternative.name,
                "score": row.utility_f,
                "k_i_minus": row.utility_k_minus,
                "k_i_plus": row.utility_k_plus
            }
            for row in rows
        ]

# ==========================================
# ENDPOINTS EKSPOR LAPORAN (DENGAN POST)
# ==========================================

@router.post("/excel")
def export_excel(payload: Optional[ReportPayload] = None, db: Session = Depends(get_db)):
    try:
        ranking_data = _get_report_data(db, payload)
        
        if not ranking_data:
            raise HTTPException(status_code=400, detail="Data peringkat belum tersedia.")
            
        file_stream = generate_excel_report(ranking_data)
        headers = {'Content-Disposition': 'attachment; filename="Laporan_Peringkat_MARCOS.xlsx"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mencetak Excel: {str(e)}")


@router.post("/pdf")
def export_pdf(payload: Optional[ReportPayload] = None, db: Session = Depends(get_db)):
    try:
        ranking_data = _get_report_data(db, payload)
        
        if not ranking_data:
            raise HTTPException(status_code=400, detail="Data peringkat belum tersedia.")
            
        file_stream = generate_pdf_report(ranking_data)
        headers = {'Content-Disposition': 'attachment; filename="Laporan_Peringkat_MARCOS.pdf"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/pdf')
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mencetak PDF: {str(e)}")