---
type: insight
status: complete
project: Red Team Studio
created: 2026-07-03T11:36:25+09:00
---

# Insight

## 관찰

- Docker Desktop engine is now available and can run the pinned local Trivy image through RedTeam AX governance.
- WSL distributions are still stopped and the selected Ubuntu-22.04 start probe fails.
- External OpenVAS/ZAP readiness still lacks organization endpoint and vault reference environment variables.

## 통찰

The previous Docker blocker was environmental and has cleared, but the first real smoke exposed a genuine launcher correctness issue: image ENTRYPOINT metadata can alter the approved command. Clearing ENTRYPOINT is the safer default because RedTeam AX should execute only the reviewed argv.

## 제안

Keep the ENTRYPOINT clearing policy as a permanent guardrail. Treat Docker runtime readiness as improved, but keep the completion gate blocked until WSL/external scanner readiness and real operating closure evidence exist.

## 적용 가능 범위

Applies to RedTeam AX ephemeral container runner executions for scanner/tool metadata commands and future approved containerized tool runs.

## 후속 작업

- Fix WSL distribution start/tool path readiness.
- Configure OpenVAS/ZAP read-only endpoints and vault refs.
- Run real non-byproduct six-tool operating closure with real approvers.
