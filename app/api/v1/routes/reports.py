from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, RoleChecker
from app.reports.exporter import generate_excel_report, generate_pdf_report

# IMPORT fungsi pengambil data dari marcos.py
from app.api.v1.routes.marcos import _serialize_marcos_results

router = APIRouter()
allow_export = RoleChecker(["Data_Admin", "IT_Admin", "Manager"])

@router.get("/excel")
def export_excel(db: Session = Depends(get_db), current_user = Depends(allow_export)):
    try:
        # 1. Ambil data ranking yang sudah tersimpan di tabel MarcosResult
        ranking_data = _serialize_marcos_results(db)
        
        if not ranking_data:
            raise HTTPException(status_code=400, detail="Data ranking belum ada. Harap lakukan kalkulasi MARCOS terlebih dahulu.")
            
        # 2. Cetak ke Excel
        file_stream = generate_excel_report(ranking_data)
        
        headers = {'Content-Disposition': 'attachment; filename="Laporan_Peringkat_MARCOS.xlsx"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pdf")
def export_pdf(db: Session = Depends(get_db), current_user = Depends(allow_export)):
    try:
        # Lakukan hal yang sama untuk PDF
        ranking_data = _serialize_marcos_results(db)
        
        if not ranking_data:
            raise HTTPException(status_code=400, detail="Data ranking belum ada. Harap lakukan kalkulasi MARCOS terlebih dahulu.")
            
        file_stream = generate_pdf_report(ranking_data)
        
        headers = {'Content-Disposition': 'attachment; filename="Laporan_Peringkat_MARCOS.pdf"'}
        return StreamingResponse(file_stream, headers=headers, media_type='application/pdf')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))