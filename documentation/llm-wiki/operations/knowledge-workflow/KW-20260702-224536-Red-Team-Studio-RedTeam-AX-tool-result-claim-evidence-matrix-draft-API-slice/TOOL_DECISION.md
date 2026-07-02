---
type: tool_decision
status: complete
project: Red Team Studio
task: RedTeam AX tool result claim evidence matrix draft API slice
created: 2026-07-02T22:45:36+09:00
---

# Tool Decision

## 작업 목표

Tool result Finding/Claim review 후보를 승인 조건을 만족한 Claim-Evidence Matrix draft row로만 report validation preview에 연결한다.

## 선택한 도구 체인

| 도구 | 판정 | 이유 |
|---|---|---|
| chatshare-artifact-lab skill | 사용 | 사용자가 명시했고, 공개 ChatShare 추출물의 범위와 overclaim 방지 규칙이 필요했다. |
| rg / Get-Content | 사용 | backend/frontend/test/doc 위치를 빠르게 찾았다. |
| apply_patch | 사용 | 소스와 문서를 좁은 범위로 수정했다. |
| project .venv pytest | 사용 | 시스템 Python에는 pytest가 없고 repo 가상환경에는 있었다. |
| accepted gate manifest | 사용 | RedTeam AX accepted gate 전체를 한 번에 검증한다. |

## 버린 대안

- 전역 `pytest`: PATH에 없음.
- 시스템 `python -m pytest`: pytest module 없음.
- report claim 자동 삽입: Evidence/Finding 승인 전 claim 오염 위험 때문에 배제.

## 다음 재사용 규칙

Matrix draft 이후 report generation을 붙일 때도 ready row만 payload에 넣고 held row는 별도 blocker로 남긴다.
