---
title: AI SOC Agent Service 23 구현 Seed Replay 데이터셋 Case Spec 상세
created: 2026-06-02
project: AI_SOC_Agent_Service
para: Projects
zettel_type: implementation_detail
validation_status: executable_seed_verified
source_path: J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service/implementation_seed
collected_via: local_filesystem_and_unittest
evidence_level: executable_artifact_verified
related:
  - AI_SOC_Agent_Service_상세실행계획_데이터셋_논문_아이데이션.md
  - docx/22_데이터셋_및_평가전략.docx
  - implementation_seed/EVALUATION_PROTOCOL.md
ontology:
  entities:
    - AI SOC Agent Service
    - Dataset Manifest
    - Replay Runner
    - Evidence Package
    - Public Dataset Adapter
  relations:
    - subject: Dataset Manifest
      predicate: defines
      object: Public Dataset Case Specs
    - subject: Replay Runner
      predicate: evaluates
      object: Evidence Package Fixtures
    - subject: Public Dataset Adapter
      predicate: remains
      object: Metadata-only Stub
---

# 23. 구현 Seed, Replay, 데이터셋 Case Spec 상세

## 1. 목적

이 문서는 `22_데이터셋_및_평가전략.docx` 이후 실제 실행 가능한 PoC seed 구현 상태를 공식 문서 패키지에 연결하기 위한 상세 문서다.

현재 목표는 공개데이터셋을 다운로드하거나 운영 보안 장비에 연결하는 것이 아니다. 목표는 다음 세 가지를 검증 가능한 산출물로 고정하는 것이다.

1. Synthetic fixture 기반 Evidence Package 평가
2. Dataset Manifest 기반 공개/합성 데이터셋 후보 관리
3. Public dataset adapter 구현 전 metadata-only case spec plan 작성

## 2. 현재 구현 위치

- `implementation_seed/schemas/normalized_alert.schema.json`
- `implementation_seed/schemas/evidence_package.schema.json`
- `implementation_seed/schemas/dataset_manifest.schema.json`
- `implementation_seed/datasets/dataset_manifest.json`
- `implementation_seed/scripts/synthetic_alert_generator.py`
- `implementation_seed/scripts/replay_runner.py`
- `implementation_seed/scripts/dataset_registry.py`
- `implementation_seed/scripts/public_dataset_adapter.py`
- `implementation_seed/tests/test_synthetic_alert_generator.py`
- `implementation_seed/tests/test_replay_runner.py`
- `implementation_seed/tests/test_dataset_registry.py`

## 3. 데이터셋 Registry 정책

`dataset_manifest.json`은 다음 정책을 schema 수준에서 유지한다.

- `download_allowed=false`
- `production_connection_allowed=false`
- 공개데이터셋은 `metadata_stub` 상태로만 등록
- 실제 다운로드/크롤링/원시 로그 파싱은 명시 승인과 라이선스 검토 후 별도 구현
- ML score는 verdict가 아니라 evidence signal로만 사용

현재 등록된 source는 다음과 같다.

| source_id | 유형 | 상태 | 용도 |
|---|---|---|---|
| synthetic-v0 | synthetic | ready_local_fixture | Evidence/Policy/Prompt guardrail unit replay |
| otrf-security-datasets | public | metadata_stub | Windows/Sysmon attack timeline, MITRE mapping |
| splunk-bots-v3 | public | metadata_stub | Multi-step SOC investigation/query planning |
| unsw-nb15 | public | metadata_stub | Network anomaly baseline/calibration |
| lanl-auth | public | metadata_stub | Identity/auth anomaly chain reconstruction |
| cert-insider-threat | public | manual_review_required | Insider-risk explanation guardrail; disabled by default |

## 4. Replay Runner v1

`ReplayRunner`는 기존 synthetic fixture 평가에 dataset manifest 기반 replay plan을 결합한다.

주요 지표:

- `evidence_package_success_rate`
- `average_evidence_completeness`
- `missing_reason_coverage`
- `prompt_injection_quarantine_rate`
- `policy_block_rate_for_cross_tenant`
- `tenant_leakage_count`
- `unsupported_conclusion_count`

현재 검증 결과는 `go_for_next_seed`이다.

## 5. Public Dataset Case Spec Plan v0

이번 추가 구현은 `DatasetRegistry.build_case_spec_plan()`과 `write_case_spec_plan()`이다.

역할:

- enabled public source만 선택
- `PublicDatasetAdapter`를 통해 metadata-only case spec 생성
- adapter mode는 `metadata_stub`로 고정
- 모든 case spec에서 `download_allowed=false` 유지
- 실제 raw parser 구현 전 expected evidence / expected guardrail을 명시

생성 리포트:

- `implementation_seed/reports/dataset_case_spec_plan_v0.json`

요약:

- enabled public sources: 4
- case specs: 4 이상
- download blocked case specs: 전체

## 6. 실행 및 검증 명령

```bash
cd J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service
python -m unittest discover -s implementation_seed/tests -v
python implementation_seed/scripts/dataset_registry.py > implementation_seed/reports/dataset_registry_v1.stdout.txt
python implementation_seed/scripts/replay_runner.py --fixtures implementation_seed/fixtures --dataset-manifest implementation_seed/datasets/dataset_manifest.json --out implementation_seed/reports/replay_metrics_v1.json
python -m py_compile implementation_seed/scripts/dataset_registry.py implementation_seed/scripts/public_dataset_adapter.py implementation_seed/tests/test_dataset_registry.py
```

검증 결과:

- 전체 테스트: 17 tests OK
- dataset registry 단위 테스트: 8 tests OK
- py_compile: exit_code 0
- Replay Runner v1: `go_for_next_seed`

## 7. 기존 문서 반영 권장 위치

`14_테스트_케이스.docx`에 추가할 항목:

- Dataset manifest schema validation test
- Public dataset download block test
- Metadata-only case spec generation test
- Evidence Package fixture replay test
- Cross-tenant policy block test
- Prompt injection quarantine test

`20_기술스택_및_상세설계.docx`에 추가할 항목:

- DatasetRegistry component
- PublicDatasetAdapter metadata-stub component
- ReplayRunner v1 component
- Dataset Manifest JSON Schema
- Evidence Package JSON Schema
- Reports output contract

`21_PoC_및_로드맵_업데이트.docx`에 추가할 항목:

- Day 1~30: schema/manifest/replay/case spec 고정
- Day 31~60: OTRF 또는 BOTS 중 하나를 raw adapter 후보로 선정
- Day 61~90: shadow evaluation에서 human feedback metric 결합

## 8. 다음 실행 후보

1. OTRF Security Datasets raw adapter 설계만 작성한다. 다운로드는 하지 않는다.
2. BOTS v3 adapter 설계만 작성한다. Splunk 설치를 전제로 하지 않는다.
3. `reports/dataset_case_spec_plan_v0.json`을 기반으로 `14_테스트_케이스.docx`용 테스트 매트릭스를 생성한다.
4. `20_기술스택_및_상세설계.docx`용 컴포넌트/데이터 흐름 그림 또는 표를 생성한다.
