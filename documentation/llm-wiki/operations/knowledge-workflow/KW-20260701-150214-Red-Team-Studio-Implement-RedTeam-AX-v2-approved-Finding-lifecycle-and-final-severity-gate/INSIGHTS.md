---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-01T15:02:14+09:00
---

# Insight

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업

# Insights

- Report validation must not trust inline Finding fields because a report payload can claim `severity_final` without a persisted human approval record.
- Evidence approval and Finding approval are separate lifecycle gates. Evidence proves source validity; Finding approval confirms interpretation, business impact, and final severity.
- The UI should prepare approved Evidence and approved Finding before report generation so the analyst sees one coherent `Generate Report v2` workflow, while backend still keeps each approval artifact separate.
- Final severity is a business-risk decision, so `business_owner` must be a first-class approver role rather than a free-text reviewer label.
