---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-02T10:27:08+09:00
---

# Insight

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업

# Insights

- A real container run produces multiple evidence classes: launch controls and scanner stdout/stderr.
- The parser should not choose one and discard the other.
- Combined parser naming such as `container_launch_plan+trivy_json` makes the mixed evidence source explicit.
- Scanner candidates remain untrusted and require human validation even when produced by a governed runner.
