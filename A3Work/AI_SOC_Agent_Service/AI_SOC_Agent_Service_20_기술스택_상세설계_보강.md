---
title: AI SOC Agent Service 20 기술스택 및 상세설계 보강
created: 2026-06-02
project: AI_SOC_Agent_Service
para: Projects
zettel_type: technical_design_addendum
validation_status: executable_seed_verified
---

# 20. 기술스택 및 상세설계 보강

## 목적

본 문서는 기존 `20_기술스택_및_상세설계.docx`에 병합할 DatasetRegistry, PublicDatasetAdapter, ReplayRunner v1 구조 보강안이다.

## 컴포넌트

| component | responsibility | input | output | guardrail |
| --- | --- | --- | --- | --- |
| DatasetRegistry | dataset_manifest.json을 검증하고 replay/case spec plan을 생성한다. | dataset_manifest.schema.json, dataset_manifest.json | dataset_replay_plan_v0.json, dataset_case_spec_plan_v0.json | download_allowed=false와 production_connection_allowed=false를 유지한다. |
| PublicDatasetAdapter | public source metadata를 raw ingestion 전 case spec으로 변환한다. | manifest source.case_templates | metadata_stub case specs | requires_manual_ingestion=true, adapter_mode=metadata_stub |
| ReplayRunner v1 | Evidence Package fixture metrics와 dataset plan을 결합해 Go/Hold/No-Go를 산출한다. | fixtures/*.evidence_package.json, dataset_manifest.json | replay_metrics_v1.json | current_decision=go_for_next_seed |
| SyntheticAlertGenerator | controlled SOC alert/evidence fixture를 생성한다. | scenario profiles | normalized alert and evidence package fixtures | prompt injection, cross-tenant, missing evidence 시나리오를 포함한다. |

## 데이터 흐름

| from | to | data | control |
| --- | --- | --- | --- |
| Dataset Manifest | DatasetRegistry | source metadata, execution policy, case templates | schema validation |
| DatasetRegistry | PublicDatasetAdapter | 4 enabled public sources | metadata-only conversion |
| PublicDatasetAdapter | Case Spec Plan | 4 case specs | download blocked |
| Evidence Fixtures | ReplayRunner v1 | 4 synthetic cases | schema and assurance metrics |
| ReplayRunner v1 | Go/Hold/No-Go Report | go_for_next_seed | tenant leakage and unsupported conclusion gates |

## API/함수 계약

| contract | request | response | failure_mode |
| --- | --- | --- | --- |
| DatasetRegistry.build_case_spec_plan() | dataset manifest path | schema_version, summary, case_specs[] | schema validation error or missing source field |
| PublicDatasetAdapter.to_case_specs() | public source object | metadata_stub case spec list | ValueError when source_type is not public |
| ReplayRunner.run() | fixture directory and optional dataset_manifest | metrics, summary, go_decision, optional dataset_plan | schema validation failure for malformed evidence package |

## 보안/운영 경계

- public dataset adapter는 metadata_stub 단계이며 원시 데이터 다운로드를 수행하지 않는다.
- production SOC connector는 이 seed에 포함하지 않는다.
- 고위험 대응 조치는 Human Review 이후에도 별도 승인 workflow가 필요하다.