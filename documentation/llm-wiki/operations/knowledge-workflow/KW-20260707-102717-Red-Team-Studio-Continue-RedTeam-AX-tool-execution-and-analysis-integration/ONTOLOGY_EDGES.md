---
type: ontology_edges
status: draft
project: Red Team Studio
created: 2026-07-07T10:27:17+09:00
---

# Ontology Edges

| subject | predicate | object | evidence_id | note |
|---|---|---|---|---|
| RedTeam AX toolchain execution preset | fills | RedTeam2 composite runner inputs | EV-004 | Preset application only, not direct execution. |
| Trivy preset | uses | governed runner after wrapper/ROE/token gates | EV-002 | Low-risk local analysis candidate. |
| npm audit preset | uses | governed runner after wrapper/ROE/token gates | EV-002 | Lockfile-oriented analysis candidate. |
| Nuclei/OpenVAS/ZAP | require | HITL approval or read-only service/report import | EV-002 | High-risk scanner separation. |
| SCA | requires | SBOM/SCA artifact import | EV-002 | No scanner command execution. |
| Tool output | must pass | sanitizer and analysis agent normalizer before Evidence candidate | EV-001 | SPEC 27/28 pipeline. |

