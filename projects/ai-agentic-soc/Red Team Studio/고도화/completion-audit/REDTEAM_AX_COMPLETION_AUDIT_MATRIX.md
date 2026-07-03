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
| `proved` | 53 | 현재 소스/테스트/스모크 산출물로 해당 범위를 주장 가능 |
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
- `/api/redteam/v2/toolchains/close-operating-artifact-manifest-e2e`가 readiness 우회 호출에서도 Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP 6개 산출물 coverage를 다시 검사하고 누락 시 `all_required_tool_artifacts_required`로 차단하는 계약
- `/api/redteam/v2/runtime-readiness`가 `next_action_plan`, `tool_execution_blocked_by`, `tool_execution_ready`로 실제 도구 실행 전 차단 단계와 운영자 다음 조치를 한국어 UI에 표시하는 계약
- runtime `next_action_plan`이 `frontend_action_key`와 `redteam2_button_ko`로 다음 조치와 RedTeam2 화면 버튼을 연결하고 `다음 실행 준비 단계` 표에 `화면 버튼` 열로 표시하는 계약
- `/api/redteam/v2/toolchains/execute-governed`가 `require_runtime_preflight=true` runner 요청에서 runtime readiness blocker를 사전 차단하고 RedTeam2가 `실행 전 readiness`로 차단 사유를 표시하는 계약
- 개발 과정 부산물 exclusion review가 archive/runs, fixture, smoke, sanity, sample, test-like, CASE-V2 evidence ref를 계약·회귀·안전통제 증거로만 허용하고 실제 완료/Report Claim 증거에서는 제외하는 계약
- 운영 closure 제출 패키지가 `require_real_completion_evidence=true`일 때 CASE-V2, fixture, smoke, sample, test, operator-scanner-outputs source를 `real_completion_evidence_source_required`로 차단하고 RedTeam2가 `개발 부산물 제외` row로 표시하는 계약
- `/api/redteam/v2/goal-completion-review`가 completion audit matrix, accepted gate, zero-count 종료 조건, 개발 부산물 제외 review를 읽고 unresolved item 또는 remaining gap이 있으면 전체 목표 완료를 차단하는 계약
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
- 외부 OpenVAS/ZAP read-only endpoint/vault reference readiness artifact, 실제 Docker container runtime smoke passed artifact, WSL alternate distro fallback ready artifact, strict live readiness promotion blocker artifact, live readiness remediation runbook artifact, operator evidence collection package artifact, operator evidence submission validation artifact, operator Evidence Card import plan artifact
- 전체 accepted gate manifest: API regression, sample E2E/report gate, audit sanity, plan contract, Korean copy inventory, installed-tool live smoke, scanner CLI smoke, OpenVAS/ZAP CLI smoke, OpenVAS/ZAP service import smoke, frontend service import contract, frontend runtime readiness contract, external scanner readiness, external scanner service import live harness, WSL runtime readiness, strict live readiness promotion, live readiness remediation runbook, operator evidence collection package, operator evidence submission validation, operator Evidence Card import plan, tool result analysis brief, tool result finding/claim review, Python compile, frontend JS check, frontend build 통과
- Evidence Card, Claim-Evidence Matrix, Report v2 gate 0-count 샘플 E2E
- Agentic RAG SCA/citation verifier와 unsupported claim hold
- LLM wiki의 Red Team Studio manifest, ChatShare, previous work index 연결

## 아직 완료로 주장하면 안 되는 항목

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
- RedTeam2 `실행 전 readiness` preflight가 ready인 운영 환경에서 실제 6개 도구 실행/첨부, Evidence 승인, Finding/Matrix/Report/export gate까지 완료한 증거는 아직 아니다.
- 개발 과정 부산물 exclusion review는 완료 증거 오염 방지 계약이며, 실제 6개 도구 운영 closure 증거를 대신하지 않는다.

## 2026-07-03 갱신 - Docker container runtime smoke 통과

- `runtime/redteam_v2_models.py`의 ephemeral container launcher는 image ENTRYPOINT를 비우는 `--entrypoint=`를 추가하고 `entrypoint_policy=cleared_to_execute_only_approved_runner_argv`를 남긴다.
- 이 변경은 Trivy 이미지처럼 ENTRYPOINT가 있는 컨테이너에서 allowlist가 승인한 `runner_argv`만 실행되도록 하며, `trivy trivy --version` 같은 중복 실행 실패를 제거한다.
- `latest_container_runtime_smoke.json`은 Docker Desktop engine, local pinned `aquasec/trivy` digest, ToolActionCard, ExecutionPlan, execution token, child-process allowlist, network none, read-only rootfs, dropped capabilities, no-new-privileges, runner exit 0을 기록한다.
- 당시 `latest_strict_live_readiness_promotion.json`은 Docker container gate 1개 통과와 WSL/실제 조직 OpenVAS/ZAP blocker를 기록했다. 이후 WSL alternate distro fallback도 ready로 갱신되었으므로 현재 남은 runtime blocker는 실제 조직 OpenVAS/ZAP endpoint/vault와 실제 6개 도구 운영 closure다.

## 2026-07-03 갱신 - WSL alternate distro fallback readiness 통과

- `redteam_ax_wsl_runtime_readiness.py`는 기본 배포판만 검사하지 않고 requested/default/running/stopped 순서로 후보를 만들며, `docker-desktop` 같은 internal distro는 마지막 fallback으로 둔다.
- 기본 `Ubuntu-22.04`는 `0x80070570` VHDX mount 오류로 실패하며 artifact에 `wsl_ext4_vhdx_corrupt_or_unreadable`, `wsl_mount_disk_failed` blocker로 보존된다.
- 대체 `Ubuntu-22.04-AISOC-Rebuild`는 start/tool path probe에 성공했고 `latest_wsl_runtime_readiness.json`은 `status=ready`, `selected_distro=Ubuntu-22.04-AISOC-Rebuild`, `failed_probe_count_before_selection=1`, npm/docker path를 기록한다.
- `latest_strict_live_readiness_promotion.json`은 promotion 4개 중 Docker와 WSL 2개 통과, 실제 조직 OpenVAS/ZAP endpoint/vault 2개 미통과를 기록한다.
- 따라서 Docker와 WSL runtime blocker는 해소되었지만, RTA-COMP-015는 실제 조직 OpenVAS/ZAP와 실제 6개 도구 운영 closure가 남아 있어 계속 `partial`이다.

## 2026-07-03 갱신 - OpenVAS/ZAP endpoint authorization diagnostics 강화

- `/api/redteam/v2/tool-credential-authorizations/{tool_id}`는 OpenVAS/ZAP authorization 시점에 `endpoint_ref_diagnostics`를 반환한다.
- endpoint reference에 embedded credential, secret query key, mutating path term, missing host, non-http scheme이 있으면 live import 전에 `invalid`로 차단한다.
- 응답에는 한국어 `operator_setup_guidance_ko`가 포함되어 secret 값 금지, external vault reference 사용, 승인된 read-only report/passive alert URL 사용을 초급 운영자에게 설명한다.
- 이 변경은 조직 OpenVAS/ZAP endpoint/vault 준비를 더 안전하게 만드는 사전 검증이며, 실제 조직 endpoint import 성공 또는 6개 도구 운영 closure를 완료 증거로 대체하지 않는다.

## 2026-07-03 갱신 - 필수 6개 분석도구 collection coverage gate

- `/api/redteam/v2/toolchains/{toolchain_id}/collect-results`는 `required_analysis_tool_coverage`를 반환한다.
- coverage는 Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP 각각의 present/missing, 분석 에이전트 정규화, Evidence 후보 생성 여부를 분리한다.
- 2개 도구만 수집된 경우 collection 자체는 `collected`일 수 있지만 `completion_gate_ready=false`와 `missing_required_tool_ids`가 남아 전체 운영 완료로 볼 수 없다.
- 6개 도구 imported-output collection은 coverage complete와 `completion_gate_ready=true`를 반환하지만, 이후 Evidence 승인, Finding severity 2인 승인, Matrix/Report/export/completion gate가 별도로 필요하다.

## 2026-07-03 갱신 - RedTeam2 필수 6개 도구 coverage 화면 가시성

- RedTeam2 복합 실행 요약에 `필수 6개 도구 coverage`와 `누락 필수 도구` row를 추가했다.
- collection 영역에는 `필수 6개 분석도구` 표가 표시되며, 각 도구별 coverage 상태, LLM 분석 에이전트, Evidence ID 또는 다음 행동을 한국어로 보여준다.
- frontend runtime readiness contract와 Korean copy inventory가 새 coverage 문구와 API field anchor를 검사한다.
- 이 변경은 운영자 가시성을 높이는 UI 증거이며 실제 운영 산출물과 승인 gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - 실제 운영 증거 누락 도구 remediation 안내

- `/api/redteam/v2/toolchains/real-operating-evidence-readiness`는 누락된 필수 도구별 `missing_tool_remediation`을 반환한다.
- 각 remediation row는 `expected_filename_patterns`, `operator_action_ko`, `accepted_formats_ko`, `does_not_execute_tool=true`를 포함한다.
- RedTeam2는 `누락 도구`, `예상 파일명 패턴`, `다음 행동`, `안전` 표로 이 값을 표시한다.
- 이 변경은 운영자가 누락 파일을 준비하도록 돕는 안내이며 실제 scanner 실행, Evidence 승인, Finding/Report/export/completion gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - 분석도구 실행 버튼 readiness 계약

- `/api/redteam/v2/toolchains/launch-readiness`는 Nuclei/OpenVAS/Trivy/SCA/npm audit/OWASP ZAP별 실행 버튼 상태를 반환한다.
- 각 row는 `button_label_ko`, `can_execute_now`, `blocked_reasons`, `primary_api`, `commands_executed_by_api=false`를 포함한다.
- RedTeam2는 `분석도구`, `버튼`, `실행 상태`, `차단 사유`, `사용자 안내`, `연결 API` 표로 이 값을 표시한다.
- 이 변경은 버튼 readiness 안내이며 실제 scanner 실행, Evidence 승인, Finding/Report/export/completion gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - 운영 closure 준비 요약

- `/api/redteam/v2/toolchains/operating-closure-readiness-summary`는 실제 운영 증거 사전 점검과 운영 closure 제출 패키지 상태를 한 번에 반환한다.
- 응답은 `workflow_steps`, `blockers`, `missing_required_tool_ids`, `next_api`, `ready_for_operating_closure_human_review`, `does_not_mark_goal_complete=true`를 포함한다.
- RedTeam2는 `운영 closure 준비 요약`, `운영 closure 다음 단계`, `운영 closure 준비 blocker` 표로 사람 검토 직전 상태를 표시한다.
- 이 변경은 사람 검토로 넘어갈 준비 판단이며 실제 scanner 실행, Evidence 승인, Finding/Report/export/completion gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - 저장된 toolchain 실행 상태 조회

- `/api/redteam/v2/toolchains/{toolchain_id}/run-status`는 저장된 `toolchain-runs` artifact를 다시 읽어 실행 상태를 반환한다.
- 응답은 `run_status`, `step_rows`, `run_ids`, `raw_artifact_refs`, `can_collect_results`, `collectable_step_count`, `primary_next_api`, `does_not_mark_goal_complete=true`를 포함한다.
- RedTeam2는 `저장 실행 상태 다시 불러오기`, `저장 실행 상태`, `저장 실행 단계` 표로 도구별 결과 회수 가능 여부를 표시한다.
- 이 변경은 저장 상태 조회만 수행하며 scanner 재실행, 결과 회수, Evidence 승인, Finding/Report/export/completion gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - runtime partial 상태의 안전 로컬 smoke 실행

- `/api/redteam/v2/toolchains/execute-governed`는 `allow_safe_local_smoke_when_runtime_partial=true`일 때 `runtime_preflight_status=partial_safe_local_smoke`를 반환할 수 있다.
- 허용 범위는 `local_subprocess_shim`에서 실행되는 version-only 설치 확인 smoke이며, `--version`, `-version`, `-v`, `version` 외의 임의 scan command는 차단된다.
- RedTeam2는 복합 실행 payload에 이 옵션을 포함하고 `안전 smoke 부분 실행` row로 부분 preflight 상태를 표시한다.
- 이 변경은 설치 확인 smoke 실행 진전이며 실제 운영 scanner 산출물, OpenVAS/ZAP endpoint import, Evidence/Finding/Report/export/completion gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - RedTeam2 안전 설치 확인 smoke 버튼

- RedTeam2에 `안전 설치 확인 smoke` 버튼을 추가했다.
- 버튼은 Nuclei/Trivy/npm audit 중 선택 가능한 도구의 version-only 명령을 자동 구성하고 `require_runtime_preflight=true`, `allow_safe_local_smoke_when_runtime_partial=true`, `runner_backend=local_subprocess_shim`로 `/api/redteam/v2/toolchains/execute-governed`를 호출한다.
- 실행 결과는 저장 실행 상태 projection을 갱신해 `결과 회수·Evidence 후보` 흐름으로 이어질 수 있다.
- 이 변경은 사용자가 임의 명령을 작성하지 않아도 설치 확인 smoke를 시작하게 하는 UI 계약이며, 실제 취약점 스캔이나 운영 closure gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - OpenVAS/ZAP service import 결과 회수 연결

- `/api/redteam/v2/scanner-service-imports/{tool_id}`가 `toolchain_id`를 받으면 read-only service import 결과를 `toolchain-runs` projection으로 저장한다.
- projection은 `run-status`와 `collect-results` API를 반환해 가져온 OpenVAS/ZAP report/passive alert를 Evidence 후보 workflow로 넘긴다.
- RedTeam2는 `읽기 전용 서비스 결과 가져오기` 성공 시 저장 실행 상태를 `loaded-from-service-import`로 갱신한다.
- 이 변경은 read-only 가져오기 결과 연결이며 실제 조직 endpoint/vault 실측, 6개 도구 coverage, Evidence 승인, Finding/Report/export/completion gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - 필수 6개 도구 운영 작업 순서 안내

- `/api/redteam/v2/toolchains/six-tool-work-order`는 필수 6개 분석도구별 다음 버튼, 필요 입력, 차단 사유, 연결 API를 반환한다.
- OpenVAS/ZAP는 `읽기 전용 서비스 결과 가져오기`, SCA는 `결과 첨부`, runner 준비 도구는 `승인된 실행 시작`, 설치/신뢰 미충족 도구는 `설치 확인` 또는 wrapper pin 승인으로 안내한다.
- RedTeam2는 `6개 도구 작업 순서 만들기` 버튼과 `작업 순서` 표로 이 work order를 표시한다.
- 이 변경은 초급 운영자 workflow 안내이며 scanner 명령, Docker/WSL, network, active scan을 실행하지 않고 전체 목표를 완료 처리하지 않는다.

## 2026-07-03 갱신 - 분석가용 실행 안내와 환경 설정 분리

- RedTeam2는 복잡한 runtime readiness 나열을 분석가용 첫 화면에서 분리했다.
- `분석가용 다음 실행 안내` 패널은 사용자가 누를 버튼 5개와 목적만 먼저 보여준다.
- Docker, WSL, OpenVAS/ZAP endpoint, 외부 vault reference, promotion gate, runbook 세부 항목은 `분석 환경 설정(관리자용)` 패널로 이동했다.
- 이 변경은 사용자 이해도를 높이는 UI 분리이며 승인·runtime·Evidence·completion gate를 생략하지 않는다.

## 2026-07-03 갱신 - 필수 6개 도구 운영 제출 양식 생성

- `/api/redteam/v2/toolchains/six-tool-submission-template`는 six-tool work order를 운영 증거 제출용 `collection_package`와 `attachment_template_json`으로 변환한다.
- RedTeam2 `6개 도구 제출 양식 만들기` 버튼은 attachment template JSON을 운영 증거 제출 첨부 JSON 입력란에 자동으로 채운다.
- 템플릿은 Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP별 예상 파일명 패턴과 artifact_path 입력 위치를 제공한다.
- 이 변경은 제출 UX를 돕는 템플릿이며 실제 파일 hash/status 검증과 사람 승인은 후속 submission manifest와 Evidence Card import gate에서 필요하다.

## 2026-07-03 갱신 - 안전 설치 확인 smoke의 필수 도구 확대

- RedTeam2 `안전 설치 확인 smoke` 버튼은 Nuclei/OpenVAS/Trivy/npm audit/OWASP ZAP의 version-only 명령을 자동 구성한다.
- Nuclei/OpenVAS/ZAP는 `dry_run`, Trivy/npm audit은 `sandbox_execute`를 사용하며 SCA는 import-only 제출 안내로 분리한다.
- API regression은 runtime partial 상태에서도 high-risk scanner version-only dry-run만 허용되고 `active_scan_executed=false`가 유지됨을 검증한다.
- 이 변경은 설치 확인 smoke를 넓힌 것이며 실제 운영 scanner 산출물, OpenVAS/ZAP endpoint import, Evidence/Finding/Report/export/completion gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - runtime readiness 역할별 요약 계약

- `/api/redteam/v2/runtime-readiness`는 `analyst_readiness_summary`, `operator_environment_summary`, `role_separated_next_steps`를 반환한다.
- 분석가용 요약은 다음 버튼, 결과 첨부 가능 여부, 능동 스캔 금지, 쉬운 blocker 설명을 한국어로 제공한다.
- 관리자용 요약은 Docker/WSL/OpenVAS/ZAP endpoint/vault/strict promotion 같은 분석 환경 설정 세부 단계를 보존한다.
- RedTeam2는 `분석가 안내`와 `관리자 환경 단계` 표를 역할별 요약에서 렌더링한다.
- 이 변경은 readiness 나열 혼재를 줄이는 UX/API 계약이며 실제 운영 scanner 산출물과 completion gate 완료를 대신하지 않는다.

## 2026-07-03 갱신 - 도구 실행 결과 진행 요약

- run-status와 collect-results API는 `analyst_progress_summary`를 반환한다.
- RedTeam2는 `분석가 진행 요약`과 `진행 단계` 표로 다음 버튼과 Evidence workflow 단계를 보여준다.
- run-status는 회수 가능 단계가 있으면 `결과 회수·Evidence 후보`, collect-results는 Evidence 후보 생성 후 `Evidence 후보 승인`을 다음 버튼으로 안내한다.
- 이 변경은 상태 projection이며 Evidence 승인, Finding severity 승인, Matrix/Report/export/completion gate를 대신하지 않는다.

## 2026-07-03 갱신 - OpenVAS/ZAP 서비스 가져오기 진행 요약

- `/api/redteam/v2/scanner-service-imports/{tool_id}`는 toolchain projection 생성 시 `analyst_progress_summary`를 반환한다.
- 서비스 가져오기 직후 요약의 다음 버튼은 `결과 회수·Evidence 후보`이며 `result_collection` 단계가 ready 상태가 된다.
- RedTeam2는 `서비스 가져오기 진행`과 `서비스 다음 단계` 표로 OpenVAS/ZAP read-only import 이후의 다음 행동을 보여준다.
- 이 변경은 read-only service import projection UX이며 Evidence 승인, Finding severity 승인, Matrix/Report/export/completion gate를 대신하지 않는다.

## 2026-07-03 갱신 - 운영 closure 진행 요약

- 운영 closure 계열 API는 공통 `operating_closure_progress_summary`를 반환한다.
- 요약은 다음 버튼, 다음 API, 단계별 상태, 누락 필수 도구, blocker, 명령 미실행 safe flag, `does_not_mark_goal_complete=true`를 포함한다.
- RedTeam2는 최신 closure 결과에서 `운영 closure 진행 요약`과 `운영 closure 단계` 표를 표시한다.
- 이 변경은 초급 분석가용 projection이며 실제 조직 scanner 산출물, Evidence 승인, Finding severity 승인, Report export, completion gate 완료를 대신하지 않는다.

## 운영 규칙

1. `redteam_ax_completion_audit_matrix.json`의 모든 `audit_items[].status`가 `proved`가 되기 전에는 전체 `/goal`을 완료로 표시하지 않는다.
2. `partial`, `gap`, `blocked`, `unverified` 항목은 후속 슬라이스 후보로 남긴다.
3. 새 기능은 이 매트릭스의 기존 요구사항에 evidence ref를 추가하거나 새 요구사항을 추가한 뒤 sanity test를 통과시킨다.
4. Report gate의 0-count는 필수 조건이지만, 설치/runtime/credential/UX 요구까지 대신 증명하지는 않는다.
5. archive/runs, fixture, smoke, sanity, sample, test-like, CASE-V2 산출물은 실제 운영 절차로 재수집·승인·matrix 연결되기 전까지 최종 완료 증거나 Report Claim 근거로 사용하지 않는다.
