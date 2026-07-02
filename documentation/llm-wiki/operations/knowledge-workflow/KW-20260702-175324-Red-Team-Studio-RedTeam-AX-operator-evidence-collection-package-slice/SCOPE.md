---
type: scope
task_id: KW-20260702-175324-Red-Team-Studio-RedTeam-AX-operator-evidence-collection-package-slice
project: Red Team Studio
task: RedTeam AX operator evidence collection package slice
created: 2026-07-02T17:53:24+09:00
enforcement_level: L2-or-higher
---

# Scope

## User Intent

RedTeam AX의 남은 live readiness blocker(Docker, WSL, OpenVAS/ZAP endpoint/vault/import, strict promotion)를 운영자가 Evidence Card 후보로 첨부할 수 있도록 증거 수집 패키지, API projection, RedTeam2 한국어 UI, accepted gate를 추가한다.

## Included

- Live readiness remediation runbook을 operator evidence collection package로 변환하는 sanity script.
- `/api/redteam/v2/runtime-readiness` read-only projection 확장.
- RedTeam2 runtime readiness panel의 한국어 evidence package 표시.
- FINAL_PLAN, Detailed_PLAN, LLM wiki, completion audit matrix 갱신.
- Focused sanity와 accepted gate manifest 20/20 검증.

## Excluded

- Docker daemon 복구, WSL distro 복구, 조직 OpenVAS/ZAP endpoint/vault 실제 설정.
- Active scan 실행 또는 scanner command 자동 실행.
- Secret material 수집 또는 저장.

## Work Units

| unit | description | expected_artifact |
|---|---|---|
| WU-001 | operator evidence collection package 생성 | `archive/runs/redteam-ax-v2-operator-evidence-collection/latest_operator_evidence_collection_package.json` |
| WU-002 | API/UI projection 연결 | `runtime/redteam_v2_models.py`, `reports.js` |
| WU-003 | contracts/docs/audit 갱신 | FINAL_PLAN, Detailed_PLAN, LLM wiki, completion audit |
| WU-004 | sanity/accepted gate 검증 | `latest_accepted_gate_manifest.json` |

## Verification Criteria

| criterion | evidence_required |
|---|---|
| Package generated | script exit_code 0, artifact path exists |
| API projection covered | pytest runtime readiness projection test passed |
| UI copy covered | frontend runtime readiness contract and Korean inventory passed |
| Audit/docs valid | plan contract and completion audit sanity passed |
| Accepted gates pass | accepted_gate_count 20, passed_gate_count 20, failed_gate_count 0 |
