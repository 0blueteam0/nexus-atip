# Claim FDS Synthetic Pipeline v3

방어 목적의 손해보험 청구서류 위변조 탐지 학습 데이터를 생성하기 위한 Codex 구현용 skeleton입니다. 모든 샘플은 비실제기관·비유효번호를 사용하며, 실제 제출 가능한 서류를 만들기 위한 용도가 아닙니다.

## 실행

```bash
cd claim_fds_v3_pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run_demo.py
```

생성 결과는 `outputs/`에 저장됩니다.

## 핵심 설계

1. `config/field_map.v2024.yaml`: 실제 청구 관련 필드와 문서 타입을 정의합니다.
2. `layout.py`: 표가 페이지 밖으로 삐져나가지 않도록 grid 합계 검증, cell 단위 text fit, truncation, overflow audit을 수행합니다.
3. `renderer.py`: 진료비 계산서·영수증과 진료비 세부산정내역 샘플을 생성합니다.
4. `degradation.py`: scanner, mobile capture, fold, crumple, torn-edge augmentation을 분리합니다.
5. `tamper.py`: post-scan local field replacement 이미지만 생성합니다. 마스크/블럭/제출불가 표시는 산출 이미지에 넣지 않습니다.
6. `qc.py`: semantic consistency와 layout audit을 수행합니다.

## 산출물

- `v3_01_medical_receipt_pristine.png`: 렌더링 디버그 이미지
- `v3_02_medical_receipt_clean_scan.jpg`: 정상 스캔풍 이미지
- `v3_03_medical_receipt_post_scan_tampered.jpg`: 국소 field replacement 변조 이미지
- 변조 영역 좌표/변경 필드는 manifest/QC 메타데이터에만 기록하며, mask/overlay 이미지는 생성하지 않습니다.
- `v3_04_medical_receipt_folded_benign.jpg`: 접힘 hard negative
- `v3_05_medical_receipt_crumpled_torn_benign.jpg`: 약한 구김 + margin tear hard negative
- `v3_06_medical_receipt_mobile_capture.jpg`: 모바일 청구앱풍 촬영
- `v3_07_detail_statement_clean_scan.jpg`: 쌍 문서인 진료비 세부내역서
- `manifest.json`: claim, tamper, benign degradation, provenance
- `qc_report.json`: overflow, truncation, semantic consistency report

## Codex 작업 규칙

- 실제 병원명, 실제 로고, 실제 사업자등록번호, 실제 환자정보를 넣지 않습니다.
- 공개 샘플에는 visible safe mark를 유지합니다. 내부 학습 데이터에서는 픽셀 마크를 제거하고 별도 manifest/registry로 synthetic 여부를 관리합니다.
- `overflow_count > 0`인 샘플은 학습 투입 금지입니다.
- 접힘/구김/찢김은 fraud label이 아니라 benign degradation label입니다.
- 핵심 필드를 가리는 강한 훼손은 FDS 학습셋보다 품질불량/재촬영 라우팅셋으로 분리합니다.

## 다음 고도화 지점

- reference set에서 실제 layout statistics를 추출해 `config/generator.yaml`의 row height, font size, scan profile을 자동 보정합니다.
- real-vs-synthetic discriminator AUC가 낮아질 때까지 template family를 반복 개선합니다.
- 영수증·세부내역서·처방전·약제비영수증 간 cross-document graph consistency label을 확장합니다.

## v4 방향 전환: 한국 손해보험 실손 FDS 고충실 bundle factory

v4는 한국 손해보험사의 실손/손해 청구 FDS가 탐지해야 하는 맥락을 중심으로 확장했습니다. 단순한 이미지 훼손이 아니라 `과청구`, `중복청구`, `금액 변조`, `진단명/질병코드 변조`, `약품/처방 변조`, `입원기간/병실료/비급여 변조`, `세부내역 항목추가`, `수술/마취 불일치`, `증빙 체크박스/필수서류 불일치`, `발급기관 불일치`가 문서 간 정합성으로 드러나도록 NO/AF counterfactual bundle을 생성합니다.

- 기본 factory는 8개 visual cluster를 유지하고, 현재 검증 산출물은 cluster당 3개 bundle = 24 claim bundle과 Real Image 파생 AF 40개를 생성했습니다.
- 각 synthetic claim bundle은 23개 row를 가집니다.
  - NO 13종: `medical_receipt`, `medical_detail_statement`, `pharmacy_receipt`, `prescription`, `claim_application`, `diagnosis_certificate`, `hospitalization_confirmation`, `outpatient_confirmation`, `medical_opinion`, `surgery_confirmation`, `inpatient_detail_statement`, `supporting_evidence_checklist`, `claim_review_cover_sheet`
  - AF 10종: `semantic_amount_mismatch`, `semantic_diagnosis_code_mismatch`, `semantic_drug_mismatch`, `semantic_duplicate_claim`, `semantic_provider_mismatch`, `semantic_hospitalization_period_mismatch`, `semantic_inpatient_room_charge_inflation`, `semantic_line_item_insertion`, `semantic_surgery_anesthesia_mismatch`, `semantic_supporting_document_checkbox_mismatch`
- `tamper_mask`, `masks/`, block/overlay 이미지는 생성하지 않습니다. `changed_fields`는 manifest/QC 메타데이터에만 남깁니다.
- `Real Image` 경로의 실제 이미지는 두 방식으로 씁니다.
  - v4 bulk: 원본을 직접 변조하지 않고 visual profile 및 안전한 derived synthetic reference로 사용합니다.
  - STG local substitution: OCR/KIE 좌표 후보를 만든 뒤 같은 좌표 영역에만 donor field patch를 치환합니다. 출력 이미지에는 마스크, 블럭, 합성전용, 제출불가 표시를 넣지 않습니다.
- 접힘, 구김, 약한 찢김, 도장, 붉은 주석, QR/barcode placeholder, 모바일 perspective, crop은 기본적으로 `benign_condition_tags`이며 fraud label이 아닙니다.
- 모든 값은 synthetic/pseudonymized/invalid token이거나 비식별 OCR field type이며, 실제 병원명·로고·사업자번호·주민번호·계좌번호·전화번호를 manifest에 원문 저장하지 않습니다.

실제 참조 이미지 기반 v4 bulk 생성 예:

```bash
PYTHONPATH=src python - <<'PY'
from pathlib import Path
from claim_fds_synth.v4_high_fidelity_factory import generate_high_fidelity_dataset

real = Path('J:/PortableApps/genai/A3Work/FDSWork/Real Image')
images = sorted(p for p in real.rglob('*') if p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.bmp', '.webp'})
result = generate_high_fidelity_dataset(
    images,
    'outputs/v4_real_image_many',
    bundles_per_cluster=3,
    generate_real_image_derivatives=True,
    real_derivatives_per_image=5,
    image_quality=90,
)
print(result)
PY
```

Real Image OCR 좌표 기반 STG local substitution 예:

```bash
python scripts/build_real_image_stg_manifest.py \
  --image-dir "J:/PortableApps/genai/A3Work/FDSWork/Real Image" \
  --output-dir outputs/real_image_stg_manifest_run_20260605 \
  --min-fields-per-image 2

PYTHONPATH=src python - <<'PY'
from pathlib import Path
from claim_fds_synth.stg_local_tamper import generate_stg_local_tamper_dataset

root = Path('outputs/real_image_stg_manifest_run_20260605')
generate_stg_local_tamper_dataset(
    root / 'manifest.real_image_stg.v1.jsonl',
    root,
    'outputs/real_image_stg_tamper_run_20260605',
    max_samples=24,
    attack_families=['semantic_amount_mismatch'],
    image_quality=90,
)
PY
```

STG 산출물 품질 게이트:

- `outputs/real_image_stg_manifest_run_20260605/summary.real_image_stg.v1.json`
- `outputs/real_image_stg_manifest_run_20260605/manifest.real_image_stg.v1.jsonl`
- `outputs/real_image_stg_manifest_run_20260605/reports/real_image_ocr_field_profiles.json`
- `outputs/real_image_stg_tamper_run_20260605/manifest.stg.v1.jsonl`
- `outputs/real_image_stg_tamper_run_20260605/qc_report.stg.v1.json`
- 현재 검증: Real Image 8개 중 7개 manifest 편입, field candidate 107개, noise rejected token 213개, STG AF 24개 생성, `outside_bbox_diff_pixels == 0`, mask/block/마스크/블럭/합성전용/제출불가 문자열 없음.

웹 원본 후보 재수집은 raw_images 직접 저장이 아니라 staging -> pre-download noise gate -> OCR/vision gate -> raw_images 편입 순서로 수행합니다.

```bash
python scripts/collect_real_insurance_claim_sources.py \
  --output-dir outputs/real_web_claim_sources_bg2_20260605 \
  --max-queries 40 \
  --per-query 6 \
  --download-images \
  --source-mode focused \
  --firecrawl-mode trusted_seed \
  --verification-mode ocr_vision \
  --sleep-min 0.8 \
  --sleep-max 1.6
```

현재 v4 bulk 산출물:

- `outputs/v4_real_image_many/reference_profiles.v4.json`
- `outputs/v4_real_image_many/reference_form_source_catalog_ko.v4.json`
- `outputs/v4_real_image_many/manifest.v4.jsonl`
- `outputs/v4_real_image_many/splits.v4.json`
- `outputs/v4_real_image_many/qc_report.v4.json`
- `outputs/v4_real_image_many/images/*.jpg`
- `outputs/v4_real_image_many/real_image_derived/*.jpg`
- `outputs/v4_real_image_many/montage.v4.jpg`
- `outputs/v4_real_image_many/summary_ko.v4.xlsx`
- `outputs/v4_real_image_many/summary.v4.ko.xlsx`
- `outputs/v4_real_image_many/fds_scenario_taxonomy_ko.v4.csv`

검증된 bulk 결과:

- image/manifest rows: 592
- generated images: 552 synthetic bundle images + 40 Real Image reference-derived synthetic AF images
- claim bundles/reference groups: 24 synthetic claim bundles + 8 real reference groups
- label counts: NO 312, AF 280
- document types: 14
- attack families: 10
- QC: layout overflow 0, privacy leakage findings 0, quality gate pass

추가 케이스 스터디 반영:

- 입원기간/입퇴원일 변조: 입퇴원확인서, 입원 진료비 세부내역서, 영수증 산정 일수 불일치
- 병실료/비급여 과청구: 상급병실료, 비급여, 식대가 입원일수 또는 세부내역 합계 대비 과다
- 세부내역 항목 추가: 진료비세부내역서 표에 비급여 재료대/처치/검사 항목이 추가되거나 수량이 증가
- 수술/마취 불일치: 진단서/수술확인서에는 근거가 약한데 입원세부내역서에 수술·마취료가 존재
- 증빙자료 체크박스 불일치: 보험금 청구서 또는 체크리스트는 입원 필수서류를 제출했다고 표시하지만 bundle에는 누락/불일치

`reference_form_source_catalog_ko.v4.json`은 실제 양식 디테일을 계속 보강하기 위한 검색 큐입니다. 필요한 참조 이미지는 공개/공식 PDF, 병원 안내 양식, 보험사 청구서 양식, 정부 별지서식이며, 사용 전 PII/license quarantine이 필요합니다.
