---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-03T12:41:40+09:00
---

# Insight

## 관찰

OpenVAS/ZAP service import code exists, but real endpoint/vault configuration is still missing.

## 통찰

Authorization-time endpoint diagnostics reduce risk before operators attempt live import. The useful movement is to reject unsafe setup early, not to simulate completion.

## 제안

Use `endpoint_ref_diagnostics` in RedTeam2 service import guidance and in operator runbooks when endpoint/vault values are configured.

## 적용 가능 범위

Applies to OpenVAS/ZAP read-only report/passive alert endpoint configuration only.

## 후속 작업

Configure real endpoint/vault refs and rerun live readiness/import smokes.
