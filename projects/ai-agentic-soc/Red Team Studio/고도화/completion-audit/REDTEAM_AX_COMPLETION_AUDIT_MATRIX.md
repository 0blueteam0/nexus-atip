---
title: RedTeam AX Completion Audit Matrix
type: completion_audit
zk_type: evidence
para: Projects
status: active_incomplete
created: 2026-07-02
updated: 2026-07-03
canonical_path: J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/REDTEAM_AX_COMPLETION_AUDIT_MATRIX.md
project: Red Team Studio
source_path:
  - J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/SPEC
  - J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/Agentic RAG SPEC
  - J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/FINAL_PLAN.md
  - J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/Detailed_PLAN.MD
collected_via:
  - source_code_inspection
  - plan_contract_review
  - regression_test_mapping
evidence_level: current_source_and_test_mapping
related:
  - ./redteam_ax_completion_audit_matrix.json
  - ../sanity/test_completion_audit_matrix.py
  - ../llm-wiki/LLM_WIKI_HOME.md
tags: [redteam-ax, completion-audit, evidence, guardrails, report-v2]
---

# RedTeam AX Completion Audit Matrix

## 판정

현재 목표 상태는 `active_incomplete`이다. 이번 문서는 완료 선언이 아니라 완료 조건을 요구사항별로 증거에 연결하는 감사 장부다.

## 요약

| 상태 | 건수 | 의미 |
|---|---:|---|
| `proved` | 44 | 현재 소스/테스트/스모크 산출물로 해당 범위를 주장 가능 |
| `partial` | 1 | 중요한 구현 증거는 있으나 요구 범위 전체를 증명하기에는 부족 |
| `gap` | 0 | 계획에 명시된 미구현 또는 미검증 기능 |
| `blocked` | 0 | 환경 조건 때문에 최종 증거가 아직 없음 |

## 완료로 주장 가능한 주요 항목

- `레드팀 분석2` 독립 탭과 live browser smoke 확인
- RedTeam2 visible copy의 한국어/초급자 안내 inventory sanity
- `/api/redteam/v2`의 ROE/HITL/ToolActionCard/Evidence/Report gate 흐름
- MCP direct invocation denial guard와 artifact evidence
- Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP registry와 분석 agent 매핑
- Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP operator-attested version evidence capture
- RedTeam2의 여러 분석도구 순차 실행 UI와 governed multi-toolchain execution API
- governed multi-toolchain execution API가 `progress_percent`, `progress_events`, `status_ko`, `operator_message_ko`, `next_action_ko`를 반환하고 RedTeam2 UI가 `도구 진행` 표로 한국어 진행 상태를 표시하는 계약
- governed multi-toolchain run의 저장 stdout/stderr artifact를 Sanitizer, 도구별 LLM normalizer, Evidence Card 후보 생성으로 일괄 회수하는 `/api/redteam/v2/toolchains/{toolchain_id}/collect-results` API와 한국어 UI
- toolchain result collection이 `analysis_agent_summaries`와 step별 `analysis_agent_summary`로 도구별 LLM 분석 에이전트, normalizer, sanitizer/parser 맥락, Evidence 사용 제한, 승인 전 Claim 금지를 한국어 UI에 표시하는 계약
- SCA/CycloneDX SBOM import가 컴포넌트 인벤토리 Evidence와 취약점 후보 Evidence를 분리하고 `affected_component_refs`/`affected_components` 및 `requires_component_match_review`로 승인 전 Claim 사용을 제한하는 계약
- 실제 운영 증거 readiness가 Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP 6개 산출물 coverage를 기본 필수 조건으로 검사하고 누락 도구를 blocker로 표시하는 계약
- toolchain result collection의 Evidence 후보를 actor/reviewer identity binding으로 batch 승인하고 Finding/Claim/Report 삽입은 하지 않는 `/api/redteam/v2/toolchain-result-collections/{collection_id}/approve-evidence` API와 한국어 UI
- 승인된 toolchain result collection Evidence만 `pending_review` Finding 초안으로 승격하고 승인 전 Evidence는 차단하는 `/api/redteam/v2/toolchain-result-collections/{collection_id}/promote-findings` API와 한국어 UI
- collection에서 생성된 Finding 초안을 red_team_lead와 business_owner 2인 severity 승인으로 `approved` 상태까지 이동시키되 Matrix/report Claim 삽입은 하지 않는 `/api/redteam/v2/toolchain-result-collections/{collection_id}/approve-finding-severity` API와 한국어 UI
- collection approved Finding을 Claim-Evidence Matrix ready row와 Korean Report v2 draft로 연결하되 final export approval은 별도 gate로 유지하는 `/api/redteam/v2/toolchain-result-collections/{collection_id}/matrix-draft` 및 `/matrix-draft/report-draft` API와 한국어 UI
- collection Report v2 draft의 `report_id`를 기존 `/api/redteam/v2/reports/{report_id}/approve-export` 및 `/export` 게이트로 연결하고, Executive Sponsor 승인과 gate snapshot pass 뒤 export artifact 생성을 검증하는 regression test와 한국어 UI 연결 상태 표시
- collection, report, export approval, export artifact를 읽어 Evidence/Finding/Matrix/Report/Export 완료 상태와 blocker를 한 번에 검증하는 `/api/redteam/v2/toolchain-result-collections/{collection_id}/completion-gate` API와 한국어 UI
- Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 6개 운영자/서비스 결과를 하나의 toolchain imported-output collection으로 첨부하고 Evidence 승인, Finding 승격, 2인 severity 승인, Matrix, Report v2 draft, 최종 export, completion gate까지 통과시키는 regression test와 한국어 UI
- 운영 산출물 폴더에서 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 결과 파일을 탐지하고 SHA-256 manifest를 만드는 `/api/redteam/v2/toolchains/build-artifact-manifest` API와 한국어 UI
- Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 운영 산출물 파일의 `source_path`와 `sha256` manifest를 검증해 명령 실행 없이 toolchain collection 입력으로 가져오는 `/api/redteam/v2/toolchains/import-artifact-manifest` API와 한국어 UI
- 명시 승인자 입력을 요구하고 기존 collection 산출물만 사용해 Evidence 승인, Finding 승격, 2인 severity 승인, Matrix, Report v2 draft, export 승인, export, completion gate를 순서대로 닫는 `/api/redteam/v2/toolchain-result-collections/{collection_id}/close-e2e` API와 한국어 UI
- 기존 운영 scanner 산출물 폴더를 manifest 생성, import, 결과 회수, 명시 승인자 close-e2e, Report v2 export, completion gate까지 한 번에 연결하되 scanner/Docker/WSL/네트워크 명령은 실행하지 않는 `/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e` API와 한국어 UI
- 운영 scanner 산출물 closure 실행 전 `source_dir`, 승인자 4명, runtime blocker, close-operating payload를 검증하는 `/api/redteam/v2/toolchains/operating-closure-submission-package` API와 한국어 UI
- 운영 closure 제출 전 `CASE-V2`, fixture, `operator-scanner-outputs` 같은 테스트성 경로와 승인자 누락/중복을 차단하는 `/api/redteam/v2/toolchains/real-operating-evidence-readiness` API와 한국어 UI
- 운영자 증거 수집 package 항목의 artifact path를 받아 sha256/status를 확인하고 validator-compatible `submission_manifest` 초안을 저장하는 `/api/redteam/v2/toolchains/operator-evidence-submission-manifest-draft` API와 한국어 UI
- 승인된 operator Evidence Card import plan 후보를 실제 Evidence Card로 등록하고 명시적 사람 검토가 있을 때만 기존 Evidence 승인 API로 승인 기록을 남기는 `/api/redteam/v2/toolchains/operator-evidence-card-import` API와 한국어 UI
- 운영 closure 제출 패키지와 final close 사이에서 체크리스트, 승인자 서명, runtime blocker 처리 방침, `final_close_authorized`를 기록하는 `/api/redteam/v2/toolchains/operating-closure-human-review` API와 한국어 UI
- ready human review record의 `approved_close_api_payload`만 사용하고 override payload를 무시하는 `/api/redteam/v2/toolchains/execute-reviewed-operating-close` API와 한국어 UI
- reviewed close 실행 증거가 completion audit 후보가 되려면 close/report/completion gate와 실제 운영 산출물/승인자 attestation을 요구하는 `/api/redteam/v2/toolchains/certify-reviewed-operating-close-evidence` API와 한국어 UI
- 인증된 reviewed close 증거를 독립 감사 checklist로 다시 검토하고 controlled/test 산출물을 `goal_complete_candidate`에서 차단하는 `/api/redteam/v2/toolchains/review-operating-completion-audit-candidate` API와 한국어 UI
- 설치된 `npm.cmd --version`의 governed runner live smoke, sanitizer, agent normalization, Evidence Card 생성
- 공식 release checksum으로 검증한 portable Nuclei v3.10.0 및 Trivy v0.72.0 CLI의 governed runner live smoke, sanitizer, agent normalization, Evidence Card 생성
- 격리 venv 기반 OpenVAS `gvm-cli` 및 OWASP ZAP `zap-cli` wrapper의 governed runner live smoke, sanitizer, agent normalization, Evidence Card 생성
- OpenVAS XML 및 OWASP ZAP JSON read-only service report import adapter smoke, tool-specific parser, sanitizer, Evidence Card 생성, secret material negative control
- npm audit, Nuclei, Trivy, OpenVAS, OWASP ZAP 최신 governed 결과를 Evidence pack, SCA-style sufficiency report, Claim-Evidence Matrix 후보, LLM analyst agent 제한으로 묶은 tool result analysis brief
- tool result analysis brief의 Evidence pack을 Finding 초안 payload와 Claim 후보로 변환하고 Evidence 승인 전 report claim 삽입을 보류하는 finding/claim review package
- finding/claim review 후보를 조회하고, Evidence 승인 전 promotion을 차단하며, 승인된 Evidence가 있을 때만 `pending_review` Finding 초안을 생성하는 `/api/redteam/v2/tool-result-finding-claim-review/{candidate_id}/promote-finding` API
- finding/claim review 후보를 Claim-Evidence Matrix 초안 row로 변환하고, 승인된 Evidence와 2인 severity 승인된 Finding만 report validation payload preview에 포함하는 `/api/redteam/v2/tool-result-finding-claim-review/matrix-draft` API
- Matrix draft의 held row가 0건이고 report gate preview가 pass일 때만 Korean Red Team Report v2 draft를 생성하는 `/api/redteam/v2/tool-result-finding-claim-review/matrix-draft/report-draft` API
- OpenVAS/ZAP 외부 vault reference 기반 read-only credential authorization API와 한국어 UI
- RedTeam2 `OpenVAS/ZAP 서비스 결과 가져오기` 한국어 패널과 frontend service import contract sanity
- `/api/redteam/v2/runtime-readiness` read-only API와 RedTeam2 `실행 환경 준비도 / 남은 실측 조건` 한국어 패널, 운영자 조치 runbook 단계 표, 운영자 증거 수집/제출 검증/Evidence Card 후보 import 계획 표
- 조직 OpenVAS/ZAP endpoint/vault env가 준비되면 backend credential authorization과 scanner-service-import API를 통해 실제 read-only import를 수행하는 live harness
- 외부 OpenVAS/ZAP read-only endpoint/vault reference readiness artifact, Docker daemon blocker artifact, WSL 배포판 시작 blocker artifact, strict live readiness promotion blocker artifact, live readiness remediation runbook artifact, operator evidence collection package artifact, operator evidence submission validation artifact, operator Evidence Card import plan artifact
- 전체 accepted gate manifest: API regression, sample E2E/report gate, audit sanity, plan contract, Korean copy inventory, installed-tool live smoke, scanner CLI smoke, OpenVAS/ZAP CLI smoke, OpenVAS/ZAP service import smoke, frontend service import contract, frontend runtime readiness contract, external scanner readiness, external scanner service import live harness, WSL runtime readiness, strict live readiness promotion, live readiness remediation runbook, operator evidence collection package, operator evidence submission validation, operator Evidence Card import plan, tool result analysis brief, tool result finding/claim review, Python compile, frontend JS check, frontend build 통과
- Evidence Card, Claim-Evidence Matrix, Report v2 gate 0-count 샘플 E2E
- Agentic RAG SCA/citation verifier와 unsupported claim hold
- LLM wiki의 Red Team Studio manifest, ChatShare, previous work index 연결

## 아직 완료로 주장하면 안 되는 항목

- Docker/container runtime live smoke 성공 증거
- WSL 배포판 mount/start 복구 후 scanner tool path ready 증거
- `redteam_ax_strict_live_readiness_promotion.py --allow-container --allow-network --require-promotion` 통과 증거
- `redteam_ax_live_readiness_remediation_runbook.py --require-clear` 통과 증거
- `redteam_ax_operator_evidence_collection_package.py --require-inputs-ready` 통과 증거
- `redteam_ax_operator_evidence_submission_validator.py --submission-manifest <path> --require-approved` 통과 증거
- `/api/redteam/v2/toolchains/operator-evidence-submission-manifest-draft`로 만든 제출 manifest를 실제 운영자가 검토해 `review_status=approved`로 변경하고 validator를 통과한 증거
- 실제 validator 통과 결과에서 생성된 Evidence Card 후보 전체를 `/api/redteam/v2/toolchains/operator-evidence-card-import`로 등록/승인하고 이후 Finding 승격, 2인 severity, Matrix/report/export/completion gate까지 통과한 증거
- tool result analysis brief의 Claim-Evidence 후보를 실제 Finding/Report claim으로 승인 연결한 증거
- 모든 real finding/claim review 후보를 실제 운영 Evidence 승인 후 Finding으로 승격하고, 2인 severity 승인과 Report claim validation까지 통과시킨 증거
- 모든 real finding/claim review 후보의 Matrix draft가 ready가 되고 최종 Korean Red Team Report v2에 반영된 증거
- 모든 real Matrix row가 ready인 상태에서 Report v2 draft 생성, 최종 export 승인, export 검증까지 완료한 운영 실측 증거
- 실제 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP 운영 결과 전체를 imported-output 또는 live service import 경로로 제출하고, 복합 결과 회수 API로 회수한 뒤 Evidence 승인·Finding 승격·Claim-Evidence Matrix까지 닫은 증거
- 실제 운영 scanner 파일 manifest를 `/api/redteam/v2/toolchains/import-artifact-manifest`로 제출한 뒤 Evidence 승인, Finding 승격, severity 승인, Matrix/Report v2, export, completion gate까지 닫은 운영 실측 증거
- 실제 운영 scanner 폴더에서 `/api/redteam/v2/toolchains/build-artifact-manifest`로 manifest를 만들고, 사람이 검토한 뒤 제출·승인·보고서 완료까지 닫은 운영 실측 증거
- 실제 운영 scanner collection을 `/api/redteam/v2/toolchain-result-collections/{collection_id}/close-e2e`로 닫고, real approver와 Report v2 export, completion gate `complete=true`를 확보한 운영 실측 증거
- 실제 운영 scanner 폴더를 `/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e`로 제출하고, real approver와 Report v2 export, completion gate `complete=true`를 확보한 운영 실측 증거
- 실제 운영 scanner 폴더를 `/api/redteam/v2/toolchains/real-operating-evidence-readiness`로 먼저 점검하고, `/api/redteam/v2/toolchains/operating-closure-submission-package`, `/api/redteam/v2/toolchains/operating-closure-human-review`, `/api/redteam/v2/toolchains/execute-reviewed-operating-close`, `/api/redteam/v2/toolchains/certify-reviewed-operating-close-evidence`, `/api/redteam/v2/toolchains/review-operating-completion-audit-candidate`까지 완료한 운영 실측 증거
- 실제 운영 toolchain collection Evidence 후보 전체를 batch 승인, promote-findings, approve-finding-severity, Matrix/report draft API로 처리하고, 이후 final export approval/export verification gate까지 닫은 운영 실측 증거
- 조직/실서비스 OpenVAS service report import 및 OWASP ZAP daemon passive-alert import endpoint 성공 증거. 현재는 endpoint/vault reference 미설정 readiness/import blocker artifact만 존재한다.
- RedTeam2 runtime readiness panel은 blocker를 보여주는 visibility 증거이며, blocker가 모두 ready로 바뀐 운영 실측 증거는 아직 아니다.

## 운영 규칙

1. `redteam_ax_completion_audit_matrix.json`의 모든 `audit_items[].status`가 `proved`가 되기 전에는 전체 `/goal`을 완료로 표시하지 않는다.
2. `partial`, `gap`, `blocked`, `unverified` 항목은 후속 슬라이스 후보로 남긴다.
3. 새 기능은 이 매트릭스의 기존 요구사항에 evidence ref를 추가하거나 새 요구사항을 추가한 뒤 sanity test를 통과시킨다.
4. Report gate의 0-count는 필수 조건이지만, 설치/runtime/credential/UX 요구까지 대신 증명하지는 않는다.
