---
type: tool_decision
status: draft
project: Red Team Studio
task: RedTeam AX real operating E2E next progress slice
created: 2026-07-03T04:15:22+09:00
---

# Tool Decision

## 작업 목표

Improve RedTeam AX progress toward real multi-tool analysis by strengthening SCA/CycloneDX SBOM evidence normalization.

## 필요한 능력

Python normalizer changes, API regression coverage, Korean UI copy updates, project sanity gate validation.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| Existing SCA normalizer | Directly feeds Evidence candidate flow | Needs careful schema handling | collect-results and agent-analyze | selected |
| New endpoint | Explicit API surface | Duplicates collection path | Would need more gates | rejected |
| Frontend-only copy | Low risk | Does not improve evidence data | Korean inventory only | rejected |

## 선택한 도구 또는 도구 체인

`rg` inspection, `apply_patch`, focused pytest, full router pytest, py_compile, node check, sanity scripts, accepted gate manifest.

## 선택 이유

The goal requires usable SCA analysis results. The existing normalizer is the correct place to make SBOM content traceable as Evidence candidates.

## 버린 대안과 이유

No new scanner execution was added because active/remote execution remains governed by ROE/HITL and current blockers are environmental.

## 실패 시 fallback

Keep the regression limited to operator-import CycloneDX fixture and avoid changing downstream Finding/report gates.

## 실제 사용 결과

SCA focused regression passed; full router regression passed with 72 tests.

## 다음 재사용 규칙

For any new SCA schema, preserve component inventory separately from vulnerability claims and require human match review before report use.
