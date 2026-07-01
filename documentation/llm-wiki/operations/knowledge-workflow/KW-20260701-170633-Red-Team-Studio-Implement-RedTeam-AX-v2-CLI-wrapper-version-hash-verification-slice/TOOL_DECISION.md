---
type: tool_decision
status: draft
project: Red-Team-Studio
task: Implement RedTeam AX v2 CLI wrapper version hash verification slice
created: 2026-07-01T17:06:33+09:00
---

# Tool Decision

## Selected Tools

- `rg`: locate existing model/router/frontend/test symbols quickly.
- `apply_patch`: scoped file edits for Python, JS, and Markdown.
- Bundled Python from Codex runtime: execute tests after installing missing FastAPI dependencies.
- `node --check`: validate frontend JS syntax.
- `npm.cmd run build`: validate production frontend bundle.
- `knowledge_workflow.py`: enforce project evidence/session gate.

## Rationale

- Registry endpoints must not execute scanner binaries or version commands. The implementation uses `shutil.which` plus file SHA-256 hashing only.
- No scanner install automation was added in this slice because the current objective is preflight visibility and runner trust gating foundation.
- UI changes remain inside the existing Report Studio state/methods file to match the current architecture and avoid unrelated refactors.

## Rejected / Deferred

- Running `nuclei`, `trivy`, `zap-cli`, `gvm-cli`, or `npm audit --version` directly: deferred because registry read APIs should be non-invasive.
- Adding expected hash persistence UI: deferred to the next slice because it needs approval workflow semantics.
- Hard-blocking the existing planning token on hash unpinned wrappers: deferred to the actual runner integration; the plan now emits explicit preflight controls and warnings.

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

