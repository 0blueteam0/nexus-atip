# Claim FDS Synthetic Pipeline v4

방어 목적의 손해보험 청구서류 위변조 탐지 학습/평가 데이터를 생성하기 위한 안전한 synthetic pipeline입니다. 모든 샘플은 허구 기관명, 무효 식별자, synthetic provenance를 사용하며 실제 제출 가능한 서류를 만들기 위한 용도가 아닙니다.

## 안전 원칙

- 실제 병원, 약국, 보험사 로고/상호/사업자번호/환자정보/계좌번호를 사용하지 않습니다.
- `A3Work/FDSWork/Real Image`의 실제 이미지는 직접 복제하거나 OCR 텍스트를 추출하지 않고, 통계 프로파일 추정에만 사용합니다.
- 공개 샘플에는 visible safe mark를 유지합니다.
- 내부 학습 샘플은 shortcut learning을 줄이기 위해 픽셀 워터마크보다 registry/provenance 기반 synthetic 표시를 우선합니다.
- 접힘, 구김, 약한 margin tear는 기본적으로 fraud가 아니라 `benign_document_condition` 또는 품질 라우팅 신호입니다.

## 실행

```bash
cd claim_fds_v3_pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt pytest
PYTHONPATH=. python run_demo.py
PYTHONPATH=. pytest -q
```

Windows 환경에서는 Linux Nanum 폰트 경로가 없어도 `layout.py`의 fallback이 `C:/Windows/Fonts/NotoSansKR-VF.ttf`, `malgun.ttf`, `gulim.ttc` 등을 찾아 렌더링합니다.

## v3 호환 산출물

`outputs/`에 기존 v3 산출물이 유지됩니다.

- `v3_01_medical_receipt_pristine.png`: 렌더링 디버그 이미지
- `v3_02_medical_receipt_clean_scan.jpg`: 정상 스캔풍 이미지
- `v3_03_medical_receipt_post_scan_tampered.jpg`: 국소 field replacement 변조 이미지
- `v3_04_tamper_mask.png`: 변조 영역 mask
- `v3_05_tamper_overlay.png`: reviewer용 overlay
- `v3_06_medical_receipt_folded_benign.jpg`: 접힘 hard negative
- `v3_07_medical_receipt_crumpled_torn_benign.jpg`: 약한 구김 + margin tear hard negative
- `v3_08_medical_receipt_mobile_capture.jpg`: 모바일 청구앱풍 촬영
- `v3_09_detail_statement_clean_scan.jpg`: 쌍 문서인 진료비 세부내역서
- `manifest.json`: claim, tamper, benign degradation, provenance
- `qc_report.json`: overflow, truncation, semantic consistency report

## v4 reference-calibrated synthetic lab 산출물

`run_demo.py`는 v3 산출물 생성 후 `outputs/v4_lab/`도 자동 생성합니다.

- `reference_profile.v1.json`: 허가된 safe reference set에서 추출한 크기, 종횡비, 밝기, foreground coverage, 여백 비율 통계. 원본 픽셀과 OCR 텍스트는 저장하지 않습니다.
- `template_family.v1.json`: reference profile에서 샘플링한 synthetic-only 렌더링/캡처 profile.
- `manifest.v4.jsonl`: NO/AF row 단위 manifest. 모든 row는 `synthetic_only`, `label_family`, `document_type`, `leakage_group`을 포함합니다.
- `splits.v4.json`: claim_pair/provider/template/device leakage group이 split 사이에 섞이지 않도록 만든 split 계약입니다.
- `qc_report_v4.json`: layout, semantic, bundle graph, mask alignment, benign label gate 결과입니다.
- `v4_montage.png`: clean/tampered/mask/fold/torn/detail statement montage입니다.

## v4 코드 구조

- `reference_profiler.py`: 실제 참조 이미지를 직접 복제하지 않고 안전한 통계만 추출합니다.
- `template_family.py`: 참조 통계 분포에서 margin, paper tone, scanner quality, benign degradation profile을 샘플링합니다.
- `consistency_graph.py`: receipt/detail 등 문서 묶음의 semantic edge와 reason code를 평가합니다.
- `quality_gate.py`: overflow, critical truncation, benign-not-fraud, tamper mask alignment, leakage group 존재 여부를 검증합니다.
- `v4_lab.py`: 위 구성요소를 엮어 v4 산출물을 생성합니다.

## 현재 v4 milestone 검증 결과

현재 구현은 다음 기준을 통과합니다.

- `pytest -q`: 6 passed
- `run_demo.py`: v3 + v4 산출물 생성 성공
- `qc_report_v4.json`:
  - `all_generated_pages_overflow_free: true`
  - `critical_fields_not_truncated: true`
  - `benign_conditions_not_fraud: true`
  - `tamper_masks_align_changed_field_bboxes: true`
  - clean bundle graph pass
  - tampered bundle graph fails only `RECEIPT_DETAIL_TOTAL_MISMATCH`

## 한계와 다음 작업

1. 현재 v4는 reference-calibrated skeleton입니다. 실제 참조 이미지의 정확한 레이아웃을 복제하지 않고 통계만 쓰므로 안전하지만, 아직 실제 이미지의 다양한 crop, 기울기, 표 밀도, 도장/출력 흔적과는 거리가 있습니다.
2. `splits.v4.json`은 leakage-safe 계약을 만들지만 현재 demo bundle이 1개라 validation/test가 비어 있습니다. 다음 단계에서는 여러 claim pair/provider/template/device group을 생성해 split을 모두 채워야 합니다.
3. 약제비 영수증과 처방전 renderer는 field map에 schema만 있고 아직 실제 renderer가 없습니다.
4. long table multi-page pagination, line insert/delete, replay duplicate, cross-document pharmacy/prescription mismatch는 다음 increment에서 TDD로 추가해야 합니다.
5. 실제 이미지와 더 유사하게 만들려면 참조 이미지를 OCR/복제하지 않고 다음 통계를 더 수집해야 합니다: 표 cell 밀도, line thickness 분포, stamp 위치/색상 분포, 사진 crop/perspective 분포, blur/JPEG/illumination 분포, 스캔앱 auto-crop 경계, 종이 배경 tone/texture 분포.
