---
type: insight
status: draft
project: Red Team Studio
created: 2026-07-07T12:49:08+09:00
---

# Insight

## 관찰

Sigma CLI is a good first promotion candidate because it exercises the real frontend runner path without active scanning.

## 통찰

Optional ToolProfiles need a separate coverage model. Otherwise every promoted helper tool would accidentally expand the required completion gate.

## 제안

Create dedicated per-tool virtual environments or lock groups before installing more Python security tools into the shared project `.venv`.

## 적용 가능 범위

Applies to optional analysis tools, detection engineering workflow, and future low-risk tool promotion.

## 후속 작업

Add a dependency-isolated tool runtime for Sigma CLI, then promote gitleaks or subfinder.
