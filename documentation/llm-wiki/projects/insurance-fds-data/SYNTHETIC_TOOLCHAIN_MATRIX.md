---
title: 보험 FDS 합성 문서 생성 로컬/오픈소스 Toolchain Matrix
created_at: 2026-06-04T16:03:15+09:00
project: insurance-fds-data
status: draft_research
scope: defensive synthetic data generation, OCR/KIE evaluation, forensic label masks
---

# 보험 FDS 합성 문서 생성 Toolchain Matrix

목적: `data/insurance-fds-seed`의 NO/AF/FK JSON seed를 실제 학습/평가용 문서 이미지·PDF와 라벨로 확장하기 위한 로컬/오픈소스 후보 정리. 아래 내용은 실제 위조 절차가 아니라 방어적 합성 데이터 생성, OCR round-trip, 탐지/segmentation 라벨 생성 관점이다.

## 0. 현재 로컬 확인
- 현재 PATH에서 확인됨: Python, uv, Node/npm, ffmpeg, git.
- 현재 PATH에서 미확인: Tesseract, ImageMagick, Inkscape, wkhtmltopdf, WeasyPrint CLI, Ghostscript, Poppler, LibreOffice.
- 따라서 즉시 구현은 Python/Node 기반 렌더러부터 시작하고, OCR/PDF rasterize/이미지 변환 도구는 별도 설치 또는 프로젝트 가상환경 설치가 필요하다.

## 1. Toolchain Matrix

| 영역 | 후보 도구 | 용도 | 장점 | 단점/주의 | 설치 필요성/난이도 | FDS 적용 포인트 |
|---|---|---|---|---|---|---|
| HTML 렌더링 | Playwright/Chromium | HTML/CSS 템플릿을 PNG/PDF로 렌더링 | CSS 재현성 높음, 스크린샷/PDF 동시 가능, Node/Python 양쪽 지원 | 브라우저 바이너리 설치 필요, 폰트 환경 차이에 따른 레이아웃 차이 | 중: `playwright install chromium` 필요 | 청구서/영수증 템플릿을 DOM 좌표 기반 bbox 라벨과 함께 생성 |
| HTML→PDF | WeasyPrint | HTML/CSS를 PDF로 변환 | Python 친화적, 서버 없이 로컬 실행, paged media 강점 | Windows에서 Cairo/Pango 의존성 이슈 가능, JS 미지원 | 중~상 | 정형 의료영수증/세부내역서 PDF 생성, 페이지별 레이아웃 고정 |
| HTML→PDF | wkhtmltopdf | WebKit 기반 HTML PDF | 오래된 시스템에도 예제가 많음 | CSS 최신 기능 제한, 프로젝트 활발성 낮음 | 중 | 단순 양식 PDF batch 생성 후보 |
| SVG 렌더링 | CairoSVG | SVG→PNG/PDF | Python 통합 쉬움, 벡터 도장/테이블 라인 처리 가능 | 복잡한 SVG/CSS 호환성 제한 | 중 | 합성 직인/양식선/워터마크를 방어적 라벨과 함께 별도 레이어 생성 |
| SVG 렌더링 | resvg/usvg | SVG→raster | 렌더링 정확도/속도 양호, CLI 단순 | Python 생태계와 직접 결합은 추가 래퍼 필요 | 중 | SVG 템플릿 대량 이미지화 |
| SVG/PDF 편집 | Inkscape CLI | SVG/PDF export | GUI 검수와 CLI 자동화 모두 가능 | 설치 용량 큼, Windows PATH 설정 필요 | 중 | 디자이너가 만든 템플릿을 배치 렌더링 |
| PDF 생성 | ReportLab | 코드로 PDF 직접 작성 | 좌표/텍스트 bbox 통제 쉬움, 의존성 적음 | HTML/CSS보다 템플릿 작성 생산성 낮음 | 하 | 라벨 좌표가 중요한 baseline 문서 생성 |
| PDF 처리/rasterize | PyMuPDF(fitz) | PDF 렌더링, 텍스트/이미지 추출 | pip 설치 쉬움, 페이지 이미지화와 bbox 확인 가능 | PDF 표준의 모든 edge case를 보장하지 않음 | 하 | 생성 PDF→PNG round-trip, 페이지 단위 manifest 생성 |
| PDF rasterize | Poppler(`pdftoppm`, `pdfinfo`) | PDF→이미지, 메타 확인 | 검증된 CLI, OCR 파이프라인과 호환 | Windows 설치/PATH 필요 | 중 | 렌더링 품질을 여러 엔진으로 교차검증 |
| PDF 정리 | Ghostscript | PDF/A, 압축, rasterize | 문서 처리 표준 도구 | 옵션이 많아 재현성 관리 필요 | 중 | 생성 산출물의 PDF 호환성 검증 |
| OCR | Tesseract + `kor` traineddata | OCR baseline | 완전 로컬, 라이선스/운영 단순 | 한국어 영수증/표 구조 인식 품질 한계, 별도 언어팩 필요 | 중 | OCR round-trip으로 금액/날짜 추출 가능성 점검 |
| OCR | PaddleOCR | OCR + text detection, 다국어/한국어 | 문서 OCR 품질 양호, Python 파이프라인 통합 | 모델 다운로드, GPU/CPU 성능 고려 | 중 | 의료영수증 텍스트 박스/읽기 순서 baseline |
| OCR | EasyOCR | 빠른 다국어 OCR | 설치/사용 쉬움, Korean 지원 | 대량 처리 속도/정확도는 PaddleOCR 대비 검증 필요 | 하~중 | seed 확장 초기 OCR smoke test |
| OCR/KIE | docTR, LayoutLM 계열, Donut/TrOCR | OCR-free 또는 KIE 실험 | 문서 AI 모델 실험에 적합 | 한국어/의료양식 특화는 fine-tuning 필요, GPU 권장 | 중~상 | 필드 추출 모델 후보, CORD/SROIE 전이학습 비교 |
| OCR wrapper | OCRmyPDF | PDF에 OCR text layer 추가 | PDF workflow 표준화 | Tesseract/Ghostscript 의존 | 중 | PDF 산출물 검색 가능성/텍스트 레이어 평가 |
| 이미지 열화 | Pillow/OpenCV | blur, resize, compression, perspective, noise 등 일반 증강 | 의존성 낮고 좌표 변환 추적 가능 | 문서 스캔 특유 결함은 직접 구현 필요 | 하 | bbox/mask 동시 변환이 쉬운 기본 증강 |
| 이미지 열화 | Albumentations | 학습용 증강 파이프라인 | bbox/mask 동시 변환 지원, 재현성 seed 관리 | 문서 도메인 특화 효과는 커스텀 필요 | 하 | 탐지/segmentation train/val 증강 표준화 |
| 이미지 열화 | Augraphy | 문서 스캔/복사/팩스풍 degradation | 문서 특화 augmentation 다수 | 버전별 의존성 확인 필요, 과도한 열화는 OCR 라벨 훼손 | 중 | 스캔/촬영/압축 흔적을 합성하되 원본 라벨 보존 |
| 이미지 열화 | imgaug, scikit-image | 보조 증강/필터 | 실험 빠름 | 유지보수/성능은 케이스별 | 하 | 특수 노이즈/조명/기하 변환 보조 |
| Copy-move 라벨 | OpenCV + NumPy + mask layer | 통제된 합성 변형과 binary/instance mask 생성 | 원본-변형-마스크를 모두 보유 가능, 방어적 라벨에 최적 | 실제 사기 재현처럼 상세화하지 않도록 정책 필요 | 하 | `copy_move_region` mask, bbox, 원본 필드 연결 메타데이터 생성 |
| Forensic mask annotation | Label Studio / CVAT | 사람이 mask/bbox 검수 | 협업/리뷰에 적합, export 다양 | 서버/DB 운영 필요, PII 반입 금지 | 중 | AF/FK mask QA, human-review set 구축 |
| Forensic baseline | scikit-image/OpenCV features, Noiseprint류 연구코드 | 복제/압축/노이즈 불일치 baseline | 가벼운 baseline부터 가능 | 연구코드는 유지보수/라이선스 불명확 가능 | 중 | 탐지 모델 전 feature sanity check, 논문 재현은 별도 검토 |
| 공개 forensic 데이터 | CASIA, CoMoFoD, MICC-F220/F2000 등 | 일반 이미지 copy-move pretraining/eval | 라벨 포함 데이터 존재 | 문서/한국어/보험 도메인 아님, 라이선스 재확인 필수 | 데이터별 상이 | 문서 전용 AF 생성 전 segmentation 모델 워밍업 |
| Diffusion 연계 | ComfyUI | 로컬 노드 기반 생성/후처리 pipeline | 워크플로 JSON 관리, ControlNet/IP-Adapter 등 연계 쉬움 | GPU/모델 용량 필요, 비결정성/라이선스/모델 출처 관리 | 상 | 배경지/스캔 질감/비민감 시각 다양화, 문서 텍스트 의미 생성은 rule/template 우선 |
| Diffusion 연계 | Hugging Face diffusers | Python에서 SD/ControlNet/inpaint 호출 | 코드 기반 재현성, 실험 자동화 | GPU/모델 라이선스/캐시 관리 필요 | 중~상 | 합성 문서 주변 배경/촬영 조건/비식별 질감 생성 |
| Diffusion 보조 | ControlNet/T2I-Adapter/IP-Adapter | 레이아웃/스타일 제어 | 템플릿 구조를 유지한 다양화 가능 | 텍스트 왜곡 가능, 실제 기관 로고/서명 학습 금지 | 상 | 레이아웃은 HTML/SVG로 고정하고 시각적 degradation만 보조 |
| MCP 연계 | `@modelcontextprotocol/server-filesystem` | seed/manifest/템플릿 파일 접근 | 에이전트가 파일 기반 파이프라인 관리 | 접근 경로 최소화 필요 | 하~중 | `data/insurance-fds-seed`, docs, generated subset만 허용 |
| MCP 연계 | `mcp-server-sqlite`류 | manifest/라벨/실험 결과 조회 | 데이터셋 registry를 SQL로 검증 가능 | DB 스키마 관리 필요 | 중 | NO/FK/AF split, 중복 receipt_no, cross-doc mismatch 질의 |
| MCP 연계 | Playwright MCP | 렌더링/시각 회귀/공식 페이지 확인 | 브라우저 자동화와 screenshot 검증 | 외부 사이트 접근 시 robots/약관 준수 | 중 | 템플릿 렌더링 smoke test, 공개 안내 페이지 수집 검증 |
| MCP 연계 | Fetch/Firecrawl 계열 MCP | 공개 문서 수집/요약 | 출처 추적과 갱신 자동화 | 라이선스/robots/동적 페이지 한계 | 중 | KNIA/실손24/FSC/HIRA 등 링크 중심 메타 갱신 |
| MCP 연계 | ComfyUI MCP/HTTP wrapper | 에이전트→ComfyUI workflow 실행 | 이미지 생성 작업을 agent pipeline에 편입 | 로컬 서버 권한/모델 안전성/큐 관리 필요 | 중~상 | 승인된 workflow JSON만 실행, 산출물 manifest 자동 등록 |

## 2. 권장 최소 구현 스택

1. 템플릿/렌더링: Playwright 또는 ReportLab + PyMuPDF.
2. 라벨 보존 증강: Pillow/OpenCV + Albumentations.
3. OCR smoke test: EasyOCR 또는 Tesseract로 시작, 한국어 품질이 부족하면 PaddleOCR로 전환.
4. Forensic label: 합성 파이프라인 내부에서 원본 layer, 변형 layer, binary/instance mask를 동시에 저장.
5. 검수: Label Studio 또는 CVAT를 선택적으로 붙여 mask/bbox 샘플 QA.
6. Diffusion: 1차에서는 필수 아님. 필요 시 ComfyUI는 텍스트/금액 생성이 아니라 배경지, 촬영 환경, 노이즈 질감 다양화에 한정.
7. MCP: filesystem + sqlite + playwright를 우선, ComfyUI MCP는 GPU/모델 정책 확정 후 후순위.

## 3. 안전/PII/라이선스 기준

- 모든 합성 인물, 병원, 약국, 계좌, 전화번호, 식별번호는 fake namespace와 `pii_status=synthetic_no_real_pii`를 명시한다.
- 실제 병원 로고, 의사 서명, 직인, 주민등록번호, 계좌, 보험증권 이미지는 사용하지 않는다.
- 위조 절차 재현이 아니라 탐지 라벨 생성을 위한 통제된 변형으로만 기록한다. 변형 설명은 `tamper_label`, `mask_path`, `field_ref`, `severity`, `generator_version` 수준으로 제한한다.
- Diffusion 모델은 라이선스, 학습 데이터 이슈, 상업 이용 가능 여부를 모델별로 기록한다. 실제 양식/로고/서명 모방 prompt 또는 LoRA 학습은 금지한다.
- 공개 데이터셋(CORD, SROIE, DocTamper, CopyMove 등)은 다운로드 전 라이선스/재배포/상업 이용/PII 포함 여부를 재확인한다.
- MCP 서버는 허용 디렉터리 allowlist, read/write 분리, 외부 네트워크 접근 로깅, 생성물 manifest 자동 기록을 적용한다.

## 4. 구현 반영용 산출물 구조 제안

```text
data/insurance-fds-generated/
  manifests/
    generation_runs.jsonl
    tool_versions.json
  rendered/
    NO|AF/<doc_id>/page_0001.png
    NO|AF/<doc_id>/document.pdf
  labels/
    <doc_id>.json
    masks/<doc_id>_tamper_instance.png
  ocr/
    <doc_id>_tesseract.json
    <doc_id>_paddleocr.json
  qa/
    visual_regression/<run_id>/
```

필수 메타 필드: `source_seed_id`, `generator_version`, `template_id`, `render_engine`, `font_pack`, `degradation_recipe_id`, `ocr_engine`, `tamper_labels`, `mask_paths`, `pii_status`, `license_notes`, `random_seed`.

## 5. 우선순위 결론

- 1순위: Playwright/ReportLab, PyMuPDF, Pillow/OpenCV, Albumentations, EasyOCR/Tesseract/PaddleOCR 중 1개 이상.
- 2순위: Augraphy, Label Studio/CVAT, Poppler/Ghostscript.
- 3순위: ComfyUI/diffusers, ControlNet 계열, ComfyUI MCP/HTTP wrapper.
- 보류: 실제 기관 양식 복제, 실제 직인/서명/로고 학습, 출처 불명 forensic 연구코드의 운영 반영.
