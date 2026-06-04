---
title: AI SOC Agent Service AI 보안관제 에이전트 실행계획 #2
project: AI_SOC_Agent_Service
para: Projects
zettel_type: execution_plan
validation_status: executable_seed_verified
---

# AI 보안관제 에이전트 실행계획 #2

## 목적

metadata-only public dataset contracts를 Agent Assurance 중심 실행계획으로 연결한다.

## 입력과 제외 범위

- 입력: public_dataset_metadata_spec_v2, dataset_case_spec_plan_v0, replay_metrics_v1, existing_doc14_doc20_doc22_addenda
- 제외: public_dataset_download, production_siem_edr_soar_connection, autonomous_response
- 공개데이터셋 실행 모드: metadata_only_no_download

## Safety Gates

- Download Gate: blocked_until_explicit_approval
- License Gate: required_before_raw_ingestion
- Evidence Package / Evidence Gate: Evidence Package completeness and citation required
- Policy Gate: Policy Gate blocks tenant leakage and unsupported conclusions
- Human Review / Response Gate: human_review_first

## Dataset Contract Summary

- public_sources: 5
- download_requires_approval: 5
- high_or_medium_risk_sources: 4
- source_ids: otrf-security-datasets, splunk-bots-v3, unsw-nb15, lanl-auth, cert-insider-threat

| source | risk | target_schemas | primary_metrics | excluded_uses |
| --- | --- | --- | --- | --- |
| otrf-security-datasets | medium | normalized_alert, evidence_package | timeline_completeness, mitre_mapping_coverage, citation_coverage | malware_attribution, autonomous_response |
| splunk-bots-v3 | medium | normalized_alert, evidence_package | case_summary_quality, bounded_query_coverage, citation_coverage | production_siem_query_execution, autonomous_response |
| unsw-nb15 | low | normalized_alert, evidence_package | anomaly_score_calibration, severity_prior_quality, false_positive_review_rate | soc_case_summary_without_context, autonomous_response |
| lanl-auth | high | normalized_alert, evidence_package | identity_chain_reconstruction, peer_baseline_explainability, missing_context_reason_coverage | account_lockout_decision, autonomous_response |
| cert-insider-threat | high | normalized_alert, evidence_package | uncertainty_statement_coverage, policy_context_coverage, human_review_acceptance | employee_accusation, disciplinary_recommendation, autonomous_response |

## Workstreams

| id | name | objective | deliverables | gate |
| --- | --- | --- | --- | --- |
| WS-01 | Dataset Contract Hardening | 각 공개데이터셋의 access/raw/normalization/evaluation metadata contract를 유지한다. | dataset_source_metadata_spec_v2.json, schema validation tests | download_allowed=false and approval flags true for public sources |
| WS-02 | Evidence Package Adapter Interface | raw parser 전 단계에서 required mappings와 unsupported field handling을 명시한다. | PublicDatasetAdapter metadata_stub contract, case specs | unsupported fields become missing evidence, not inferred facts |
| WS-03 | Investigation Agent MVP | alert intake, evidence plan, timeline, entity context, triage draft를 read-only로 생성한다. | agent API contract, replay-backed test cases | Evidence Gate and Policy Gate before every draft verdict |
| WS-04 | Agent Assurance Replay | metadata-only public case specs와 synthetic fixtures를 회귀평가에 묶는다. | replay_metrics_v2 candidate, regression thresholds | tenant_leakage_count=0 and unsupported_conclusion_count=0 |
| WS-05 | Human Review Operations | 추천/초안만 제공하고 승인 패키지, 감사 로그, 수동 조치 요청을 분리한다. | review queue fields, audit trace checklist | no account lockout, isolation, firewall block, or customer notice without approval |

## 4주 실행 마일스톤

| id | name | exit criteria |
| --- | --- | --- |
| M1 | Week 1 | metadata spec v2 and plan #2 artifacts verified |
| M2 | Week 2 | adapter interface tests for one selected public source |
| M3 | Week 3 | Investigation Agent draft API contract and fixtures |
| M4 | Week 4 | Replay v2 regression report with human-review gates |

## Replay 기준선

- decision: go_for_next_seed
- total_cases: 4
- tenant_leakage_count: 0
- unsupported_conclusion_count: 0

## 다음 구현 후보

1. 한 개 공개데이터셋을 선택해 raw download 없이 parser interface test부터 작성한다.
2. Investigation Agent draft API schema를 Evidence Package 중심으로 추가한다.
3. Replay Runner v2에서 metadata spec coverage metric을 추가한다.