---
type: tool_decision
status: updated
project: Red-Team-Studio
task: Continue RedTeam AX updated goal with six-tool execution/result UX
created: 2026-07-07T09:27:35+09:00
---

# Tool Decision

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| `rg` | 빠른 위치 탐색 | broad search는 noisy | source/test narrowing | 사용 |
| `Get-Content -Encoding UTF8` | 한글 파일 확인 | 큰 파일은 slice 필요 | line range inspection | 사용 |
| `apply_patch` | 변경 범위 명확 | context mismatch 가능 | scoped edits | 사용 |
| `node --check` | JS syntax 빠른 확인 | runtime UI는 보지 않음 | sanity tests | 사용 |
| repo `.venv` pytest | backend regression 검증 | global Python과 다름 | selected API tests | 사용 |

## 실제 사용 결과

Global `python -m pytest` failed because pytest was absent. Repo `.venv` pytest passed selected backend regressions.
