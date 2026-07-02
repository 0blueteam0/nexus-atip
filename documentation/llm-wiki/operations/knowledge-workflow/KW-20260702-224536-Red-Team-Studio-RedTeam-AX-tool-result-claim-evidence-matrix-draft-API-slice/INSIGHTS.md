---
type: insight
status: complete
project: Red Team Studio
created: 2026-07-02T22:45:36+09:00
---

# Insight

## 관찰

Promotion API and report validation already existed, but there was no explicit staging layer that showed which tool result candidates were safe to include in a report validation payload.

## 통찰

Claim-Evidence Matrix draft should be a conservative projection: ready rows move forward, held rows stay visible but outside report input.

## 제안

Next report-generation work should accept a matrix draft ID or ready row set, not raw tool result candidates.

## 적용 가능 범위

Tool result review candidates, Agentic RAG claim candidates, operator Evidence Card import plan candidates.

## 후속 작업

Add a real-case batch promotion/review operation only after operational Evidence Card approvals exist.
