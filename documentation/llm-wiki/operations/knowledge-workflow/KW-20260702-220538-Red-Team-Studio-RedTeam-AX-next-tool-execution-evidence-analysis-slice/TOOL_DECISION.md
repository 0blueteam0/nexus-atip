---
type: tool_decision
status: draft
project: Red Team Studio
task: RedTeam AX next tool execution evidence analysis slice
created: 2026-07-02T22:05:38+09:00
---

# Tool Decision

## 작업 목표

## 필요한 능력

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| 후보 1 |  |  |  |  |
| 후보 2 |  |  |  |  |
| 후보 3 |  |  |  |  |
| 후보 4 |  |  |  |  |
| 후보 5 |  |  |  |  |

## 선택한 도구 또는 도구 체인

## 선택 이유

## 버린 대안과 이유

## 실패 시 fallback

## 실제 사용 결과

## 다음 재사용 규칙

# Tool Decision

- PowerShell and `rg`: repo inspection and focused status checks.
- `apply_patch`: manual source and documentation edits.
- Python project venv: sanity scripts, pytest, py_compile, accepted gate manifest.
- Node `--check`: frontend syntax validation.

## Safety

- No destructive git or filesystem commands.
- No active scanner execution was introduced by this slice.
- Tool output is treated as untrusted data and marked `llm_raw_tool_output_trusted=false`.
