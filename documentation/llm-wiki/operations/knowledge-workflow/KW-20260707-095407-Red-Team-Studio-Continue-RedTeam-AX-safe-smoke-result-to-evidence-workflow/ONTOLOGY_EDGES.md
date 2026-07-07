---
type: ontology_edges
task_id: KW-20260707-095407-Red-Team-Studio-Continue-RedTeam-AX-safe-smoke-result-to-evidence-workflow
project: Red-Team-Studio
task: Continue RedTeam AX safe smoke result to evidence workflow
created: 2026-07-07T09:54:07+09:00
---

# Ontology Edges

| subject | relation | object |
|---|---|---|
| RedTeam2 safe local smoke | produces | install version evidence candidate |
| install version evidence candidate | requires | operator attestation |
| install version evidence candidate | must_not_unlock | scanner runner |
| install version evidence candidate | must_not_promote | Finding or Claim |
| RedTeam2 UI | displays | `설치 확인 결과 후보` |
| SCA/SBOM dependency check | remains | import-only guidance |
