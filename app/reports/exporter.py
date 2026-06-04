import io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

def generate_excel_report(ranking_data: list):
    output = io.BytesIO()
    df = pd.DataFrame(ranking_data)
    
    # Hapus kolom yang terlalu teknis agar laporan bos/manajer bersih
    df.drop(columns=['alternative_id', 'f_i_plus', 'f_i_minus'], inplace=True, errors='ignore')
    
    # Ubah nama header untuk Excel
    df.rename(columns={
        'rank': 'Peringkat',
        'alternative_name': 'Nama Alternatif',
        'k_i_minus': 'Utilitas Anti-Ideal (K-)',
        'k_i_plus': 'Utilitas Ideal (K+)',
        'score': 'Fungsi Utilitas Akhir (f)'
    }, inplace=True)
    
    # Urutkan posisi kolom
    df = df[['Peringkat', 'Nama Alternatif', 'Fungsi Utilitas Akhir (f)', 'Utilitas Anti-Ideal (K-)', 'Utilitas Ideal (K+)']]
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Laporan MARCOS', index=False)
    output.seek(0)
    return output

def generate_pdf_report(ranking_data: list):
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.alignment = 1
    elements.append(Paragraph("Laporan Hasil Peringkat Strategi (MARCOS)", title_style))
    elements.append(Spacer(1, 20))
    
    # Header Tabel PDF (Sekarang menggunakan Nama Alternatif)
    table_data = [["Peringkat", "Nama Alternatif", "Nilai Akhir (f)"]]
    
    for row in ranking_data:
        table_data.append([
            str(row['rank']), 
            str(row['alternative_name']), 
            str(round(row['score'], 4))
        ])
        
    t = Table(table_data, colWidths=[100, 200, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#013236")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 12),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    
    elements.append(t)
    doc.build(elements)
    output.seek(0)
    return output