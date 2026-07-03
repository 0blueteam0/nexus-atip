---
type: insight
status: draft
project: Red-Team-Studio
created: 2026-07-03T05:07:47+09:00
---

# Insight

## 관찰

## 통찰

## 제안

## 적용 가능 범위

## 후속 작업

## Insights - runtime preflight and objective revision

- Runtime readiness visibility is not enough for real operation. The governed execution endpoint must consume the readiness state before launching runner commands; otherwise the UI can show blockers while the execution button still attempts a subprocess.
- The safe compatibility point is an explicit `require_runtime_preflight` flag. Existing regression tests and operator-import paths remain stable, while RedTeam2 runner-mode execution becomes stricter.
- The revised objective adds a completion-evidence constraint: fixture, smoke, archive run, and other development byproducts can prove contracts or safety controls, but they must not be used as real operating completion evidence unless they follow the approved ROE/HITL/Evidence workflow.
- The current work advances the goal by preventing premature tool launch and by marking development byproduct exclusion as a partial audit requirement rather than a completed claim.
