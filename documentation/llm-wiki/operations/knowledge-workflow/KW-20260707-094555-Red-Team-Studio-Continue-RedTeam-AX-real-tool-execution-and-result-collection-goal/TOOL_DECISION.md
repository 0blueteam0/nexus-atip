---
type: tool_decision
status: updated
project: Red-Team-Studio
task: Continue RedTeam AX real tool execution and result collection goal
created: 2026-07-07T09:45:55+09:00
---

# Tool Decision

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| `rg` | fast code/spec search | broad output can be noisy | narrowed queries | used |
| `Get-Content -Encoding UTF8` | Korean-safe inspection | line slicing needed | exact snippets | used |
| `apply_patch` | precise edits | context mismatch possible | small patches | used |
| `node --check` | syntax check | no DOM proof | frontend sanity scripts | used |
| `.venv pytest` | API regression | selected scope only | py_compile and sanity | used |

## 실제 사용 결과

All final verification commands returned exit_code 0.
