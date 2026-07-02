---
title: RedTeam AX Completion Audit Matrix
type: completion_audit
zk_type: evidence
para: Projects
status: active_incomplete
created: 2026-07-02
updated: 2026-07-02
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
| `proved` | 14 | 현재 소스/테스트/스모크 산출물로 해당 범위를 주장 가능 |
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
- 설치된 `npm.cmd --version`의 governed runner live smoke, sanitizer, agent normalization, Evidence Card 생성
- 공식 release checksum으로 검증한 portable Nuclei v3.10.0 및 Trivy v0.72.0 CLI의 governed runner live smoke, sanitizer, agent normalization, Evidence Card 생성
- OpenVAS/ZAP 외부 vault reference 기반 read-only credential authorization API와 한국어 UI
- 전체 accepted gate manifest: API regression, sample E2E/report gate, audit sanity, plan contract, Korean copy inventory, installed-tool live smoke, Python compile, frontend JS check, frontend build 9/9 통과
- Evidence Card, Claim-Evidence Matrix, Report v2 gate 0-count 샘플 E2E
- Agentic RAG SCA/citation verifier와 unsupported claim hold
- LLM wiki의 Red Team Studio manifest, ChatShare, previous work index 연결

## 아직 완료로 주장하면 안 되는 항목

- OpenVAS/OWASP ZAP 및 Docker/container runtime live smoke 성공 증거

## 운영 규칙

1. `redteam_ax_completion_audit_matrix.json`의 모든 `audit_items[].status`가 `proved`가 되기 전에는 전체 `/goal`을 완료로 표시하지 않는다.
2. `partial`, `gap`, `blocked`, `unverified` 항목은 후속 슬라이스 후보로 남긴다.
3. 새 기능은 이 매트릭스의 기존 요구사항에 evidence ref를 추가하거나 새 요구사항을 추가한 뒤 sanity test를 통과시킨다.
4. Report gate의 0-count는 필수 조건이지만, 설치/runtime/credential/UX 요구까지 대신 증명하지는 않는다.
