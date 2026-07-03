---
type: ontology_edges
task_id: KW-20260703-153248-Red-Team-Studio-RedTeam-AX-add-analyst-progress-summary-for-governed-toolchain-results-and-evide
project: Red Team Studio
task: RedTeam AX add analyst progress summary for governed toolchain results and evidence next steps
created: 2026-07-03T15:32:48+09:00
---

# Ontology Edges

| source | relation | target |
|---|---|---|
| `analyst_progress_summary` | projects | `toolchain run-status` |
| `analyst_progress_summary` | projects | `collect-results` |
| `RedTeam2 분석가 진행 요약` | renders | `analyst_progress_summary` |
| `Evidence candidate` | precedes | `Evidence approval` |
| `Evidence approval` | precedes | `Finding promotion` |
| `Finding promotion` | precedes | `Claim-Evidence Matrix` |
| `Claim-Evidence Matrix` | precedes | `Report v2 export` |
| `Report v2 export` | precedes | `completion gate` |
