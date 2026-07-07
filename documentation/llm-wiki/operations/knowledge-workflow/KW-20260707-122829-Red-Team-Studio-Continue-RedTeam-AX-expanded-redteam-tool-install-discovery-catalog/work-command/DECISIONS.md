---
type: work_command_record
task_id: KW-20260707-122829-Red-Team-Studio-Continue-RedTeam-AX-expanded-redteam-tool-install-discovery-catalog
project: Red Team Studio
task: Continue RedTeam AX expanded redteam tool install discovery catalog
created: 2026-07-07T12:28:30+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## D1 - 후보와 실행 도구를 분리

Decision: Amass, ffuf, Nmap, Gitleaks는 이번 조각에서 바로 실행 가능한 ToolProfile이 아니라 `discovered_candidate_tools`로 노출한다.

Rationale: 사용자는 도구 탐색과 설치 관련 진행을 최우선으로 요구했지만, RedTeam AX의 핵심 제약은 ROE/HITL/가드레일 통과 전 고위험 실행 금지다. 따라서 설치 후보 탐색과 실제 실행 승격을 분리해야 unsupported execution 위험을 줄일 수 있다.

Impact: 프론트엔드는 확장 도구 후보를 표시하지만 실행 버튼은 제공하지 않는다. 후속 작업은 각 후보별 wrapper, policy, normalizer, Evidence mapping, 버튼 계약을 추가하는 방식으로 진행한다.

## D2 - 공식 출처 우선

Decision: 후보 근거는 공식 문서 또는 공식 GitHub 중심으로 기록한다.

Rationale: 설치 명령과 실행 방식은 자주 바뀌며, 비공식 블로그를 기준으로 자동화하면 오래된 명령이나 위험한 옵션을 제품 정책에 섞을 수 있다.

Impact: `source_basis`에 official-source review를 명시하고, 최종 답변에도 공식 출처 링크를 남긴다.

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|

## Entries
