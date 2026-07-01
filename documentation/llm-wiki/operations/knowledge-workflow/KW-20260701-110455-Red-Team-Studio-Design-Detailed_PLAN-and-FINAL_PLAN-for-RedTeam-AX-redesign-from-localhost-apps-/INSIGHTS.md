---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-01T11:04:55+09:00
---

# Insight

## 관찰

- Existing `reports.js` combines tab rendering, state, API calls, and report transformations in one module.
- Existing backend already has safe ASM, evidence graph, report compiler, release gate, and MCP evaluation.
- ChatShare emphasizes ToolHub, ScriptFactory, ToolActionCard, Evidence Card, and Claim-Evidence Matrix as required product concepts.

## 통찰

`레드팀 분석2` should first isolate state and route contracts before any deeper refactor. This prevents a large redesign from destabilizing the current `레드팀 분석` tab.

## 제안

Implement M1 as a clone-with-namespace step, then M2 backend v2 route skeleton, then ToolActionCard/Evidence/Report gates.

## 적용 가능 범위

Report Studio frontend, RedTeam AX backend, LLM wiki and evidence workflow.

## 후속 작업

Start from `FINAL_PLAN.md` M1 and verify with frontend build plus a Playwright screenshot after starting port 5177.

