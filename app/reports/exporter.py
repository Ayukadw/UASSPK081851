import pandas as pd
from sqlalchemy.orm import Session
from app.models.all_models import MarcosResult, Alternative
import io

def generate_excel_report(db: Session):
    results = db.query(MarcosResult, Alternative).join(Alternative).order_by(MarcosResult.ranking).all()
    
    data = []
    for m, a in results:
        data.append({
            "Ranking": m.ranking,
            "Kode Strategi": a.code,
            "Nama Strategi": a.name,
            "Utility (K-)": m.utility_k_minus,
            "Utility (K+)": m.utility_k_plus,
            "Nilai Preferensi f(K)": m.utility_f
        })
        
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Hasil MARCOS')
    output.seek(0)
    return output