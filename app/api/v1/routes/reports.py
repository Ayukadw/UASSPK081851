from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, RoleChecker
from app.reports.exporter import generate_excel_report, generate_pdf_report

# Import model yang dibutuhkan langsung ke sini
from app.models.all_models import MarcosResult, Alternative

router = APIRouter()
allow_export = RoleChecker(["Data_Admin", "IT_Admin", "Manager"])

# Buat fungsi khusus di sini agar tidak bergantung pada file marcos.py
def _get_export_data(db: Session):
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

@router.get("/excel")
def export_excel(db: Session = Depends(get_db), current_user = Depends(allow_export)):
    try:
        ranking_data = _get_export_data(db)
        
        if not ranking_data:
            raise HTTPException(status_code=400, detail="Data ranking belum ada. Harap lakukan kalkulasi MARCOS terlebih dahulu.")
            
        file_stream = generate_excel_report(ranking_data)
        
        headers = {'Content-Disposition': 'attachment; filename="Laporan_Peringkat_MARCOS.xlsx"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pdf")
def export_pdf(db: Session = Depends(get_db), current_user = Depends(allow_export)):
    try:
        ranking_data = _get_export_data(db)
        
        if not ranking_data:
            raise HTTPException(status_code=400, detail="Data ranking belum ada. Harap lakukan kalkulasi MARCOS terlebih dahulu.")
            
        file_stream = generate_pdf_report(ranking_data)
        
        headers = {'Content-Disposition': 'attachment; filename="Laporan_Peringkat_MARCOS.pdf"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/pdf')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))