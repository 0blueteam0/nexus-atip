# 보험 FDS 청구문서 데이터 작업: 두 개 고정 병렬 스코프

작성일: 2026-06-05
작성자: Codex / Hermes

## 목적

다음 실행부터 보험 관련 청구문서 위변조/합성 데이터 작업을 두 개의 병렬 축으로 고정한다.

1. 실제 웹 원본 기반 청구문서 프로파일과 exact-coordinate 가명/익명 치환 데이터 축
2. 이전 대량 테스트 지연/중단 원인 확인 및 테스트 하네스 안정화 축

이 문서는 작업 범위를 잠그기 위한 스코프 문서이며, 실제 AF 데이터 대량 생성 전에 반드시 읽어야 한다.

## 절대 고정 정책

### 이미지 산출물 정책

학습/검증 이미지에는 다음을 넣지 않는다.

- 검은 마스크
- 블럭 처리
- 합성전용 박스
- 실제 제출불가 문구
- 워터마크성 문구
- 눈에 보이는 shortcut 라벨
- 의미 없는 더미 값

필요한 것은 익명화, 가명화, 비식별화뿐이다. 즉 원본과 같은 위치, 같은 필드 폭, 같은 정렬, 같은 시각적 문맥 안에서 실제값을 보존하지 않는 synthetic/pseudonym value로 교체한다.

단, 모델 학습 라벨 또는 검증용 메타데이터로서 별도 JSON/PNG mask 파일이 필요한 경우에는 이미지 픽셀 안에 합성하지 않고 별도 label artifact로만 보관한다. 사용자가 보는 NO/AF 이미지 자체에는 마스크/블럭/제출불가 박스를 렌더링하지 않는다.

### 원본 기준 정책

모든 새 문서 프로파일은 실제 웹에서 provenance가 확인되는 원본 이미지를 우선 기준으로 삼는다.

- source_url 또는 source_page_url이 있어야 한다.
- 웹 원본은 privacy/license review 전까지 quarantine으로 둔다.
- 실제 원본 픽셀을 그대로 학습 데이터로 승격하지 않는다.
- 원본은 layout/font/table/capture/OCR 분포 추출 기준으로 사용한다.
- 실제값은 raw output/manifest에 저장하지 않는다.

## 고정 작업축 1: Real-Web Grounded Exact-Coordinate Pseudonymized Dataset

### 한 줄 정의

웹에서 가져온 실제 청구문서 원본 후보를 기준으로 문서 구조와 필드 좌표를 추출하고, 같은 좌표 안에서 익명/가명 값만 치환한 NO/AF pair를 만드는 축이다.

### 이전 기록 근거

- `documentation/session/handoffs/2026-06-04T11-31-49-108Z-codex-to-claude-system-insurance-fds-v3-2-exact-coordinate-af-dataset.md`
  - v3.2는 paired NO 이미지를 복사한 뒤 원래 필드 bbox만 overwrite하는 exact-coordinate 정책을 도입했다.
  - 검증: `pytest tests/test_insurance_fds_exact_coordinate_pipeline.py -q -> 2 passed`
  - 대량 생성 검증: `python scripts/insurance_fds_exact_coordinate_pipeline.py --template-cases 8 -> NO 32 AF 32 pairs 32 validation mismatch 0`
- `documentation/session/handoffs/2026-06-04T17-28-10-codex-to-claude-system-insurance-fds-real-image-redteam.md`
  - public real-image 후보와 real-image derivative pipeline을 만들었으나 privacy/license risk 때문에 quarantine 상태가 필요하다.
- `documentation/session/handoffs/2026-06-05T07-52-45-236Z-codex-to-claude-system-fds-real-image-stg-local-substitution.md`
  - real-image STG/local substitution 흐름을 이어받아야 한다.
- `documentation/session/handoffs/2026-06-05T07-06-44-964Z-codex-to-claude-system-claim-fds-real-web-source-collector.md`
  - placeholder/logo/banner/guide asset을 배제하고, mask/block/submission-invalid artifacts를 STG output에서 제거하는 방향이 이미 반영됐다.
- `A3Work/FDSWork/GPTWork_FDS/new type/claim_fds_v3_pipeline_package/claim_fds_v3_pipeline/outputs/real_web_claim_sources_bg2_20260605/BG2_ZERO_DOWNLOAD_ANALYSIS.md`
  - bg2 수집은 후보 203개였지만 검증 다운로드 0개였으므로 그대로 승격하면 안 된다.

### 포함 작업

1. real-web source collector의 page/PDF deep extraction 개선
   - `cataloged_page_candidate`에서 실제 문서 이미지/PDF asset을 더 깊게 추출한다.
   - HIRA/NHIS/FSS/보험사/병원 안내 페이지를 우선한다.
2. OCR/KIE field inventory 복구 및 확장
   - 필드 후보 bbox, field_family, value_status, tamper_eligibility를 생성한다.
   - value가 확인되지 않은 필드는 AF 생성 금지 상태로 둔다.
3. exact-coordinate pseudonym rewrite
   - paired NO 이미지의 원래 bbox 내부에서만 값 교체한다.
   - shifted box, overlay box, visible redaction block을 만들지 않는다.
4. privacy gates
   - regex leakage scan
   - raw_value_retention=false
   - known provider blacklist scan
   - manual review queue
5. dataset manifest
   - provenance URL
   - privacy_state
   - field bbox
   - pseudonymization method
   - split leakage keys
   - NO/AF pair linkage

### 제외 작업

- 실제 제출 가능한 보험 청구서 제작 최적화
- 실제 기관 로고/상호/사업자번호/전화번호/주소 복제
- 실제 환자/진료/금융 식별자 보존
- 이미지 픽셀 내부의 마스크/블럭/합성전용/실제제출불가 렌더링
- 검증되지 않은 bg2 후보의 자동 승격

### 완료 기준

- 실제 provenance가 있는 원본 후보만 source registry에 남는다.
- NO/AF pair는 동일 좌표 정책을 만족한다.
- generated image에는 visible shortcut artifact가 없다.
- raw value가 manifest에 남지 않는다.
- 테스트가 최소 다음을 통과한다.
  - `python -m pytest tests/test_insurance_fds_exact_coordinate_pipeline.py -q`
  - `python -m pytest tests/test_insurance_fds_real_image_field_inventory.py -q`
  - claim_fds_v3 pipeline collector/OCR bridge 관련 tests

## 고정 작업축 2: Mass-Test Delay / Test Harness RCA and Stabilization

### 한 줄 정의

이전 대량 테스트가 느리거나 중단된 원인을 별도 축으로 추적하고, 데이터 생성 작업과 섞지 않고 테스트 하네스를 안정화하는 축이다.

### 현재 확인된 근거

2026-06-05 현재 `J:/PortableApps/genai`에서 실행한 보험 FDS 테스트 확인 결과:

1. 전체 glob 실행

```bash
python -m pytest tests/test_insurance_fds_*.py -q --durations=12
```

결과:

- collection 단계에서 중단
- 원인: `tests/test_insurance_fds_real_image_field_inventory.py`가 `scripts/insurance_fds_real_image_field_inventory.py`를 import하지만 해당 script가 없음
- exit code: 2
- collection error까지 3.36초

2. 이전 handoff의 4개 테스트 묶음 재실행

```bash
python -m pytest tests/test_insurance_fds_public_image_collector.py tests/test_insurance_fds_real_image_redteam_generator.py tests/test_insurance_fds_camera_image_generator.py tests/test_insurance_fds_priority_pipeline.py -q --durations=10
```

결과:

- 16 passed in 47.61s
- 가장 느린 테스트는 camera image generator 쪽이다.
  - `test_should_generate_camera_style_pngs_and_masks_when_cli_runs`: 8.35s
  - `test_should_emit_af_tamper_masks_for_af_camera_images`: 7.71s
  - `test_should_record_rich_camera_degradation_and_submission_metadata`: 7.43s
  - `test_should_emit_stable_diffusion_control_contracts_without_live_generation`: 7.15s
- priority pipeline 테스트들도 각 2.4~2.8초 수준으로 반복적인 이미지/파일 생성 비용이 있다.

### 포함 작업

1. collection error 복구
   - missing `scripts/insurance_fds_real_image_field_inventory.py`를 복원/구현하거나 stale test를 정리한다.
   - 단, 사용자가 요구한 no mask/block visible policy를 반영한다.
2. 느린 테스트 분리
   - unit/smoke/integration/slow marker 구분
   - 기본 `pytest -q`에서는 빠른 unit/smoke 중심으로 돈다.
   - 이미지 대량 생성/카메라 degradation 테스트는 명시적으로만 실행한다.
3. test fixture 축소
   - 반복되는 PNG/JPEG 생성 수량을 줄인다.
   - temp fixture reuse 또는 deterministic small fixture를 사용한다.
4. duration budget 도입
   - 주요 테스트 묶음별 목표 시간 기록
   - `--durations` 기반 regression check
5. 대량 생성 CLI와 테스트 분리
   - 대량 데이터 생성은 CLI/benchmark로 두고 unit test는 구조/manifest/정책만 검증한다.

### 제외 작업

- 테스트 속도를 위해 privacy/source gate를 우회하는 것
- 느린 테스트를 무조건 삭제하는 것
- 실패 테스트를 xfail로 숨기는 것
- AF 이미지 품질 검증을 생략하는 것

### 완료 기준

- `python -m pytest tests/test_insurance_fds_*.py -q`가 collection error 없이 돈다.
- 느린 테스트 원인이 durations report로 분리된다.
- 기본 보험 FDS test path와 slow/integration path가 문서화된다.
- visible mask/block/submission-invalid artifact 금지 정책이 테스트에 포함된다.

## 병렬 진행 방식

### Agent A: Data Pipeline / Real-Web Grounding

담당:

- real-web source collector 개선
- field inventory/OCR/KIE
- exact-coordinate pseudonym rewrite
- privacy/source gating

주요 파일 후보:

- `scripts/insurance_fds_real_image_pinpoint_overwrite.py`
- `scripts/insurance_fds_exact_coordinate_pipeline.py`
- `scripts/insurance_fds_public_image_collector.py`
- `A3Work/FDSWork/GPTWork_FDS/new type/claim_fds_v3_pipeline_package/claim_fds_v3_pipeline/scripts/collect_real_insurance_claim_sources.py`
- `A3Work/FDSWork/GPTWork_FDS/new type/claim_fds_v3_pipeline_package/claim_fds_v3_pipeline/scripts/build_real_image_stg_manifest.py`

### Agent B: Test RCA / Harness Stabilization

담당:

- missing field inventory script 복구
- slow tests marker/fixture 분리
- durations baseline 기록
- no-visible-shortcut artifact regression tests

주요 파일 후보:

- `tests/test_insurance_fds_real_image_field_inventory.py`
- `tests/test_insurance_fds_real_image_pinpoint_overwrite.py`
- `tests/test_insurance_fds_camera_image_generator.py`
- `tests/test_insurance_fds_priority_pipeline.py`
- `pytest.ini` 또는 `pyproject.toml` 테스트 설정

## 다음 실행의 첫 액션

1. Agent B가 먼저 collection error를 복구한다.
2. Agent A는 동시에 bg2의 `cataloged_page_candidate`와 trusted seed page/PDF deep extraction 설계를 진행한다.
3. 두 축은 공통 정책 테스트를 공유한다.
   - generated image에 `합성전용`, `실제 제출불가`, black block/mask shortcut이 없어야 한다.
   - source provenance와 privacy_state가 manifest에 있어야 한다.
4. 두 축 모두 완료 후에만 AF 대량 생성으로 넘어간다.
