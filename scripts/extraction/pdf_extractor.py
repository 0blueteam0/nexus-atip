# -*- coding: utf-8 -*-
import subprocess
import sys
import os

# pdftotext 사용하여 텍스트 추출 시도
pdf_files = [
    r"K:\문서화\보험개발원\data\붙임1. 입찰공고문_24시간 상시 통합보안관제.pdf",
    r"K:\문서화\보험개발원\data\붙임2. 제안요청서_24시간 상시 통합보안관제.pdf"
]

for pdf_path in pdf_files:
    print(f"\n{'='*60}")
    print(f"분석 중: {os.path.basename(pdf_path)}")
    print('='*60)
    
    # pypdf 다시 시도
    try:
        import pypdf
        with open(pdf_path, 'rb') as file:
            pdf = pypdf.PdfReader(file)
            print(f"총 페이지: {len(pdf.pages)}")
            
            # 모든 페이지 텍스트 추출
            full_text = ""
            for i, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text()
                    if text:
                        full_text += f"\n[페이지 {i+1}]\n{text}\n"
                except:
                    pass
            
            # 주요 키워드 검색
            keywords = [
                "평가", "배점", "SLA", "KPI", "자격", "요구사항", 
                "침해사고", "보안관제", "24시간", "365일", "교대",
                "인력", "자격증", "경력", "CERT", "SOC"
            ]
            
            print("\n[주요 내용 추출]")
            for keyword in keywords:
                if keyword in full_text:
                    # 키워드 주변 텍스트 추출
                    idx = full_text.find(keyword)
                    start = max(0, idx - 100)
                    end = min(len(full_text), idx + 200)
                    context = full_text[start:end].replace('\n', ' ')
                    print(f"\n• {keyword}:")
                    print(f"  {context}")
                    
    except Exception as e:
        print(f"오류: {e}")