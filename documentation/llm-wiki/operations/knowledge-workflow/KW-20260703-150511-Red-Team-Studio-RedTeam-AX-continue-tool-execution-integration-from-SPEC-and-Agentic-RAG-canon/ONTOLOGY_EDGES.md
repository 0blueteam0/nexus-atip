---
type: ontology_edges
status: complete
project: Red-Team-Studio
task: RedTeam AX continue tool execution integration from SPEC and Agentic RAG canon
created: 2026-07-03T15:05:11+09:00
---

# Ontology Edges

| source | relation | target | evidence |
|---|---|---|---|
| RedTeam2 Safe Smoke Button | builds | Version-only Toolchain Steps | reports.js |
| Nuclei/OpenVAS/ZAP | use_execution_mode | dry_run | reports.js, tests |
| Trivy/npm audit | use_execution_mode | sandbox_execute | reports.js |
| SCA | uses | import-only evidence submission | reports.js |
| Safe Smoke Output | is_not | Final Completion Evidence | goal-completion-review |
