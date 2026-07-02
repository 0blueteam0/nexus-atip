---
type: tool_decision
project: Red Team Studio
task: RedTeam AX operator evidence collection package slice
---

# Tool Decision

| decision | selected | rationale | alternative |
|---|---|---|---|
| File search | `rg` | 빠른 코드/문서 anchor 확인 | PowerShell recursive search |
| File edits | `apply_patch` | scoped diff와 AGENTS.md 규칙 준수 | ad hoc shell writes |
| Package generator | Python sanity script | existing sanity/accepted gate pattern과 맞음 | API endpoint로 생성 |
| UI verification | static frontend contract + inventory | browser 없이 Korean copy regression 고정 | manual visual check |
| Full regression | accepted gate manifest | 현재 RedTeam AX gate set의 canonical 증거 | 개별 테스트만 실행 |

No Docker, WSL start, OpenVAS, ZAP, or network scanner execution was selected in this slice.
