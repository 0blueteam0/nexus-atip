---
type: ontology_edges
status: updated
project: Red-Team-Studio
created: 2026-07-07T09:27:35+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| RedTeam2 safe install smoke | validates | installed CLI version-only tools | EU-REDTEAM2-SCA-IMPORT-ONLY-GUIDANCE-20260707 | Nuclei/OpenVAS/Trivy/npm audit/ZAP only |
| SCA Dependency Analyzer | requires | operator import artifact | EU-REDTEAM2-SCA-IMPORT-ONLY-GUIDANCE-20260707 | SBOM, lockfile, CycloneDX, or org SCA export |
| operator import artifact | feeds | toolchain collect-results | EU-REDTEAM2-SCA-IMPORT-ONLY-GUIDANCE-20260707 | no scanner command execution |
| collect-results | creates | Evidence Card candidates | EU-REDTEAM2-SCA-IMPORT-ONLY-GUIDANCE-20260707 | human approval still required |
