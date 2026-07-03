---
type: insight
status: complete
project: Red Team Studio
created: 2026-07-03T11:57:17+09:00
---

# Insight

## 관찰

Default `Ubuntu-22.04` fails with a VHDX mount error, but `Ubuntu-22.04-AISOC-Rebuild` starts and exposes useful tool paths. Docker and WSL now pass strict promotion; OpenVAS/ZAP external readiness remains blocked.

## 통찰

Runtime readiness should not be tied to the default WSL distro alone. A failed default distro is a remediation item, not necessarily a platform-wide blocker when an alternate approved distro works.

## 제안

Continue using fallback-aware readiness. Treat WSL as ready for runtime gating, but do not claim overall completion until external scanner endpoints and operating closure pass.

## 적용 가능 범위

RedTeam AX WSL runtime readiness and strict live readiness promotion.

## 후속 작업

Configure organization OpenVAS/ZAP read-only endpoints and vault references, then close real six-tool operating evidence.
