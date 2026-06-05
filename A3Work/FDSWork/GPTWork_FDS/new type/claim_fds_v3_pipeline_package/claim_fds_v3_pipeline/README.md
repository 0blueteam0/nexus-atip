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
5. `tamper.py`: post-scan local field replacement와 tamper mask를 생성합니다.
6. `qc.py`: semantic consistency와 layout audit을 수행합니다.

## 산출물

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

## v4 방향 전환: mask 없는 실손 청구 bundle factory

사용자 피드백에 따라 v4의 중심을 pixel tamper mask 생성에서 실손보험 청구 bundle 다양성으로 옮겼습니다.

- v4 factory는 기본적으로 8개 visual cluster x cluster당 3개 claim bundle = 24개 claim bundle을 생성합니다.
- 각 bundle은 최소 5개 문서 row를 가집니다.
  - NO `medical_receipt`
  - NO `medical_detail_statement`
  - NO `pharmacy_receipt`
  - NO `prescription`
  - AF `medical_receipt` semantic counterfactual
- `tamper_mask`, `changed_fields`, `masks/` 산출물은 생성하지 않습니다.
- AF는 국소 이미지 패치가 아니라 문서 간 의미 불일치로 만듭니다.
  - 예: 영수증 총액만 counterfactual로 증가시키고, 세부내역/약제비/처방전은 clean evidence로 유지합니다.
  - FDS 학습 신호는 `semantic_amount_mismatch`, `RECEIPT_DETAIL_TOTAL_MISMATCH`에 둡니다.
- 접힘, 구김, 약한 찢김, 도장, 붉은 주석, QR/barcode placeholder, 모바일 perspective, crop은 기본적으로 `benign_condition_tags`이며 fraud label이 아닙니다.

실제 참조 이미지 기반 v4 생성 예:

```bash
PYTHONPATH=src python - <<'PY'
from pathlib import Path
from claim_fds_synth.v4_high_fidelity_factory import generate_high_fidelity_dataset

real = Path('J:/PortableApps/genai/A3Work/FDSWork/Real Image')
images = [p for p in real.iterdir() if p.suffix.lower() in {'.jpg', '.jpeg', '.png'}]
result = generate_high_fidelity_dataset(images, 'outputs/v4_real_image_many', bundles_per_cluster=3)
print(result)
PY
```

현재 v4 산출물:

- `outputs/v4_real_image_many/reference_profiles.v4.json`
- `outputs/v4_real_image_many/manifest.v4.jsonl`
- `outputs/v4_real_image_many/splits.v4.json`
- `outputs/v4_real_image_many/qc_report.v4.json`
- `outputs/v4_real_image_many/images/*.jpg`
- `outputs/v4_real_image_many/montage.v4.jpg`
