# AI SOC Agent Service implementation_seed

이 폴더는 PoC/MVP의 다음 단계를 바로 시작하기 위한 실행 가능한 seed 산출물입니다.

## 포함 파일

- `schemas/normalized_alert.schema.json`: 공통 Alert 정규화 JSON Schema
- `schemas/evidence_package.schema.json`: Evidence Package JSON Schema
- `schemas/dataset_manifest.schema.json`: 공개/합성 데이터셋 registry JSON Schema
- `datasets/dataset_manifest.json`: synthetic/public dataset metadata-only registry
- `scripts/synthetic_alert_generator.py`: synthetic alert/evidence package 생성기
- `scripts/dataset_registry.py`: dataset manifest validator 및 metadata-only replay plan 생성기
- `scripts/public_dataset_adapter.py`: public dataset adapter stub(case spec 변환, no download)
- `scripts/doc_addendum_generator.py`: 14 테스트 매트릭스/20 기술설계 보강 markdown+docx 생성기
- `tests/test_synthetic_alert_generator.py`: unittest 기반 검증 테스트
- `tests/test_dataset_registry.py`: dataset registry/adapter 검증 테스트
- `fixtures/*.json`: 생성된 synthetic fixture
- `scripts/replay_runner.py`: Evidence Package fixture 기반 replay metrics runner
- `reports/replay_metrics_v0.json`: Replay Runner v0 결과 리포트
- `reports/dataset_replay_plan_v0.json`: 데이터셋 manifest 기반 metadata-only replay plan
- `reports/dataset_case_spec_plan_v0.json`: public dataset adapter 구현 전 metadata-only case spec plan
- `reports/replay_metrics_v1.json`: dataset plan 포함 Replay Runner 결과 리포트
- `reports/doc_addendum_generator_v0.stdout.json`: 14/20 보강 문서 생성 결과
- `EVALUATION_PROTOCOL.md`: 평가 프로토콜 v0.1

## 실행

```bash
cd J:/PortableApps/genai/A3Work/AI_SOC_Agent_Service
python -m unittest discover -s implementation_seed/tests -v
python implementation_seed/scripts/synthetic_alert_generator.py --out implementation_seed/fixtures --seed 42
python implementation_seed/scripts/replay_runner.py --fixtures implementation_seed/fixtures --out implementation_seed/reports/replay_metrics_v0.json
python implementation_seed/scripts/dataset_registry.py
python implementation_seed/scripts/replay_runner.py --fixtures implementation_seed/fixtures --dataset-manifest implementation_seed/datasets/dataset_manifest.json --out implementation_seed/reports/replay_metrics_v1.json
python implementation_seed/scripts/doc_addendum_generator.py > implementation_seed/reports/doc_addendum_generator_v0.stdout.json
```

## 원칙

- 운영망 또는 실제 보안 장비에 연결하지 않습니다.
- 자동 계정잠금/호스트격리/방화벽차단을 수행하지 않습니다.
- synthetic data는 policy/evidence/guardrail 평가용 controlled test data입니다.
- 공개데이터셋은 현재 metadata-only registry/stub 단계입니다. 다운로드, 크롤링, 원시 로그 파싱은 명시 승인 후 별도 구현합니다.
