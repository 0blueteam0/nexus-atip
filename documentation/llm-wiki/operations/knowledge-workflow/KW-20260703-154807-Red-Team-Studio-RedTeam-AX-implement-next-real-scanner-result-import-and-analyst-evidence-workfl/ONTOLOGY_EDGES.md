---
type: ontology_edges
task_id: KW-20260703-154807-Red-Team-Studio-RedTeam-AX-implement-next-real-scanner-result-import-and-analyst-evidence-workfl
project: Red Team Studio
task: RedTeam AX implement next real scanner result import and analyst evidence workflow slice
created: 2026-07-03T15:48:07+09:00
---

# Ontology Edges

| source | relation | target |
|---|---|---|
| `scanner-service-imports` | creates | `toolchain_projection` |
| `toolchain_projection` | exposes | `analyst_progress_summary` |
| `서비스 가져오기 진행` | renders | `analyst_progress_summary` |
| `OpenVAS/ZAP read-only import` | precedes | `collect-results` |
| `collect-results` | precedes | `Evidence approval` |
| `Evidence approval` | precedes | `Finding/Matrix/Report gate` |
