---
type: tool_decision
status: complete
project: Red Team Studio
task: RedTeam AX WSL readiness blocker narrowing
created: 2026-07-03T11:57:17+09:00
---

# Tool Decision

## 작업 목표

Narrow the WSL runtime blocker by distinguishing a broken default distro from a usable alternate distro.

## 필요한 능력

WSL listing/start probing, artifact-preserving readiness checks, deterministic unit regression, accepted gate refresh.

## 후보 도구 비교

| 도구 | 장점 | 단점 | 기존 도구와 결합 | 판정 |
|---|---|---|---|---|
| WSL CLI | Direct distro truth | Can surface mojibake | selected for low-risk uname/path probe | selected |
| WSL readiness script | Canonical artifact | Needed fallback logic | patched | selected |
| pytest mock | Deterministic fallback proof | Not live proof alone | paired with live artifact | selected |
| accepted gate manifest | Full gate proof | Long-running | refreshed | selected |

## 선택한 도구 또는 도구 체인

WSL CLI probe -> readiness script fallback patch -> unit regression -> strict promotion -> accepted gate -> goal completion review.

## 선택 이유

This preserves evidence in the repo-native RedTeam AX artifact format and avoids destructive WSL repair/import actions.

## 버린 대안과 이유

Deleting, repairing, or importing WSL distributions was rejected because it is destructive/environmental. Running active scanners was out of scope.

## 실패 시 fallback

If no alternate distro worked, keep blocked artifact and update remediation runbook only.

## 실제 사용 결과

Alternate distro `Ubuntu-22.04-AISOC-Rebuild` passed. Remaining runtime blockers are external OpenVAS/ZAP endpoint/vault and real operating closure.

## 다음 재사용 규칙

Probe non-internal WSL distros before treating WSL as globally blocked. Preserve failed default distro evidence.
