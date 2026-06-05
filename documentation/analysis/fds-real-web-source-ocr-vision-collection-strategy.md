---
title: "FDS real web source OCR/vision gated collection strategy"
created_at: "2026-06-05"
project: "FDS"
para: "Projects/FDS"
zettelkasten: "source-curation-method"
evidence_level: "tool-verified-local-implementation"
source_path:
  - "A3Work/FDSWork/GPTWork_FDS/new type/claim_fds_v3_pipeline_package/claim_fds_v3_pipeline/scripts/collect_real_insurance_claim_sources.py"
  - "A3Work/FDSWork/GPTWork_FDS/new type/claim_fds_v3_pipeline_package/claim_fds_v3_pipeline/scripts/ocr_profile_real_web_document_candidates.py"
verification:
  - command: "PYTHONPATH=src pytest tests/test_real_web_source_collector.py tests/test_stg_local_tamper.py -q"
    exit_code: 0
  - command: "python scripts/collect_real_insurance_claim_sources.py --output-dir outputs/real_web_claim_sources_ocr_vision_smoke --max-queries 1 --per-query 2 --download-images --sleep-min 0 --sleep-max 0 --firecrawl-mode off --verification-mode ocr_vision"
    exit_code: 0
ontology:
  entities:
    - "real_web_source_candidate"
    - "ocr_gate"
    - "vision_shape_gate"
    - "page_first_crawler"
    - "korean_claim_document_signal"
  relations:
    - "search_result -> page_asset_extractor -> staged_image -> ocr_vision_gate -> raw_images"
related:
  - "K_DRIVE_HOME"
---

# FDS 실제 웹 원본 수집 전략: 웹검색 + 이미지검색 + OCR + 비전 + 크롤러 보조

## 문제 정의

기존 수집은 `raw_images`가 너무 넓게 열려 있어서 실제 실손보험 영수증, 진료비 세부내역서, 처방전, 보험금 청구서가 아닌 이미지가 들어왔다.
대표 노이즈는 다음과 같다.

- 판다/동물/인물/프로필/상담 배너 이미지
- 기관 로고, 아이콘, 검색 버튼, call_code, placeholder
- stock photo, AdobeStock, Shutterstock류 보험 설명 썸네일
- 본문 페이지는 보험 관련이지만 첨부 이미지는 문서가 아닌 경우

핵심 변경 원칙은 “무조건 긁기”가 아니라 “후보화 -> 검증 -> raw_images 편입”이다.

## 권장 수집 파이프라인

1. 한국어 검색 쿼리 생성
   - 문서 유형별 쿼리를 분리한다.
   - 예: `진료비 계산서 영수증`, `진료비 세부산정내역서`, `약제비 영수증`, `처방전`, `보험금 청구서`, `입퇴원확인서`.
   - `판다`, `프로필`, `배너`, `스톡`, `맛집`, `요리` 같은 비문서 신호는 negative query/negative gate에 반영한다.

2. 검색 결과는 page-first로 처리
   - 검색엔진 이미지 탭만 신뢰하지 않는다.
   - 먼저 원문 페이지를 수집하고 `og:image`, `<img>`, PDF 링크, 첨부파일을 추출한다.
   - 페이지 URL, 이미지 URL, query, source_kind를 manifest에 남긴다.

3. 선다운로드 게이트
   - URL/title/page에 판다, 인물, 프로필, 배너, stock, logo, icon, placeholder 신호가 있으면 다운로드하지 않는다.
   - 이 단계의 목적은 raw_images 오염을 막는 것이다.

4. staging_images에 임시 다운로드
   - 후보 이미지는 바로 raw_images에 쓰지 않는다.
   - `staging_images`에 저장한 뒤 이미지 크기/형상/유효성을 확인한다.

5. OCR + 비전 게이트
   - OCR: RapidOCR/Surya/marker/easyocr/paddleocr 중 가벼운 엔진을 우선 사용한다.
   - 필드 신호: `진료비`, `영수증`, `본인부담`, `비급여`, `진료일`, `발급일`, `처방전`, `질병분류`, `병원`, `약국`, `청구금액`.
   - 비전 신호: 실제 문서 사진/스캔처럼 충분히 크고 직사각형 비율인지 확인한다.
   - 통과 기준: 한국어 OCR + 청구문서 필드 2그룹 이상 + 문서형 이미지 비율.

6. raw_images 편입
   - OCR/비전 게이트를 통과한 이미지만 `raw_images`로 이동한다.
   - 실패 이미지는 `rejected_images`에 남기되, 학습/파생 생성에는 쓰지 않는다.

7. 원 소스 역추적
   - 직접 이미지 URL만 보지 않고 `page_url`을 정본 source로 삼는다.
   - 같은 이미지 sha256이 여러 페이지에 나오면 가장 원본에 가까운 페이지를 우선한다.
   - 우선순위: 공식기관/병원/보험사 PDF 또는 안내 페이지 > 블로그 실제 경험글 첨부 > 이미지 검색 캐시/썸네일.

8. 한국어 리뷰
   - 사람이 보는 파일명, contact sheet, document label은 한국어를 사용한다.
   - 영어 내부 토큰은 manifest 내부 기술 필드로만 제한한다.

## 설치/도구 상태

현재 Python OCR/비전 도구는 설치 및 import 검증됨.

- RapidOCR ONNX Runtime
- EasyOCR
- PaddleOCR/Paddle
- pytesseract Python wrapper
- img2table
- OpenCV
- ONNX Runtime
- PyTorch/TorchVision
- transformers
- ultralytics
- PyMuPDF/pymupdf4llm
- layoutparser
- timm/scikit-image
- marker-pdf / surya-ocr / pdftext

외부 Windows 바이너리 설치는 winget 권한 오류로 막힘.

- tesseract: missing
- ImageMagick `magick`: missing
- Poppler `pdftoppm`: missing
- Java: missing

대체 방향: 현재는 Python 기반 OCR/비전 스택을 기본으로 사용하고, Tesseract/Poppler/Java는 관리자 권한 또는 별도 portable 설치로 보강한다.

## 비전 에이전트 운용 아이디어

### 1. Search Agent
- 한국어 쿼리를 생성하고 검색 결과를 page-first로 정리한다.
- 이미지 검색 결과는 단독 다운로드하지 않고 원문 페이지 역추적 대상으로만 쓴다.

### 2. Crawler Agent
- 원문 페이지에서 이미지/PDF 후보를 추출한다.
- Firecrawl은 broad query 모드가 아니라 trusted seed 또는 page URL 보조 추출로 제한한다.

### 3. OCR Gate Agent
- staging image/PDF에 OCR을 수행한다.
- 원문 OCR 텍스트는 기본 저장하지 않고 redaction/hash/field hint만 남긴다.
- 한국어 필드 신호가 부족하면 rejected로 보낸다.

### 4. Vision Gate Agent
- 문서형 비율, 충분한 해상도, 표/텍스트 밀도, 얼굴/동물/스톡 이미지 가능성을 평가한다.
- 향후 YOLO/LayoutParser/SAM을 붙여 document region, face/person/object reject를 강화한다.

### 5. Source Resolver Agent
- 같은 이미지 해시/유사 이미지를 page_url 단위로 묶는다.
- 공식/원게시자/첨부파일 경로를 우선 source로 선택한다.

### 6. Korean Review Agent
- contact sheet와 manifest를 한국어로 요약한다.
- `원본후보`, `검토필요`, `PII검수필요`, `라이선스미확인`, `문서아님거절` 상태를 사람이 바로 볼 수 있게 만든다.

## 구현 반영 사항

`collect_real_insurance_claim_sources.py`에 다음을 반영했다.

- `pre_download_candidate_gate`: 판다/인물/프로필/배너/스톡/로고/아이콘류 선차단.
- `score_ocr_document_signal`: 한국어 보험/의료 청구문서 OCR 필드 신호 점수화.
- `should_accept_downloaded_image`: keyword + OCR + vision shape 결합 판정.
- `--verification-mode ocr_vision`: 기본 모드. 검증 통과 전에는 raw_images에 저장하지 않음.
- staging/rejected/raw 분리:
  - `staging_images`: 검증 중 임시 파일
  - `rejected_images`: OCR/vision 실패 이미지
  - `raw_images`: OCR/vision 통과 후보만 이동

## smoke 검증 결과

소량 smoke에서 1개 쿼리, 8개 후보를 처리했다.

- downloaded_count: 0
- pre_download_reject_count: 5
- rejected_after_ocr_vision_count: 1
- important_event_count: 0

즉, 기존처럼 `raw_images`에 노이즈를 무조건 저장하지 않고, 아이콘/안내 이미지/OCR 실패 후보를 차단했다.

## 다음 확장

1. rejected_images contact sheet도 별도 생성해 false negative를 확인한다.
2. OCR 실패지만 실제 문서처럼 보이는 후보를 `manual_review_needed`로 분리한다.
3. 사람/동물 검출용 YOLO zero-shot 또는 CLIP 계열 reject 모델을 추가한다.
4. PDF 후보는 PyMuPDF/marker/surya로 page image + OCR 후 이미지 후보와 같은 게이트에 넣는다.
5. 이미지 검색 결과는 직접 다운로드보다 reverse source resolution에 사용한다.
6. 최종 accepted candidate는 PII/license review가 끝날 때까지 학습 데이터로 쓰지 않는다.
