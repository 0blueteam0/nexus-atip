---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-03T04:15:22+09:00
---

# Insight

## 관찰

SCA was registered as a named RedTeam AX tool, but SBOM component inventory and vulnerability applicability were not strongly separated.

## 통찰

Claim-Evidence traceability improves when component presence Evidence is distinct from vulnerability candidate Evidence. `affects` is a relationship to review, not a final claim.

## 제안

Future parsers should emit relationship fields and explicit human-review flags whenever tool output implies, but does not prove, applicability.

## 적용 가능 범위

SCA, Trivy SBOM mode, npm audit advisories, and future OSS/dependency scanner integrations.

## 후속 작업

Run a real CycloneDX/SCA artifact through the complete Evidence/Finding/Report/export chain.
