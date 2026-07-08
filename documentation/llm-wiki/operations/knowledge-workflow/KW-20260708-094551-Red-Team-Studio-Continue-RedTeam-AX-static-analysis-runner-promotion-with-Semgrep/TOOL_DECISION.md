---
type: tool_decision
status: draft
project: Red Team Studio
task: Continue RedTeam AX static analysis runner promotion with Semgrep
created: 2026-07-08T09:45:51+09:00
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

- Selected tool: Semgrep Community Edition 1.168.0.
- Source basis: PyPI latest release and Semgrep Community Edition documentation.
- Installation decision: isolated tool venv under `Red Team Studio/고도화/tool-runtimes/semgrep_1.168.0_venv`.
- Reason: direct install into project `.venv` downgraded `click`, `mcp`, `jsonschema`, and `opentelemetry` packages, conflicting with existing project packages. The project `.venv` was restored and Semgrep was isolated.
- API execution mode: `sandbox_execute` only with local rule and single approved sample file.
