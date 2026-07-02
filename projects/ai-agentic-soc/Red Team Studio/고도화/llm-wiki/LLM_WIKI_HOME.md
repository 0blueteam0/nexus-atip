---
title: Red Team Studio LLM Wiki Home
type: project_wiki_index
zk_type: index
para: Projects
status: active
created: 2026-07-01
updated: 2026-07-02
canonical_path: J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/llm-wiki/LLM_WIKI_HOME.md
project: Red Team Studio
source_path:
  - J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio
  - J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-work-folder-inventory-20260701/WORK_FOLDER_INDEX.md
  - https://chatgpt.com/share/6a4471ca-75b0-83ee-a10d-8d36dee74aa7
collected_via:
  - local_folder_inventory
  - chatshare-artifact-lab
  - source_code_inspection
evidence_level: local_manifest_plus_extracted_public_chat
related:
  - ../../redteam_ax_plan.md
  - ../../Detailed_PLAN.MD
  - ../../FINAL_PLAN.md
  - ../completion-audit/REDTEAM_AX_COMPLETION_AUDIT_MATRIX.md
  - ../completion-audit/redteam_ax_completion_audit_matrix.json
  - ../completion-audit/redteam2_korean_copy_inventory.json
  - ./RED_TEAM_STUDIO_FILE_MANIFEST.json
  - ./RED_TEAM_STUDIO_TOP_DIR_SUMMARY.json
  - ./RED_TEAM_STUDIO_EXTENSION_SUMMARY.json
tags: [redteam-ax, llm-wiki, evidence, report-studio, chatshare, guardrails]
---

# Red Team Studio LLM Wiki Home

## 목적

이 문서는 `Red Team Studio` 전체 폴더, ChatShare 레드팀 수행과정, 기존 frontend/backend 작업물, RedTeam AX plan/spec을 LLM이 다시 호출할 수 있도록 연결하는 정본 진입점이다.

## 빠른 시작

1. 제품 목표는 `../../redteam_ax_plan.md`를 먼저 읽는다.
2. 대규모 개편 계획은 `../../Detailed_PLAN.MD`와 `../../FINAL_PLAN.md`를 읽는다.
3. 전체 파일 목록은 `./RED_TEAM_STUDIO_FILE_MANIFEST.json`에서 검색한다.
4. 디렉터리 분포는 `./RED_TEAM_STUDIO_TOP_DIR_SUMMARY.json`을 확인한다.
5. 확장자 분포는 `./RED_TEAM_STUDIO_EXTENSION_SUMMARY.json`을 확인한다.
6. ChatShare 추출 패키지는 `../chatshare-output/chatgpt/레드팀_수행과정_20260701-110739.HANDOFF_PACKAGE_MANIFEST.json`부터 연다.
7. 전체 목표 완료 여부는 `../completion-audit/REDTEAM_AX_COMPLETION_AUDIT_MATRIX.md`와 `../completion-audit/redteam_ax_completion_audit_matrix.json`에서 요구사항별 증거 상태를 확인한다.

## 핵심 자료 지도

| 자료 | 경로 | 용도 |
|---|---|---|
| Product plan | `../../redteam_ax_plan.md` | 전체 제품 목표, phase, 종료 조건 |
| SDD specs | `../../SPEC` | 기능/기술/API/guardrail/tooling/report spec |
| Agentic RAG specs | `../../Agentic RAG SPEC` | Agentic RAG와 GraphRAG 요구사항 |
| Starter v1.2 | `../../v1.2/redteam_ax_starter_pack_v1_2_mcp/redteam-ax-starter` | 최신 starter implementation |
| ChatShare transcript | `../chatshare-output/chatgpt/레드팀_수행과정_20260701-110739.conversation.md` | 수행과정과 guardrail/tooling 요구 |
| Existing work index | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-work-folder-inventory-20260701/WORK_FOLDER_INDEX.md` | 기존 runtime/frontend/archive 지도 |
| Existing frontend | `J:/PortableApps/genai/projects/ai-agentic-soc/soc-frontend-vite-react/soc-frontend/idiomatic-react` | `레드팀 분석2` UI 구현 대상 |
| Existing backend | `J:/PortableApps/genai/projects/ai-agentic-soc/runtime` | `/api/redteam/v2` 구현 대상 |
| Completion audit | `../completion-audit/REDTEAM_AX_COMPLETION_AUDIT_MATRIX.md` | 전체 목표 완료/미완료 요구사항별 증거 장부 |
| RedTeam2 Korean copy inventory | `../completion-audit/redteam2_korean_copy_inventory.json` | RedTeam2 visible copy의 한국어/초급자 UX sanity 결과 |
| Scanner install evidence | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2/CASE-V2-TOOL-INSTALL-EVIDENCE-001/tool-install-evidence` | Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP operator-attested version evidence |
| Governed toolchain runner | `/api/redteam/v2/toolchains/execute-governed` | 여러 설치 분석도구를 ToolActionCard/ExecutionPlan/token/wrapper gate로 순차 실행하고 결과 회수 |
| Installed tool live smoke | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-installed-tool-live-smoke/latest_installed_tool_live_smoke.json` | 설치된 `npm.cmd --version`을 governed runner로 실행하고 sanitizer, agent normalization, Evidence Card까지 연결 |
| Scanner CLI live smoke | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-scanner-cli-live-smoke/latest_scanner_cli_live_smoke.json` | 공식 checksum 검증 portable Nuclei v3.10.0/Trivy v0.72.0 CLI를 governed runner로 실행하고 Evidence Card까지 연결 |
| OpenVAS/ZAP CLI live smoke | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-openvas-zap-cli-live-smoke/latest_openvas_zap_cli_live_smoke.json` | 격리 venv 기반 `gvm-cli`/`zap-cli` shim을 governed runner로 실행하고 Evidence Card까지 연결 |
| OpenVAS/ZAP service import smoke | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-openvas-zap-service-import-smoke/latest_openvas_zap_service_import_smoke.json` | 승인된 read-only vault reference와 로컬 서비스 endpoint에서 OpenVAS XML/ZAP JSON report를 가져와 sanitizer, parser, Evidence Card까지 연결 |
| RedTeam2 service import frontend contract | `../sanity/redteam_ax_frontend_service_import_contract.py` | `OpenVAS/ZAP 서비스 결과 가져오기` 패널이 read-only service import API를 호출하고 secret material 입력/전송 없이 Evidence 후보를 표시하는지 검증 |
| Runtime readiness API | `/api/redteam/v2/runtime-readiness` | 최신 container runtime smoke, WSL runtime readiness, external scanner readiness, strict live readiness promotion, live remediation, operator evidence collection artifact를 read-only로 합쳐 Docker/WSL/OpenVAS/ZAP blocker와 operator next steps 반환 |
| RedTeam2 runtime readiness frontend contract | `../sanity/redteam_ax_frontend_runtime_readiness_contract.py` | `실행 환경 준비도 / 남은 실측 조건` 패널이 runtime readiness API를 호출하고 runbook/evidence package와 read-only safety flag를 표시하는지 검증 |
| External scanner readiness | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-external-scanner-readiness/latest_external_scanner_service_readiness.json` | 조직 OpenVAS/ZAP read-only endpoint/vault reference 준비도와 현재 blocker를 기계 판독 증거로 기록 |
| External scanner service import live harness | `../sanity/redteam_ax_external_scanner_service_import_live_smoke.py` | 조직 OpenVAS/ZAP read-only endpoint env가 준비되면 backend credential authorization과 scanner-service-import API를 통해 실제 report import 수행 |
| External scanner service import live artifact | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-external-scanner-service-import-live/latest_external_scanner_service_import_live_smoke.json` | 현재 조직 endpoint import 상태, blocker, 또는 실제 read-only import 결과 |
| WSL runtime readiness | `../sanity/redteam_ax_wsl_runtime_readiness.py` | WSL 배포판 목록/시작 가능성 및 scanner 도구 경로를 안전하게 확인하는 readiness checker |
| WSL runtime readiness artifact | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-wsl-runtime-readiness/latest_wsl_runtime_readiness.json` | 현재 WSL 배포판 시작 blocker 또는 ready 상태를 기계 판독 증거로 기록 |
| Strict live readiness promotion | `../sanity/redteam_ax_strict_live_readiness_promotion.py` | Docker real container, WSL ready, OpenVAS/ZAP readiness/import live gate를 최종 승격용으로 rollup |
| Strict live readiness promotion artifact | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-strict-live-readiness-promotion/latest_strict_live_readiness_promotion.json` | 현재 strict live promotion blocker와 통과/실패 gate 수를 기계 판독 증거로 기록 |
| Live readiness remediation runbook | `../sanity/redteam_ax_live_readiness_remediation_runbook.py` | strict promotion blocker를 운영자 조치 단계와 검증 명령으로 변환 |
| Live readiness remediation artifact | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-live-readiness-remediation/latest_live_readiness_remediation_runbook.json` | Docker/WSL/OpenVAS/ZAP blocker별 owner, action, verification, evidence requirement 기록 |
| Operator evidence collection package | `../sanity/redteam_ax_operator_evidence_collection_package.py` | live remediation runbook을 Evidence Card 후보 첨부용 운영자 증거 수집 목록으로 변환 |
| Operator evidence collection artifact | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-operator-evidence-collection/latest_operator_evidence_collection_package.json` | 명령 실행 없이 Docker/WSL/OpenVAS/ZAP/promotion 증거 항목, expected attachment status, 제출 manifest template 기록 |
| Container runtime smoke | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-runtime-smoke/latest_container_runtime_smoke.json` | Docker/Podman real container smoke readiness와 Docker daemon blocker 증거 |
| Credential authorization | `/api/redteam/v2/tool-credential-authorizations` | OpenVAS/ZAP 외부 vault reference만 승인하고 read-only scope, actor binding, secret material 금지를 검증 |
| Accepted gate manifest | `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json` | API regression, sample E2E/report gate, audit sanity, plan contract, Korean copy inventory, installed-tool smoke, scanner CLI smoke, OpenVAS/ZAP CLI smoke, OpenVAS/ZAP service import smoke, frontend service import contract, frontend runtime readiness contract with runbook/evidence package visibility, external scanner readiness, external scanner service import live harness, WSL runtime readiness, strict live readiness promotion, live readiness remediation runbook, operator evidence collection package, Python compile, frontend JS check, frontend build 통과 증거 |

## 전체 인벤토리 요약

| Top directory | 역할 |
|---|---|
| `Agentic RAG SPEC` | Agentic RAG/GraphRAG SDD |
| `SPEC` | RedTeam AX core, guardrail, tooling, API, acceptance specs |
| `v1.0` | 초기 starter |
| `v1.1` | Visual Evidence 추가 starter |
| `v1.2` | MCP Gateway 포함 최신 starter와 wheel/venv |
| `logs` | 작업 로그 |
| `고도화` | 이번 개편 산출물, ChatShare, LLM wiki, sanity tests |

## ChatShare 추출 상태

| 항목 | 값 |
|---|---:|
| status | `likely-shared-chat` |
| text_length | 16,662 |
| code_blocks | 27 |
| downloads | 0 |
| hidden/login-gated artifacts | 0 |
| completion_status | `complete_for_public_snapshot` |

중요 해석:

- 이 패키지는 public snapshot 기준으로 계획에 충분하다.
- 다운로드/숨김 artifact가 없었으므로 “모든 provider 파일 복구”가 아니라 “공개 대화 본문과 코드 블록 복구”로 표현한다.
- 공유 대화 내용은 fresh vulnerability verification이 아니라 이미 분석된 아이디어/요구사항의 source material이다.

## RedTeam AX v2 주요 지식

### Guardrail

- 입력, prompt assembly, LLM output, LLM-to-tool, Tool-to-DB/API, Tool output-to-LLM, Evidence, Report export 모두 trust boundary다.
- Tool output and retrieved documents are data, not instruction.
- Screenshot is evidence, not conclusion.
- Prompt guardrail alone is insufficient.

### Tooling

- ToolHub Registry
- ToolProfile
- ToolActionCard
- ToolInstallVersionEvidence
- GovernedToolchainExecution
- ToolCredentialAuthorization
- ScriptManifest
- ScriptFactory
- ManualRunRecorder
- ToolRunRecord
- ToolResultNormalizer
- EvidenceLinker
- OSS adapter

### Report

- Volkis식 campaign walkthrough를 반영한다.
- 악성코드 보고서식 TLP, 문서정보, 개정이력, 증적 박스를 반영한다.
- Report export 전 unsupported material claim, evidence-less Finding, screenshot-only conclusion, unapproved severity/risk acceptance를 차단한다.

## 호출 규칙

LLM 또는 agent는 이 wiki를 사용할 때 다음 순서를 따른다.

1. 현재 작업 범위를 `FINAL_PLAN.md`에서 확인한다.
2. 관련 파일을 `RED_TEAM_STUDIO_FILE_MANIFEST.json`에서 찾는다.
3. 해당 spec 또는 code source를 직접 연다.
4. 새 판단은 Evidence Card 또는 Claim-Evidence Matrix로 연결한다.
5. 새 스펙 변경은 `고도화/spec-updates`에 addendum으로 남긴다.
6. 공식 산출물에는 raw command log를 넣지 않는다.

## 남은 작업

- qmd/kdq 검색 인덱스 연결
- Graph node/edge 후보 자동 생성
- Docker/container runtime live smoke 성공 증거
- 조직/실서비스 OpenVAS service report import 및 OWASP ZAP daemon passive-alert import endpoint 성공 증거
- RedTeam2 runtime readiness panel에서 blocker가 모두 `ready`로 바뀐 운영 환경 증거
