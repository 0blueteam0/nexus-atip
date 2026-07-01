---
type: tool_decision
status: draft
project: Red Team Studio
task: Implement RedTeam AX v2 tool result import normalize and evidence candidate APIs
created: 2026-07-01T13:14:12+09:00
---

# Tool Decision

## Selected Tools

| tool | purpose | reason |
|---|---|---|
| `rg` | locate ToolResultNormalizer requirements | fast scoped search |
| `Get-Content -Encoding UTF8` | inspect Korean specs/code | avoids mojibake |
| `apply_patch` | source/test/doc edits | scoped and reviewable |
| `.venv/Scripts/python.exe` | backend tests | project virtualenv |
| `npm.cmd run build` | frontend regression | existing Vite command |
| `Invoke-RestMethod` | live API smoke | direct runtime evidence |

Rejected alternatives:

- Raw output direct report linking: rejected by SPEC 28.
- Auto-approved EvidenceCard from normalized output: rejected because analyst review is required.

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

